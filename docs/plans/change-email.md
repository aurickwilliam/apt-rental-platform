# Change Email

## Goal

Turn the disabled **Change Email** row in tenant and landlord Settings into a secure email-address change flow on mobile and web. Only accounts that sign in with an email and password can use it; Google sign-in accounts cannot. Keep the old email as the account's canonical address until the new address has completed the required verification.

## Current state

| Concern | Where it is today |
| --- | --- |
| Mobile Settings row | `apps/mobile/app/settings/index.tsx`: Change Email is disabled with "Coming soon". |
| Web Settings row | `apps/web/app/components/settings/tabs/SecurityTab.tsx`: tenant/landlord Change Email is disabled; admin Settings has a separate unchanged message. |
| Settings presentation | Mobile Change Password uses its own route; web Change Password uses a separate modal owned by `SettingsOverlay`. |
| Password identity check | `hasEmailPasswordIdentity` in `packages/utils/src/authIdentity.ts` considers a linked email/password identity eligible, including Google-linked accounts. This is intentionally stricter for the proposed email-change feature (see decisions). |
| Email validation | `isValidEmail` and recovery email normalization live in `@repo/utils`. |
| Auth email templates | `supabase/templates/` plus `supabase/templates/build-payload.py`; hosted changes go through the Supabase Management API, not `supabase config push`. |
| Profile email | `public.users.email` is read by client profile queries. Read-only inspection of hosted project `ezxirkpgfpripjydcqnt` found client UPDATE permission on this column and no trigger syncing it from `auth.users.email`. |

## Scope and decisions

- **Platforms:** mobile and web, for tenants and landlords. Admin Settings stays unchanged.
- **Eligibility:** enable only for an email/password account that has no Google identity/provider. Google-only accounts, linked Google + email/password accounts, signed-out users, loading states, and identity lookup errors remain disabled. Show "Signed in with Google" for accounts with Google sign-in. Recheck eligibility from the service/server action; a disabled row is only UI feedback.
- **Auth remains canonical:** the change uses Supabase Auth's authenticated `updateUser({ email })` and email-change confirmation flow. Never write the new address directly into `public.users`.
- **No account enumeration:** don't call the public email-availability action or reveal whether an address is registered. Give generic conflict/error feedback. Supabase Auth's unique constraint remains authoritative.
- **Confirmation flow (decision to validate against hosted settings before implementation):** use Supabase **Secure Email Change** (both current and new email confirmations). Require both codes before reporting completion. The current address stays active until Supabase commits the new address. Do not claim that confirming the first inbox completes the change.
- **Current-password proof:** require the current password immediately before requesting the change. Verify with `signInWithPassword` using the email fetched from the authenticated user; reject if the returned user ID differs. Never accept a current email from the client as the identity to verify.
  - This is an app-flow safeguard, not a server-enforced reauthentication rule: the project-wide Auth reauthentication setting affects other flows and must not be enabled without separately validating password recovery. Dual inbox confirmation and the authenticated Supabase Auth endpoint remain authoritative.
- **Session policy:** after both codes are confirmed, keep this device signed in and revoke other sessions with `signOut({ scope: "others" })`; log a safe error and report revocation separately if it fails after the email has changed. Confirm current Supabase session semantics before relying on them.
- **Pending change:** treat Auth as the source of truth. Re-read the authenticated user and pending email when opening/resuming the flow; do not persist password/code in a store, URL, route parameter, query key, or storage. Closing the form clears local secrets but does not promise to cancel an Auth request already sent. Do not add a cancel-request control until its server semantics are verified.
- **Recovery/suspension:** refuse to start or verify an email change during a password-recovery journey and for a suspended account. The web server action must explicitly check the recovery marker because actions bypass middleware. Enforce suspension with the same server-authoritative pattern as other sensitive operations.
- **Profile synchronization is in scope:** make `public.users.email` server-managed and synchronize it only when the canonical `auth.users.email` is actually updated after confirmation. Never copy a pending email into the profile. Keep `public.users.id`, `user_id`, roles, account status, verification state, rental records, and document ownership unchanged.
- **Identity-claim caveat:** the server/database guard must use trusted Auth identity data, not user-editable `user_metadata`. Confirm how the hosted Auth update context exposes the actor and linked providers before implementing provider-specific database enforcement. Client/server UI checks alone cannot prevent a user from directly calling Auth APIs.
- **No custom availability endpoint, service-role Auth update, new DB table, or app-sent duplicate confirmation email.** Supabase sends the confirmation messages and configured security notification. Only introduce additional backend state if the documented Auth behavior cannot reliably resume/reconcile the pending flow.

## Intended user flow

1. User opens Settings → Security → Change Email.
2. Screen/modal shows their current Auth email as read-only, requests a new email and current password, and explains that both inboxes must be accessible and the current email remains active until completion.
3. Client validates and normalizes the new address for useful feedback. The authenticated service/server action fetches the current user, verifies eligibility, validates the inputs again, checks recovery/suspension state, verifies the current password, and calls Auth `updateUser({ email: newEmail })`.
4. Clear the current password. Show a verification state with explicit instructions that codes were sent to the current and new addresses; do not expose full addresses unnecessarily. Offer resend only with server/provider-supported cooldowns and rate limits.
5. Collect each code in separate fields, identifying which inbox each code belongs to. Verify each only with the exact Auth-supported email-change OTP type and address pairing. Never pass email-change codes through signup, sign-in, or recovery verification.
6. After both confirmations, fetch the user from Auth again. Declare success only if the same account now has the normalized new email and no unresolved pending change. Refresh profile/session-derived UI, clear codes, and report the result of signing out other sessions accurately.
7. On return, restart, account switch, expired code, or partial verification, reconcile from Auth. Continue only if the same account and pending address are confirmed; otherwise show a safe restart/error state. Never rely on stale local state as proof of completion.

## Implementation phases

### Phase 1 — Verify hosted Auth behavior and configuration

Before implementation, check current Supabase documentation and inspect only the Auth settings needed for this flow on the linked APT project:

1. Confirm Secure Email Change is enabled and determine whether confirmations are required at both addresses.
2. Record the exact code length, expiry, resend interval, maximum attempts, pending-email exposure in `getUser()`, and Auth `updateUser` response for a pending change.
3. Verify the precise `verifyOtp` type and which email/token pair corresponds to each inbox when both confirmations are enabled. Verify what happens after the first code, duplicate verification, expired codes, and a second requested address.
4. Confirm whether the change-email security notification is enabled and which inbox receives it. Keep security-notification delivery separate from the required confirmation flow.
5. Inspect relevant Auth logs/security advisories if behavior or delivery is unclear. Do not change production settings as part of plan implementation without explicit authorization and a reviewed change.
6. Test the intended flow in local Supabase/Mailpit or a test project with two controlled inboxes before relying on production behavior.

**Gate:** if the hosted configuration cannot guarantee both-address confirmation, stop and revise the design before making Change Email available. Do not silently fall back to confirming only the new address.

### Phase 2 — Shared validation, identity rules, and Auth sequence

1. Add a dependency-light shared module such as `packages/utils/src/emailChange.ts`, export it from `packages/utils/src/index.ts`, and define structural Auth interfaces as done for `passwordChange.ts`.
2. Add pure shared helpers for:
   - normalize/validate email and reject the current address (reuse existing validation; don't duplicate the regex);
   - exact eligibility policy: email identity present and no Google provider/identity;
   - code length/format and resend cooldown only after matching them to verified hosted settings;
   - safe, typed `EmailChangeError` reasons and field/error placement, without returning raw Auth errors.
3. Add the shared request sequence:
   - validate inputs;
   - `getUser()` and use its canonical email/id/identities;
   - enforce email/password-only eligibility and any existing account/suspension/recovery guards passed in by the platform layer;
   - verify current password with `signInWithPassword`, requiring the returned ID to match;
   - call `updateUser({ email })` on the authenticated same-account client;
   - return only a safe pending/request result, never codes, tokens, or raw Auth data.
4. Add a separate verification/reconciliation sequence that accepts only the verified OTP flow shape established in Phase 1, binds it to the same authenticated user and intended email, calls `verifyOtp`, then calls `getUser()` and checks the actual committed email before returning success.
5. Do not automatically sign out other sessions during the request or after only one code. Revoke others only after Auth confirms completion. Preserve this device if supported; surface a distinct partial-success result if revocation fails.
6. Map Auth errors safely: wrong current password to its field; invalid/mismatched/expired codes to the relevant code field; rate limits to a wait/retry message; duplicate address to generic address-unavailable copy; missing/changed session or account mismatch to a restart/sign-in message; unexpected errors to a generic message. Never log addresses, passwords, codes, confirmation URLs, tokens, or raw provider messages.
7. Tests use a structural fake Auth client to lock down call ordering, same-user checks, no update on failed password, no success on partial confirmation, committed-email verification, provider eligibility, duplicate/replay codes, and safe logs.

### Phase 3 — Mobile service, hook, and flow

1. Add `apps/mobile/service/auth/emailChangeService.ts` to bind the shared functions to `supabase.auth`; do not let screens import Supabase directly.
2. Add a React Query eligibility hook under `apps/mobile/hooks/auth/`, using a stable identity-scoped key and clearing sensitive/pending client state on sign-out or account change. Fail closed if identity cannot be read.
3. Replace the disabled Change Email item in `apps/mobile/app/settings/index.tsx`:
   - enable only after an authoritative eligible identity result;
   - show "Signed in with Google" for Google-linked accounts (including linked email/password accounts under this feature's stricter rule);
   - remain disabled while loading, signed out, suspended, or on lookup error.
4. Add `/settings/change-email` and register it in the settings stack. Follow `change-password.tsx`, `PasswordField`, `ScreenWrapper`, `StandardHeader`, `ErrorDialog`, `useToast`, keyboard dismissal, and footer-submit conventions.
5. Form state: read-only current email, new email, confirm new email if useful to prevent typos, current password, then separate current-inbox and new-inbox code fields. Password and codes stay in local state and are cleared on route exit/account change; don't put email/code in route params.
6. Model distinct request, awaiting-current-code, awaiting-new-code, verifying, success, and recoverable-error states from the verified Auth flow. Don't assume the order of the two verifications matters unless Supabase docs/tests establish it.
7. Resend controls reflect provider throttling and disable during requests; do not implement a client-only cooldown as a security boundary. Reconcile on focus/app resume and show a safe restart if the pending Auth request no longer exists.
8. Add screen/service/hook tests for validation, identity states, loading/error-disabled row, password failure, each partial confirmation state, resend, background/foreground, account switch, success, and secret clearing.

### Phase 4 — Web server action, modal, and callback/reconciliation

1. Add `apps/web/app/(auth)/actions/change-email.ts` using `@repo/supabase/server`. Recheck all input, authenticated user identity, recovery marker, suspension, and pending flow state server-side. Never trust client-supplied current email/user ID or eligibility.
2. Return only a discriminated safe result / `EmailChangeErrorReason`. Log unexpected failures by type/code/status only. Do not return raw Auth messages or secrets.
3. Add `ChangeEmailModal.tsx` in `apps/web/app/components/settings/`, following `ChangePasswordModal`: local open state in `SettingsOverlay`, no URL/query state, clear fields on every close, prevent dismissal while a request/verification is in flight, and show a distinct completion state.
4. Thread `onChangeEmail` through `SettingsOverlay` → `SettingsModal` → non-admin `SecurityTab`. Leave the admin branch unchanged. Use the web user/identity hook or a focused hook that calls authoritative `getUser()` and fails closed.
5. Decide with Phase 1 results whether the email link requires an allowlisted redirect/route. If so, create a minimal guarded route that accepts only the expected token hash and email-change type, never a caller-controlled external `next`; strip tokens from the resulting URL immediately. If using codes in the modal, keep them in local state and do not add a route just to hold them.
6. Handle server-action cookie re-rendering without losing modal flow state, following existing Change Password behavior. Guard signed-out pages and recovery sessions explicitly because server actions bypass middleware.
7. Add tests for tampered requests, recovery marker, suspension, wrong user ID, callback type/redirect validation if applicable, page re-render, modal dismissal, and safe error results.

### Phase 5 — Protect and synchronize profile email

1. Inspect current table grants, `guard_user_authorization_fields`, signup/profile flows, triggers, and hosted profile/Auth mismatches before writing a migration.
2. Migration:
   - revoke table- and column-level client UPDATE on `public.users.email` from `public`, `anon`, and `authenticated`, taking care that surviving per-column grants cannot bypass a table revoke;
   - add database guardrails so authenticated clients cannot change the profile email even if a broad grant is later restored;
   - create/extend a trusted server-side trigger to mirror `auth.users.email` to `public.users.email` only after Auth changes the canonical email; use `NEW.id` → `public.users.user_id` and do not modify profile primary keys or authorization fields;
   - keep signup/profile creation consistent, ensuring client-provided profile email cannot diverge from the authenticated identity;
   - use fixed `search_path`, minimal privileges, and verify the trigger can update only the caller's matching profile. Do not add a public RPC or service-role client path.
3. Audit existing rows for Auth/profile email mismatches and duplicate/null cases. Do not run a blind production backfill; propose and review any repair separately.
4. Test request-before-confirmation leaves `public.users.email` unchanged; successful Auth confirmation updates it once; failures/partial confirmation leave it unchanged; direct authenticated UPDATE fails; profile UPDATE of allowed fields still works.
5. Regenerate/update `packages/supabase/src/types.ts` only if schema-visible types actually change. No unrelated columns or identity data should be exposed.

### Phase 6 — Email templates and settings delivery

1. Add an APT-branded email-change confirmation template using the existing external-font/logo approach and Supabase-supported variables. The template must clearly identify the requested new address, distinguish confirmation from sign-in/recovery, and explain how to ignore an unrequested change.
2. Determine from Phase 1 whether templates need separate content for current and new inboxes. Avoid ambiguous wording like "confirm this new email" in the old inbox.
3. Add a separate email-changed security notification only if Supabase's built-in notification is not already configured; notify the appropriate old/new inboxes without generating duplicates.
4. Extend `supabase/config.toml`, template tests, and `supabase/templates/build-payload.py`; keep every template below Gmail's clipping/editor limits and keep OTP/link format consistent with the verified flow.
5. Update hosted Auth templates/settings only through the approved Management API payload flow, with private output permissions; never print the full response because it contains SMTP credentials. Hosted configuration rollout requires explicit approval.
6. Validate local templates in Mailpit and confirm delivery to two controlled inboxes, including sender, subject, address pairing, OTP/link behavior, expiry text, and spam/clipping safety.

### Phase 7 — Verify, document, and roll out

1. Run mobile lint/Jest, web lint/typecheck/tests, relevant package tests, and `graphify update .`.
2. Apply the schema migration locally first where supported; inspect migration SQL and database security/performance advisories before any hosted migration. Verify grants, trigger behavior, and RLS/grants after application.
3. Update `ARCHITECTURE.md` §§4.3–4.5 for web, mobile, profile synchronization, session/recovery guards, and Auth emails; update `AGENTS.md` durable conventions and `DESIGN.md` only if new UI patterns/tokens are introduced.
4. Signed-in two-inbox manual checks on mobile and web:
   - email/password eligible account can request a change;
   - Google-only and Google-linked accounts remain disabled and direct service/action calls fail safely;
   - wrong password sends no request;
   - old email remains canonical until both confirmations;
   - either confirmation alone never reports success or changes profile email;
   - both correct codes update Auth and profile; new email signs in and old email no longer does;
   - other sessions are revoked only after completion, while current device remains signed in;
   - wrong, expired, reused, rate-limited, and superseded codes behave safely;
   - app/browser reload, close, account switch, recovery, suspension, and concurrent devices cannot leak or apply a change to the wrong account;
   - confirmation and security-notification emails arrive at the intended inboxes;
   - Settings/profile shows the canonical address after refresh and no secrets appear in URLs/logs.
5. Roll out only after the hosted dual-confirmation setting, migration, templates, and redirect allowlist (if used) are verified together. Record any remaining provider/device-only checks; do not imply they passed from unit tests.

## Acceptance criteria

- Only non-Google email/password accounts can start the flow; Google-only and Google-linked accounts cannot use it from UI or app/server flow.
- A wrong password or invalid input never initiates an email change.
- The signed-in account, not client-supplied identity data, owns the request and every verification step.
- The old Auth/profile email remains canonical until Supabase confirms both required inboxes.
- Partial, expired, replayed, superseded, rate-limited, or wrong-account verification is never reported as success.
- After completion, Auth and `public.users.email` agree; clients cannot directly edit profile email.
- Current device remains signed in; other sessions are revoked only after confirmed completion, and failures are reported honestly.
- Recovery and suspended-account guards work on both platforms; the admin Settings experience is unchanged.
- Passwords, codes, and tokens never appear in URLs, storage, logs, analytics, or server-action results.
- Email templates are branded, tested with two inboxes, and deployed only through the documented safe process.
- Relevant CI checks pass; any hosted/device/manual checks not run are explicitly listed.

## Out of scope / follow-ups

- Changing a Google account's primary email or unlinking Google.
- Linking/unlinking sign-in providers or adding a password to a Google account.
- Admin email changes through the user-facing Settings UI.
- Recovery of an inaccessible old inbox; use the support/account-recovery process, not a bypass.
- Custom availability lookup that reveals whether an email is registered.
- Force-changing Auth email, direct table updates, or service-role Auth administration.
- Repairing historical Auth/profile email mismatches without a separately reviewed audit and data plan.
