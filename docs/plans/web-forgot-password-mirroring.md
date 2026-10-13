# Web Forgot-Password Mirroring Plan

## Status (2026-10-13)

Implemented on `feature/web-forgot-password`. The new recovery email wording was pushed to the hosted `APT` project on 2026-10-13 (only the recovery template differed; all templates verified to match the repo afterwards). Remaining:

- End-to-end checks that need a real recovery code from an inbox (verify, Google-only, reset, global sign-out, 30-minute expiry).

Deviations from the original plan, found during implementation:

- Next.js strips its own router headers (`rsc`, `next-router-prefetch`) before the middleware runs, so prefetches cannot be recognized by header. The middleware treats any request whose `Sec-Fetch-Dest` is not `document` (or with `Sec-Purpose: prefetch`) as a background request and answers it 204 without touching the session. For a real client-side navigation, Next.js then falls back to a full page load, which gets the real decision (checked in the browser).
- The recovery pages use their own `RecoveryLayout` (the sign-in page shell) instead of `AuthWrapper`, which is specific to sign-in and sign-up (tabs, sign-in form, Google button).
- The exported cancel action is `cancelPasswordRecovery()` (local sign-out only). `endPasswordRecovery(scope)` stays internal, so the browser cannot trigger a global sign-out directly.
- The decision function has an extra `allow` result for the reset page, so the normal `authRoutes` rule does not send the recovery session home.
- The reset page reloads on `popstate`, because browser back/forward can restore a cached page without any request reaching the middleware; the reload is a real page load, which the middleware signs out. A successful password sign-in also clears any leftover marker.
- Found in real-inbox testing: a server-action `redirect()` rejects the client's promise with Next's redirect signal, which the reset form's `catch` showed as "Password reset failed". The form now runs its actions in a transition and calls `unstable_rethrow`. Because ending the session sets cookies (which re-renders the current page), the reset page renders a "session ended" view instead of redirecting from its server render.

## Goal

Mirror the mobile six-digit email-code password-recovery flow in `apps/web` while preserving its security properties:

- Do not reveal whether an email has an account.
- Do not put the recovery email or code in URLs.
- Treat recovery-code verification as a temporary authenticated session.
- Prevent an unfinished recovery session from reaching a normal portal.
- Sign out all sessions after a successful password reset.

### What the recovery marker is (and is not)

The recovery-in-progress marker is a journey guard, not a security boundary. Server actions skip middleware entirely (`updateSession` returns early on the `next-action` header), and the browser Supabase client can read the Auth cookies, so a recovery session can technically call anything a normal session can. That is accepted for the same reason as on mobile: whoever can read the inbox already controls the account. The marker exists so an unfinished reset is never silently turned into a normal signed-in visit.

## Current Mobile Reference

The mobile implementation is the behavioral source of truth:

| Concern | Mobile implementation |
| --- | --- |
| Auth operations | `apps/mobile/service/auth/passwordRecoveryService.ts` |
| Request code | `resetPasswordForEmail(email)` |
| Verify code | `verifyOtp({ email, token, type: "recovery" })` |
| Set password | `updateUser({ password })` |
| Recovery screens | `apps/mobile/app/(auth)/forgot-password/` (`index`, `otp-verification`, `reset-password`, `updated`) |
| Recovery-flow email state | `apps/mobile/stores/usePasswordRecoveryStore.ts` |
| Error mapping | `apps/mobile/service/auth/passwordErrors.ts` |
| Identity check | `apps/mobile/service/auth/authIdentity.ts` |
| Boot-time abandoned-session cleanup | `apps/mobile/app/index.tsx` |

### Mobile flow

1. The user enters an email address and requests a six-digit code.
2. The client validates the email locally, then calls `resetPasswordForEmail`.
3. Unknown-account responses are treated as success to prevent account enumeration.
4. The user enters the code. Before verification, the app records a recovery-in-progress marker.
5. `verifyOtp({ type: "recovery" })` creates a full persisted Auth session.
6. A Google-only account is detected only after verification, then signed out locally and directed back to Google sign-in.
7. A password account sets a new password with `updateUser`.
8. On success, the app clears the marker and calls `signOut({ scope: "global" })`.
9. If the reset is abandoned, the device is signed out locally. If the app is closed, boot cleanup performs that sign-out before portal routing. The mobile marker has no expiry: it lives until the recovery ends.

## Existing Web Context

- `apps/web/app/(auth)/components/AuthForm.tsx:141` already links to `/forgot-password`; the route does not exist yet (ARCHITECTURE.md lists it as a dead link under D12).
- `packages/supabase/src/middleware.ts` (`updateSession`) runs for every page and RSC request, including Next.js link prefetches. Its existing redirects build a fresh `NextResponse.redirect(url)`, which drops any cookies written to `supabaseResponse`.
- `@supabase/ssr` 0.9.0 writes the Auth cookies with a 400-day `maxAge` and sets no `Cache-Control` header of its own.
- `supabase.auth.signOut()` (auth-js 2.112.3) removes the local session even when the revoke call fails, except when reading the current session itself fails (e.g. a refresh that fails) — then it returns the error with the cookies still in place.
- Web must use `@repo/supabase/server` for server actions/pages and `@repo/supabase/browser` for browser-side Supabase operations; do not import the root `@repo/supabase` client in web code.
- Web sign-in already calls Supabase Auth from a server action (`actions/sign-in.ts`), while the signup code is verified in the browser (`sign-up-form/hooks/useOtpFlow.ts`).
- The existing signup `OtpModal` and `useOtpFlow` are specific to signup and use a 120-second cooldown. They should not be reused unchanged for recovery.
- Available building blocks: HeroUI `InputOTP` (in `@heroui/react` 3.2.6), `apps/web/app/components/inputs/PasswordField.tsx`, and `usePasswordValidation` from `@repo/hooks` (plain React, web-safe).
- `AuthWrapper.tsx` (the auth-page shell) renders a `next/link` to `/`, which Next.js prefetches in production builds.
- The hosted recovery email already carries a six-digit code in `supabase/templates/recovery.html`; its wording currently says “APT app,” which should become platform-neutral.
- Web tests are `node --experimental-strip-types --test lib/*.test.mjs`. Existing tests only import local `.ts` files with no imports of their own. There is no web component-test tooling.

## Decisions

| Question | Decision |
| --- | --- |
| Where shared recovery logic lives | `@repo/utils` (already a dependency of both apps and already exports `isValidEmail`). No new package. |
| Where the web marker logic lives | `packages/supabase/src/password-recovery.ts`, next to `pending-onboarding.ts`, because the middleware lives in that package. Pure module with no imports so the web `node:test` suite can import it by relative path. |
| Code step: same page or separate route | Same page. `/forgot-password` holds both the email and code steps in one client component, so the email never leaves component state. A refresh on the code step returns to the email step. |
| Server actions vs browser client for Auth calls | Server actions, matching web sign-in. Trade-off: Supabase Auth's per-IP limits (e.g. code verifications) count the web server's IP for every user. Acceptable at current traffic; if hosted rate limits are hit in testing, move request/verify to `@repo/supabase/browser` and keep only the marker write in a server action. |
| Marker lifetime | Same lifetime as the Auth cookies (400 days), with the start time stored inside. Age is enforced by reading that timestamp, never by letting the cookie expire. |

## Implementation Plan

### 1. Share recovery-safe pure logic (`@repo/utils`)

1. Move the platform-neutral pieces into `packages/utils/src/` and export them from `packages/utils/src/index.ts`:
   - `passwordRecovery.ts`: `RECOVERY_CODE_LENGTH = 6`, `RECOVERY_RESEND_COOLDOWN_SECONDS = 60`, `normalizeRecoveryEmail` (trim + `isValidEmail`, throws `PasswordError("invalid_email")`), `isRecoveryCodeFormat`.
   - `passwordErrors.ts`: moved unchanged from `apps/mobile/service/auth/passwordErrors.ts` (`PasswordError`, `PasswordErrorReason`, `toPasswordErrorReason`, `describeAuthError`, `toPasswordError`). It is shared with change-password, so every reason stays, including `wrong_current_password` and `reauthentication_required`.
   - `authIdentity.ts`: moved unchanged from `apps/mobile/service/auth/authIdentity.ts` (`AuthIdentityUser`, `hasEmailPasswordIdentity`).
   - The existing `authErrors.ts` (`getProfileSubmitError`) is unrelated; leave it alone.
2. Preserve the mobile error behavior:
   - invalid email
   - invalid or expired code
   - rate limited
   - same password
   - weak password
   - expired or missing recovery session
   - network failure
   - generic safe fallback
3. Keep unexpected error logs structural only (`name`, `code`, `status`); never log an email, code, password, or raw Auth error message.
4. Delete the mobile copies and update every importer to `@repo/utils` (no re-export shims):
   - `apps/mobile/service/auth/passwordRecoveryService.ts`
   - `apps/mobile/service/auth/passwordChangeService.ts`
   - `apps/mobile/app/(auth)/forgot-password/index.tsx`, `otp-verification.tsx`, `reset-password.tsx`
   - `apps/mobile/app/settings/change-password.tsx`
   - any test `jest.mock` paths that pointed at the old files
5. Move the tests with the code: `apps/mobile/service/auth/passwordErrors.test.ts` → `packages/utils/src/passwordErrors.test.ts`, `authIdentity.test.ts` → `packages/utils/src/authIdentity.test.ts`, plus a new `passwordRecovery.test.ts`. Add `'<rootDir>/../../packages/utils'` to `roots` in `apps/mobile/jest.config.js` so they run in CI, as `@repo/passport` does. Shared logic is tested here only — not again in the web suite.

### 2. Add the web recovery marker module

Create `packages/supabase/src/password-recovery.ts` (no imports) and expose it as `@repo/supabase/password-recovery` in `packages/supabase/package.json` `exports`:

1. `RECOVERY_MARKER_COOKIE` (e.g. `apt-password-recovery`).
2. `RECOVERY_MARKER_MAX_AGE_SECONDS = 400 * 24 * 60 * 60` — matches the `@supabase/ssr` Auth-cookie lifetime, so a recovery session can never outlast its marker and turn into a normal session.
3. `RECOVERY_SESSION_TTL_MS = 30 * 60 * 1000` — how long a verified recovery may stay unfinished before it counts as abandoned.
4. `createRecoveryMarkerValue(now)` → the start time as a string.
5. `readRecoveryMarker(value, now)` → `"none" | "active" | "stale"`. Missing → `none`; malformed or older than the TTL → `stale`.
6. `RECOVERY_MARKER_COOKIE_OPTIONS`: `httpOnly`, `sameSite: "lax"`, `path: "/"`, `secure` in production, `maxAge: RECOVERY_MARKER_MAX_AGE_SECONDS`.
7. `isBackgroundRequest(getHeader)` and `recoveryRouteDecision({ marker, hasUser, pathname, isBackgroundRequest })` → one of `continue`, `allow`, `clear_marker`, `no_content`, `redirect`, `end_session`. It implements the matrix in step 4.

### 3. Add server-owned web recovery lifecycle

1. Add `apps/web/app/(auth)/actions/password-recovery.ts` (`"use server"`) with:
   - `requestPasswordRecovery(email)` — requesting and resending a code;
   - `verifyPasswordRecoveryCode(email, code)` → `"ready" | "google_only"` or a safe error;
   - `updateRecoveredPassword(password)`;
   - `cancelPasswordRecovery()` (local); the internal `endPasswordRecovery(scope: "local" | "global")` does the work.
   Actions return `{ error: PasswordErrorReason }`-style results with the shared user-facing messages, never raw Auth messages.
2. Use `createClient` from `@repo/supabase/server` in every action so the recovery session lives in the browser/server cookie model.
3. On request/resend, validate with `normalizeRecoveryEmail`, call `supabase.auth.resetPasswordForEmail(email)`, and return the same success for `user_not_found` as for a real account. `auth.resend()` does not support recovery, so resend calls this action again.
4. Before calling `verifyOtp`, validate the code format, then set the marker cookie (`createRecoveryMarkerValue(Date.now())`, `RECOVERY_MARKER_COOKIE_OPTIONS`). The marker must be written before the Auth session is created.
5. Verify with `supabase.auth.verifyOtp({ email, token, type: "recovery" })` and require both a user and a session. On failure, delete the marker and return the mapped error.
6. After verification, check only the returned Auth identity data with `hasEmailPasswordIdentity`:
   - permit identities with the `email` provider (including linked Google + email accounts);
   - treat Google-only identities as an app-flow case: end the recovery locally and return `"google_only"`.
7. `updateRecoveredPassword` requires a valid `getUser()` user **and** an `active` marker; otherwise end the recovery locally and return `session_expired`. Server actions skip middleware, so this check must live in the action itself.
8. On update success, call `endPasswordRecovery("global")` and `redirect("/forgot-password/updated")`.
9. `endPasswordRecovery(scope)` always:
   1. deletes the marker cookie first;
   2. calls `supabase.auth.signOut({ scope })` and logs only `describeAuthError` for non-network failures;
   3. if `signOut` returned an error, deletes every `sb-*-auth-token*` cookie itself as a backstop, because auth-js keeps the cookies when reading the current session fails. Remote revoke stays best-effort; usable browser cookies must never survive.
10. Also delete the portal-preference cookie (`PORTAL_COOKIE`) when ending a recovery, as `actions/sign-out.ts` does.

### 4. Add recovery-session middleware protection

1. Add `/forgot-password` to `publicRoutes` and to `authRoutes` in `packages/supabase/src/middleware.ts`.
2. Run the recovery check right after `getUser()` and before the existing auth-route and portal logic. A request is a background request when `Sec-Fetch-Dest` is present and not `document`, or `Sec-Purpose`/`Purpose` contains `prefetch` (Next.js strips its own router headers before the middleware).

   | Marker | Signed in | Request | Result |
   | --- | --- | --- | --- |
   | `active` | yes | `/forgot-password/reset-password` (any request) | `allow`: skip the normal rules |
   | `active` / `stale` | any | any other background request | `no_content` (204): never sign out in the background |
   | `active` | yes | `/forgot-password` (email/code page) | end locally, redirect to `/forgot-password` |
   | `active` | yes | anything else | end locally, redirect to `/sign-in` |
   | `stale` | yes | `/forgot-password/...` | end locally, redirect to `/forgot-password` |
   | `stale` | yes | anything else | end locally, redirect to `/sign-in` |
   | `active` / `stale` | no | `/forgot-password/reset-password` | clear marker, redirect to `/forgot-password` |
   | `active` / `stale` | no | anything else | clear marker, continue |
   | `none` | any | `/forgot-password/reset-password` | redirect to `/forgot-password` (a signed-in user then bounces home via `authRoutes`) |
   | `none` | yes | `/forgot-password`, `/forgot-password/updated` | existing `authRoutes` behavior (home, or the role picker for pending onboarding) |
   | `none` | no | `/forgot-password`, `/forgot-password/updated` | public, continue |

3. "End locally" in middleware means `supabase.auth.signOut({ scope: "local" })` plus deleting the marker. Build the redirect, then copy every cookie from `supabaseResponse` onto it (`redirect.cookies.set(cookie)` for each of `supabaseResponse.cookies.getAll()`) and delete the marker on the redirect itself. Without the copy, the sign-out never reaches the browser. If `signOut` errors, also delete the `sb-*-auth-token*` cookies on the redirect.
4. Preserve current pending-onboarding, suspension, portal preference, and verification-handoff behavior for non-recovery sessions.
5. Set `Cache-Control: private, no-store` on every response that has a marker or sets/deletes Auth cookies on a `/forgot-password` route (`@supabase/ssr` 0.9.0 does not add it). Also export `dynamic = "force-dynamic"` (or read cookies) from the recovery pages so none are statically cached.
6. The reset page renders no links (its back control is a Cancel button), so nothing on it prefetches. It also ends the recovery on `popstate`.

### 5. Build the web screens

All screens use `RecoveryLayout` (the sign-in page shell) and follow DESIGN.md: HeroUI components first, `cursor-pointer` on every clickable, web background/card/token classes, Nunito headings, Inter body copy, accessible labels, visible focus rings, inline error text, disabled/pending states. No new colors, spacing scale, component library, or auth context.

1. `apps/web/app/(auth)/forgot-password/page.tsx` (server) renders `ForgotPasswordClient` (client), which holds both steps in local state.
2. Email step:
   - required email field with HeroUI `TextField`, `Label`, `Input`, `FieldError`;
   - copy matching mobile: a six-digit code is sent if an account exists;
   - a Google guidance alert that does not query the account type;
   - loading state and a back-to-sign-in link.
3. Keep the submitted email in client component state only — never in a URL, route parameter, local/session storage, or a shared context.
4. Code step (same component, same URL):
   - HeroUI `InputOTP` with `RECOVERY_CODE_LENGTH` digit-only slots;
   - inline invalid/expired-code feedback, a `RECOVERY_RESEND_COOLDOWN_SECONDS` resend countdown, and a resend confirmation message;
   - a “Use a different email” action back to the email step.
5. Google-only outcome: “This account uses Google” explanation and a back-to-sign-in action.
6. On `"ready"`, `router.replace("/forgot-password/reset-password")`.
7. `apps/web/app/(auth)/forgot-password/reset-password/page.tsx` (server) re-checks `getUser()` and an `active` marker; otherwise it redirects to `/forgot-password`. Its client form:
   - uses `usePasswordValidation` from `@repo/hooks`;
   - reuses `PasswordField.tsx` for the new and confirmation fields;
   - shows the same password requirements and inline server errors (same/weak password) as mobile;
   - on `session_expired`, returns to `/forgot-password` with the shared message;
   - has a Cancel action that calls `endPasswordRecovery("local")` and goes to `/sign-in`.
8. `apps/web/app/(auth)/forgot-password/updated/page.tsx`: confirms the password was changed and links only to `/sign-in`.

### 6. Update the recovery email copy

1. Change `supabase/templates/recovery.html` from “Enter this 6-digit code in the APT app” to platform-neutral language such as “Enter this 6-digit code on the APT password reset screen.” Mobile users will see this wording too.
2. Keep the six-digit token, five-minute expiry, rate-limit assumptions, and no-embedded-font requirement unchanged.
3. Update the hosted template only through `supabase/templates/build-payload.py` and the documented Management API patch process. Never use `supabase config push`, and print only the status code. This changes the live project, so get the user's go-ahead right before running it.

### 7. Update documentation

1. `AGENTS.md`: extend the password-recovery bullet to cover web — server actions in `actions/password-recovery.ts`, the cookie marker, the middleware recovery matrix, shared logic in `@repo/utils`. Fix the `service/auth/passwordErrors.ts` / `authIdentity.ts` references in the password bullets. Add `@repo/utils` to the packages tested by the mobile Jest suite.
2. `ARCHITECTURE.md`: add the web recovery flow to §4.3 (server actions, middleware); update §4.4 for the moved shared files; update §4.5 for the new email wording; remove forgot-password from the D12 dead-links item.
3. `DESIGN.md`: only if a new UI pattern is introduced (expected: none).

## Tests

### Shared and mobile regression coverage (mobile Jest)

1. `packages/utils/src/passwordErrors.test.ts`, `authIdentity.test.ts` (moved) and `passwordRecovery.test.ts` (new: email normalization, code format).
2. Keep these passing with updated imports and mocks:
   - `apps/mobile/service/auth/passwordRecoveryService.test.ts`
   - `apps/mobile/service/auth/passwordChangeService.test.ts`
   - `apps/mobile/tests/forgot-password/forgot-password.test.tsx`
   - `apps/mobile/tests/forgot-password/otp-verification.test.tsx`
   - `apps/mobile/tests/forgot-password/reset-password.test.tsx`
   - `apps/mobile/tests/forgot-password/app-boot.test.tsx`
   - `apps/mobile/tests/settings/change-password.test.tsx`

### Web coverage (`node:test`)

Add `apps/web/lib/password-recovery.test.mjs`, importing `../../../packages/supabase/src/password-recovery.ts` by relative path (the module has no imports, so strip-types can load it). Cover only web-only rules:

- `readRecoveryMarker`: missing, active, stale by age, malformed;
- marker cookie options: `httpOnly`, 400-day `maxAge`;
- `isBackgroundRequest` and `recoveryRouteDecision`: every row of the step 4 matrix, including background requests.

There is no web component-test tooling, and adding one is not justified for this change. UI behavior is checked in the browser (below).

### Browser verification

Run against a production build (`pnpm --filter web build && pnpm --filter web start`), because link prefetching mostly happens there:

- valid email requests a code;
- an unknown email gets the same UI response;
- resend is unavailable for 60 seconds, then sends a new code;
- malformed, invalid, and expired codes show inline errors;
- Google-only identity is signed out and sent to Google sign-in;
- linked Google/email identity can reset a password;
- the reset page stays signed in while idle (prefetch of `/` does not sign out);
- direct access or refresh of reset without a valid marked session restarts the flow;
- leaving the reset page by link, back button, or address bar signs the browser out;
- closing the tab mid-reset and returning later lands signed out, never in a portal;
- a reset left open longer than 30 minutes is treated as abandoned;
- new password validation runs before the server request;
- same/weak password errors stay inline;
- success signs out every session (check a second browser) and only allows sign-in afterward;
- recovery responses carry `Cache-Control: private, no-store`;
- emails, codes, and passwords never appear in URLs or server logs;
- the hosted rate limits (resend, verification) behave as expected from the server's IP.

## Verification Commands

Run after implementation:

```bash
pnpm --filter mobile lint
pnpm --filter mobile exec jest --runInBand
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web test
pnpm --filter web build
graphify update .
```

Test real recovery email delivery with local Supabase/Mailpit or a designated test account before changing the hosted template. Confirm the email code length, five-minute expiry, and 60-second resend behavior agree with `supabase/config.toml` and the hosted Auth configuration.

## Out of Scope

- Changing the global Supabase setting that requires a current password. It must remain disabled because it would break the recovery session.
- Adding password recovery via magic link or an API route.
- Exposing account type before recovery-code verification.
- Database schema, RLS, or migration changes.
- Renaming web `middleware.ts` to the Next.js 16 `proxy.ts` convention.
