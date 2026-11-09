# SECURITY.md — APT (A Place to Thrive)

Security policy and engineering boundaries for the APT rental platform (Philippine market, CAMANAVA focus). This file owns durable security policy: what the platform trusts, which layer is authoritative for each decision, and how a vulnerability is reported. It deliberately does not restate feature mechanics — those live in AGENTS.md (conventions), ARCHITECTURE.md (system design) and `docs/` (per-feature detail); when a claim here needs depth, it names where to look.

Every claim must stay verifiable against the repository (same rule as AGENTS.md): cited migrations live in `supabase/migrations/`, cited helpers are searchable in `apps/` and `packages/`, and the database suites in §9 exercise the guard functions directly. If a claim here can no longer be verified, fix it in the same change that broke it.

## 1. Security model

Trust boundaries: the browser plus its Next.js server (`apps/web`), the Android app (`apps/mobile`, sideloaded APKs with OTA updates), Supabase (Postgres + RLS, Auth, Storage, Realtime), five Edge Functions (`supabase/functions/`), PayMongo, Brevo and Gemini. Clients hold only publishable keys; every privileged capability lives behind the database or a server runtime.

Decision authority, top down — lower layers are convenience, never authority:

| Layer | Decides | Example in this file |
|---|---|---|
| 1. Postgres RLS + column grants | which rows and columns a session may touch | anon profile column restriction (§4) |
| 2. Database guard triggers | whether an action is legal at all | verified-account gates (§2), payment guards (§5) |
| 3. Caller-bound RPCs | multi-step, atomic privileged writes | registration, signed lease, reviews, reports (§2, §8) |
| 4. Server actions + edge functions | what a trusted server does for exactly one identity | throttle counting (§3), checkout reservation (§5) |
| 5. Client UX (web + mobile) | feedback only | hiding a button never blocks an operation |

Working rule: when changing an authentication, payment or moderation flow, change the database layer first (migration), then mirror the impact in the clients. A client-only check is not a security fix. Journey markers such as the HTTP-only password-recovery cookie are guards for UX, not security boundaries — RLS and the throttle decide.

## 2. Identity & account security

- `public.users` carries both `user_id` (→ `auth.uid()`) and the internal `id` UUID primary key. All RLS policies and FK relationships resolve the internal id via `(SELECT id FROM public.users WHERE user_id = auth.uid())`. Never bypass this indirection in a new policy or FK join.
- Dual-role accounts transition between portals, but a tenant must never transact against an apartment they own. Trigger-enforced per table (`20260928023106_prevent_self_transactions.sql`), with `require_tenant_membership_for_new_transaction()` demanding a current tenant role for new transactional records (`20260928024901_enforce_tenant_membership_on_new_writes.sql`). Admin membership grants nothing consumer-side; mixed admin/tenant profiles transact like any tenant; admin-only profiles have zero consumer access.
- **Verified-account gates** (the account, not the role, holds the privileges):
  - Landlord side: `20261028160000_verified_landlord_gate.sql` — writes to listings, photos, applications, visits, tenancies, maintenance, payments, finance records and landlord chat require `account_status = 'verified'` through `app_private.unverified_landlord_id()` (null for verified, non-landlord and service-role callers) and the `guard_verified_landlord_write` triggers. Triggers fire inside SECURITY DEFINER RPCs too, because identity comes from the JWT — a definer grant never widens access. Their SELECT policies are restrictive, so a broken condition fails closed. Listings of unverified landlords are additionally hidden (`20261028170000_hide_unverified_landlord_listings.sql`). Active tenancies step aside so a running tenancy can never strand either side (`20261028190000_active_tenancy_exemptions.sql`).
  - Tenant side: `20261028180000_verified_tenant_actions.sql` — only **inserts** are blocked (visit/maintenance requests, payments, reviews, chat); reading and cancelling existing rows stays open so history and cleanup never jam. Own-tenancy payments and maintenance requests are exempt while the tenancy is active.
- **Suspension is app-level**: `public.users.is_suspended` (+ `suspension_reason`, `suspended_until`) under the restrictive "Active accounts only" RLS policies. Supabase Auth's ban is never used — suspended users authenticate normally so every client can identify them and show the reason (`20261007000400_app_level_suspension.sql` lifted the earlier Auth bans on purpose). The only write path is the audited, admin-only `admin_set_user_access()`, which refuses admin targets, refuses self-targeting and deletes the target's sessions; temporary suspension sets `suspended_until` (`20261104145438_temporary_suspension.sql`). Expired temporary suspensions lift at once: `get_my_suspension_status()` re-evaluates on read and the every-minute `lift-expired-suspensions` pg_cron clears the flag for policies that check it directly. Service-role code paths (edge functions, push delivery) must check `is_suspended` themselves.
- **Admin second step**: a stolen session that has not passed the authenticator challenge (JWT `aal = 'aal2'` at sign-in level) cannot call admin RPCs or read admin-only rows — `private.has_admin_second_step()` is part of `private.is_admin()` used by admin SELECT policies and every `admin_*` / `get_admin_*` function (`20261024140000_require_admin_second_step.sql`). Deliberate exceptions stay narrow so outcomes still deliver: the `notify_*` triggers that pick admin recipients and `admin_set_user_access()`'s own account checks do not call it. Web enforces the flow (`requireAdmin`, `ADMIN_MFA_REQUIRED`, `/two-step-login`, device + backup management); role changes run only through the caller-bound, second-step-checked and audited `admin_grant_admin_role()` / `admin_revoke_admin_role()` (never your own account; the first admin is promoted over a trusted database-operator connection). Emergency switch-off is redefining exactly one function — see `docs/admin-provisioning.md`.
- **Admin least privilege**: admins hold no table-wide read of tenancies, `rental_application`, `visit_request`, `maintenance_request` or `payment` — a table-wide policy would silently return nothing rather than fail if it broke. Admin views of those tables go through narrow SECURITY DEFINER RPCs such as `get_admin_apartment_activity()` (`20261107160000_admin_apartment_activity.sql`); extend that function or add another instead of widening a policy.

## 3. Authentication defenses

- **Brute-force counters live in the database**, never in process memory or on the device (`20261105144525_auth_attempt_throttle.sql`, locked down by `20261106130000_lock_down_auth_throttle.sql`). `public.auth_throttle()` answers `check` only (anon + authenticated); recording or clearing happens only through `public.auth_throttle_server()`, executable by `service_role` alone — so no client key can clear its own window or lock an innocent account out. Keys are the purpose plus a SHA-256 of the subject (email or IP); the subject itself is never stored.
- Window map:

| Purpose | Limit | Defends against |
|---|---|---|
| `signin_email_ip` | 5 / 15 min | one email from one IP — a stranger cannot lock the owner out |
| `signin_email_hour` | 20 / hour | one email guessed across many IPs |
| `signin_ip` | 20 / 15 min | one IP across many emails |
| `signup_otp` · `recovery_otp` · `email_change_otp` | 5 / 15 min each | one-time-code brute force |

- Web enforces this inside server actions through `lib/auth-throttle-server.ts` + `lib/sign-in-rate-limit.ts` (`SUPABASE_SERVICE_ROLE_KEY` is used for these RPCs and nothing else). Mobile cannot write the counters either: it signs in and verifies codes through the web server's `/api/auth/mobile/*` routes, so both platforms share the database windows and reinstalling the app cannot reset a lock.
- **Fail-open by design**: without the service key, or if the RPC is unreachable, the throttle fails open — sign-in still works, an "Auth throttle unavailable" message is logged (action and purpose, never the subject; alert on that message), and the documented backstops still apply: Supabase Auth's hosted per-IP limits, CAPTCHA and the database rate limits. Release order (web, then mobile, then the lockdown migration) is laid out in `docs/plans/auth-brute-force-hardening.md`.
- **CAPTCHA (Cloudflare Turnstile) ships dormant** and turns on only when the public site key is set; the secret stays in the Supabase dashboard. Tokens are single-use, so every Supabase-protected request takes a fresh one; `captcha_failed` never counts toward the throttle; verification endpoints (`verifyOtp`) deliberately have none and lean on rate limits plus `auth_throttle`. Enabling it rejects every client that sends no token — ship clients first, then enable.
- One-time codes stay 6 digits; detect Auth throttling and bad codes by `error.code`, never by message text. A verified recovery code is a full session: the recovery journey signs it out on exit and success, and the in-progress markers make boot clear an abandoned reset (see ARCHITECTURE.md §4.3–4.4 and `docs/plans/web-forgot-password-mirroring.md`).

## 4. Data protection

- **Least-privilege reads**: signed-out (`anon`) reads of `public.users` are column-scoped to display fields — id, names, avatar/background, roles, account status, created date — by `20261024120000_restrict_anon_profile_columns.sql` (`revoke select` + explicit grant). Email, mobile, birth date and address are signed-in baggage: public pages must never `select *` from `users`, and new cross-user reads pick columns deliberately.
- **Column-scoped writes**: profile `UPDATE` grants cover only editable fields — never `email` or server-managed identity/access fields. `apartments` `INSERT` is column-scoped the same way: verification, moderation, ratings/counters and timestamps are never client-settable, and new client listings are forced to `status = 'available'`, `is_verified = false`.
- **Storage is private by default**: DB columns store storage paths, not URLs; signed URLs are generated on read. The one public exception is `apartment-images` (`public = true`, 10 MB), whose CDN public URLs are permanent — its one-year cache control applies only to unique, never-overwritten paths, never to a path replaced in place. Private media is scoped tightly: application documents resolve by path shape (never probed across buckets); a landlord reads an applicant's ID front/back through `private.landlord_can_read_applicant_id()` (never the selfie); the signed lease private folder is limited to that tenancy's landlord and tenant; profile photos upload to fresh account-folders without overwriting the previous object before the row write confirms.
- **Secrets inventory** — what each key can do and where it may live:

| Secret | Lives only in | Powers |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | web server (`lib/auth-throttle-server.ts` is the single app-code user) | service-role DB access, incl. throttle writes |
| `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET` | `paymongo` / `paymongo-webhook` functions | checkout sessions, status, webhook verification |
| `GEMINI_API_KEY` | `ai-search` function | analysis of chat text only |
| `BREVO_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME` | `email-notify` function | sending queued outbox email |

Only `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*` values reach a client; never commit `.env*`; never print the full Auth-config API response (it embeds SMTP credentials).
- **PII hygiene**: throttle failures log action and purpose, never subjects; Ava receives chat text only — never profile data — and message text is never logged; passwords, codes and emails never enter route params (password/email flows keep secrets in component state or stores cleared on close), and reference numbers or PII must not leak into URLs or client state.

## 5. Money & checkout

- **Test-mode hosted checkout is the only online flow.** Provider secrets never live in either app, and neither app ever sees card numbers — card entry happens on PayMongo's hosted page, exactly like wallets and banks (the old in-app card form was removed).
- **Reserve before providing**: the `paymongo` function reserves the `payment` row as `pending` *before* contacting PayMongo, then returns the hosted URL. A new online attempt first settles the previous unfinished one for the same tenancy and period — releasing on a guess is forbidden (`already_paid`, `payment_in_progress`), and the partial unique index `payment_one_pending_online_idx` (`20261102160000_one_pending_online_payment_per_period.sql`) is the database backstop. Cash and other periods are never touched.
- **Trust no return URL**: the redirect carries only a session/reference ID; outcomes come from caller-owned status lookups and the HMAC-verified `paymongo-webhook`. In mock mode (no secret key set) decisions are still persisted — `-fail`/`-expired` references fail on purpose, and a missing provider configuration never turns a real pending session into a fabricated success.
- **Accepted methods are policy, not credentials**: `landlord_payment_settings` stores method names only — never account numbers or receiver identities (payout destinations are out of scope). Enforcement is doubled: a restrictive INSERT policy on `payment` (client cash included) plus the same check inside the `paymongo` function, because service role bypasses RLS.
- **Cash stays `pending`** until the landlord's `landlord_update_payment_status`; e-wallet and card payments settle by webhook only. There are no disbursements anywhere — landlord profit is always `payment` aggregates plus the Realtime ledger, so a stolen action cannot move money into anyone's hands. The billing contract (frozen terms, allocations, deposit-is-not-rent) lives in `docs/move-in-billing.md`.

## 6. Edge functions & external services

The five functions in `supabase/functions/` — secrets live in function configuration, never in either app bundle:

| Function | Outbound | Security posture |
|---|---|---|
| `paymongo` | PayMongo REST | reserves the pending row first (§5); secret-key only |
| `paymongo-webhook` | none | the only trusted provider outcomes; HMAC signature required — fails closed while the secret is unset |
| `push-notify` | Expo push | carries `notificationId` so taps can mark the feed row read |
| `ai-search` | Gemini | sends chat text only — never profile data; never logs message text |
| `email-notify` | Brevo | receives **only** an outbox row id, never free-form content; deployed with `verify_jwt` off because triggers and schedules invoke it without a user JWT |

`app_private.edge_function_url()` builds function URLs server-side; a generic user payload is never accepted by `email-notify`. Queued rows retry every 10 minutes for a day and stay queued until their secrets exist — an email outage can never roll back the action that queued it.

## 7. Server-generated actions & push

- **Notifications are generated server-side only.** Database triggers insert through `create_notification()`, whose EXECUTE is revoked from `authenticated` (`20260816000000_restrict_create_notification.sql`) precisely because granting it lets any signed-in client spam arbitrary users. Clients `SELECT` their own rows and `UPDATE is_read` — nothing else. A new client-visible event means adding a trigger, never a client insert.
- **Push tokens register through caller-bound RPCs**: `register_push_token()` allows a token to move between accounts on one device at sign-in (`20260930132636_reassign_push_token_on_sign_in.sql`) without weakening owner-only table RLS, and `unregister_push_token()` is token-bound and anon-executable (`20261105130000_unregister_push_token.sql`) because sign-out runs *after* the session is gone and could not satisfy an owner-only policy. Never delete from `push_tokens` directly.
- Trigger payloads carry the `apartmentId` needed to resolve deep links; portal-audience classification (consumer-shared vs. account-wide, unresolved context excluded rather than deleted) lives in `@repo/utils` and is shared with both platforms (see AGENTS.md, "Portal notification audiences").

## 8. Abuse prevention & moderation

- **Reports are caller-bound and rate-limited**: `report_user` / `report_apartment` / `report_profile` (and `request_listing_review`) write `public.user_reports` — ten new reports per person per day, never self-targeting, with reasons whitelisted from `@repo/utils` `userReport.ts`. Blocking refuses while the pair shares an active tenancy (mute or report instead), enforced in both directions by `guard_chat_blocks`.
- **Messaging state is server-side**: pin, archive, mute and read state change only through `set_conversation_preference` / `mark_conversation_read`; clients hold no direct table writes to `conversation_preferences`, `user_blocks` or `user_reports`.
- **Admins act, reports don't**: a report row itself never hides a listing or suspends an account. Outcomes run inside the audited `admin_*` functions (`admin_act_on_report` reusing `admin_set_apartment_visibility` / `admin_set_user_access` in one transaction), and outcomes are announced from inside those functions — never by triggers — so the notification, email and audit trail always agree.
- **Ratings are caller-bound**: tenant reviews exist only through `submit_tenant_review()` (one row per tenancy, tenancy's own verified landlord, ended tenancy) and read only through `get_tenant_reviews()`; hiding runs through `admin_set_tenant_review_hidden()`.

## 9. Verification & auditability

- The single required `ci` job (`.github/workflows/ci.yml`) gates every PR with `db:populate:test`, `db:billing:test`, `db:listing-meter:test`, `db:application-guard:test`, `db:maintenance:test`, `db:activity-emails:test`, `db:admin-apartment-activity:test`, `db:admin-roles:test`, `db:mobile-registration:test`, `db:web-registration:test`, `db:auth-throttle:test` plus mobile lint + Jest (covering `@repo/utils` and `@repo/passport`) and web lint + typecheck + tests + build. These database suites exercise the guard functions in an isolated Postgres — a policy that silently breaks shows up here first.
- Further suites run on demand when their area changes: `pnpm db:landlord-gate:test`, `db:tenant-reviews:test` and the pgTAP report flow (`supabase/tests/report_review_flow.test.sql`) among others (full catalog in AGENTS.md "Commands").
- **Audit chains**: admin write paths append to `admin_audit_logs`; the demo importer tracks audited trigger functions by hash in `demo_population` and refuses to run while bodies drift — refresh the hash when a trigger legitimately changes (`docs/demo-population.md`).
- How to verify a claim in this file: find the migration by its date prefix in `supabase/migrations/`, grep `apps/` / `packages/` for the cited helper, or run the matching `pnpm db:*:test` suite.

## 10. Supported deployments

| Surface | Supported | Definition |
|---|---|---|
| Web | the current production deployment built from `main` | shipped together with its required migrations; journeys that gain a database rule (recovery, registration, payments) apply the migration before the web release |
| Mobile | Android APK at or above the live `public.app_releases.min_version` | below required → blocking "Update required"; below latest → dismissible prompt remembered per device; only JavaScript-only fixes ship by OTA behind matching fingerprints — native changes require a new APK release |
| Not supported | x86/32-bit Android devices | arm64-only builds (`apps/mobile` app.config.js); iOS exists as a development build, not a public release channel |

Older APKs that skip an update keep talking to Supabase directly during rollout windows where a defense demands web-first (throttle lockdown, CAPTCHA). That gap is accepted, time-bounded by the `min_version` gate and documented per feature — see `docs/plans/auth-brute-force-hardening.md` and `docs/app-updates.md`.

## 11. Reporting a vulnerability

- **Channel: GitHub private vulnerability reporting** on this repository (Security → Report a vulnerability). Do **not** open public issues, PRs or discussions for vulnerabilities, and do not disclose details publicly until a fix has shipped and we agree on coordinated disclosure. You may be credited, or stay anonymous — your choice.
- **Ground rules**: test against your own accounts and data only (the demo population exists for this), never exfiltrate real user data, no denial-of-service or sustained load against hosted environments, no social engineering. APT is a small volunteer team — there is no bounty program, but every report gets a real answer.
- **Include**: the affected surface (web route, mobile screen, edge function), steps to reproduce, impact assessment, and your environment (browser + OS, or Android device, APK version and the corresponding `app_releases` row). Redact personal data from attachments.
- **In scope**: broken authorization on any layer in §1 — RLS escalation or bypass from any client, secret exposure, payment-outcome manipulation (§5), moderation or admin second-step bypass (§2, §8), injection through storage paths or URLs (§4), notification fabrication (§7).
- **Out of scope (best-effort accepted)**: test-mode payment economics (no real funds move), the public visibility of pages designed to be public, anything requiring credentials of an account you already own, and self-XSS.

Response: acknowledgement from the maintainers as soon as we see the report (no contractual SLA), triage and a fix coordinated with you, then coordinated disclosure. Sensitive data found in the wild should be deleted from your test context afterwards — tell us what you touched so we can clean up server-side if needed.
