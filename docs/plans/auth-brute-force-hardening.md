# Auth brute-force hardening plan

Status: implemented on branch `fix/auth-throttle-server-only` (not yet released). Decisions: 6-digit codes stay; Turnstile widget mode is Invisible; service-role key for the web throttle; mobile stays a speed bump; fail open and alert. Remaining before release: add `SUPABASE_SERVICE_ROLE_KEY` to Vercel and `apps/web/.env.local`, deploy web and a mobile build, then apply `20261106130000_lock_down_auth_throttle.sql`. Original proposal follows. Follows the review of `auth_throttle`
(`supabase/migrations/20261105144525_auth_attempt_throttle.sql`), `@repo/utils`
`authThrottle.ts` and the Turnstile CAPTCHA work.

## Findings

| # | Weak spot | Severity | Where |
|---|---|---|---|
| 0 | **The counter itself is writable by anyone.** `public.auth_throttle()` is executable by `anon` for all three actions. `clear` lets an attacker reset their own count (bypasses even the web server-side check); `fail` lets anyone lock any email out without guessing a single password. | High | migration `grant execute … to anon, authenticated` |
| 1 | Mobile, web sign-up/confirm codes and the `emailChange` code step enforce the limit in the client, so a caller that talks to Supabase Auth directly skips it. | High for 6-digit codes | `otp-verification.tsx`, `useOtpFlow.ts`, `use-confirm-email.ts` |
| 2 | Code guessing: Supabase does not apply CAPTCHA to `verifyOtp`. Email-change codes have no app limit at all. | Medium | `emailChange.ts` |
| 3 | Lockout abuse: one shared per-email window, so a stranger can lock a victim out for 15 minutes. | Medium | `signin_email` purpose |
| 4 | IP bucket trusts the first `x-forwarded-for` hop. | Low/Medium | `apps/web/lib/sign-in-rate-limit.ts` |
| 5 | Throttle fails open silently when the RPC is missing or errors. | Low/Medium | `authThrottle.ts` `call()` |

Nothing in app code can close the direct-to-Supabase-Auth path completely.
The durable backstops are Supabase settings (CAPTCHA on, short/long codes, rate
limits), so Phase 1 comes first and costs no code.

## Phase 1: Supabase settings (no code, do first)

1. Confirm CAPTCHA protection is enabled in the hosted project (Authentication
   → Attack Protection) and the Turnstile secret is set. Follow the release
   order in AGENTS.md (web and APK first, force old APKs past `min_version`,
   then enable).
2. Confirm hosted OTP expiry is 300 s or less (local `config.toml` says 300;
   the hosted value is separate).
3. Consider longer codes (Supabase allows up to 10 digits; 8 is a 100x harder
   guess). This needs the shared `RECOVERY_CODE_LENGTH`, the OTP inputs, the
   email templates and the web/mobile validators changed together, so treat as
   a follow-up decision.
4. Review Auth rate limits (token verifications per IP) and keep them tight.
5. Check whether the Password Verification Attempt hook is available on the
   plan (the project is on the Free plan, so probably not). It is the only way
   to enforce server-side limits on direct password sign-in calls.

## Phase 2: Lock down the counter (finding 0, highest priority)

Goal: only trusted server code may record or clear failures; anyone may only
ask "am I blocked?".

1. New migration (additive, forward-only):
   - Keep `public.auth_throttle(...)` for `check` only; revoke `fail` and
     `clear` from `anon`/`authenticated` (reject those actions inside the
     function when `auth.role()` is not `service_role`, or split into
     `auth_throttle_record` / `auth_throttle_clear` granted to `service_role`
     only).
2. Web: add a server-only module (`import "server-only"`) that builds a
   service-role client and is used by `sign-in.ts`, `password-recovery.ts` and
   the sign-up/confirm actions to record and clear. Needs a server-only
   `SUPABASE_SERVICE_ROLE_KEY` (never `NEXT_PUBLIC_*`, never logged).
3. Tests: pgTAP asserting `anon` cannot call `fail`/`clear`; extend
   `authThrottle.test.ts` for the new split.

## Phase 3: Move web code verification to the server (findings 1, 2)

1. `useOtpFlow` and `use-confirm-email` call new server actions (mirroring
   `verifyPasswordRecoveryCode`) that check the throttle, run `verifyOtp`,
   record failures only for `isInvalidOtpError`, and clear on success.
2. Add a `email_change_otp` purpose and enforce it inside the change-email
   actions (the account is already signed in and password-checked, so this is
   defence in depth).
3. Keep the existing client attempt counter (`useOtpAttempts`) for feedback.

## Phase 4: Mobile enforcement (finding 1)

Mobile cannot hold a service-role secret. Options (decision needed):

- **A. Accept as a speed bump** once Phases 1-3 are done; the app counters stay
  for UX. Lowest effort.
- **B. Server proxy:** an Edge Function (or web route handler) performs
  `signInWithPassword` / `verifyOtp` with the throttle and returns the session;
  mobile calls it and `setSession`. Strongest app-level control but the Auth
  endpoints stay reachable directly, so it mainly helps honest-app traffic.

Recommendation: A, unless a real attack shows up in the logs.

## Phase 5: Lockout abuse (finding 3)

1. Once Phase 2 is in, an attacker needs real failed attempts (CAPTCHA'd), not
   free RPC calls.
2. Key the strict window by email + IP so a stranger on another IP cannot lock
   the owner out; keep a higher per-email ceiling (for example 20 per hour) as
   the cap against distributed guessing.
3. Consider a short progressive delay instead of a flat 15-minute block.

## Phase 6: Trustworthy client IP (finding 4)

On the actual host, read the header the platform sets and callers cannot
override (on Vercel: `x-real-ip` / `x-vercel-forwarded-for`), and use
`x-forwarded-for` only as a fallback. Confirm the hosting setup before
changing `clientIpFromHeaders`; add cases to its existing node test.

## Phase 7: Visible failures (finding 5)

1. Keep failing open for users, but log a structured, subject-free server
   message and alert on it (Supabase/Vercel log alert).
2. CI/migration check that `auth_throttle` and its grants exist (extend
   `pnpm db:*:test`).
3. Decision: for server-side verification of one-time codes only, fail closed
   instead of open? Safer, but a throttle outage then blocks sign-up.

## Order and risk

1. Phase 1 (settings) and Phase 2 (counter lock-down) first, shipped together
   with the web changes that depend on them: apply the migration only after the
   web release that no longer writes from the browser, otherwise the existing
   client calls to `fail`/`clear` start failing (they fail open, so users are
   not locked out, but the limit stops counting).
2. Mobile builds that still call `fail`/`clear` from the client degrade to
   no-op counting after Phase 2; ship the mobile decision (Phase 4) before or
   with it.
3. Phases 3, 5, 6, 7 are independent and can follow in any order.

## Open decisions

- OK to add a server-only service-role key to the web environment?
- Mobile: option A or B?
- Longer codes (8 digits) now or later?
- Fail closed for server-verified code steps?
