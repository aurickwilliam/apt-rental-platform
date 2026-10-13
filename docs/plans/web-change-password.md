# Web Change Password

## Goal

Turn the disabled **Change Password** row in the web Settings modal (Security tab, currently "Coming soon") into a working flow that mirrors mobile (`docs/plans/mobile-change-password.md`): a signed-in user with an email/password credential enters their current password and a new one, the password changes, this browser stays signed in, and every other session is signed out.

## Current state

| Concern | Where it is today |
| --- | --- |
| Settings entry point | `apps/web/app/components/settings/SettingsModal.tsx` (opened by `?settings=open` through `SettingsOverlay`, mounted in the tenant, landlord, admin and `(main)` layouts) |
| Security tab | `apps/web/app/components/settings/tabs/SecurityTab.tsx`: tenant/landlord see disabled "Change Password" and "Change Email" rows; admins see a "not available here yet" card |
| Mobile behaviour (source of truth) | `apps/mobile/service/auth/passwordChangeService.ts` + `apps/mobile/app/settings/change-password.tsx` |
| Shared password logic | `@repo/utils`: `PasswordError` / `toPasswordError` / `describeAuthError` (`passwordErrors.ts`), `hasEmailPasswordIdentity` (`authIdentity.ts`); `usePasswordValidation` in `@repo/hooks` |
| Web password UI already built for forgot-password | `app/components/inputs/PasswordField.tsx` (shared), plus `PasswordRequirementList.tsx` and `ErrorBanner.tsx`, which still sit inside `app/(auth)/forgot-password/components/` |
| Web server-action style | `app/(auth)/actions/sign-in.ts`, `password-recovery.ts` (`@repo/supabase/server`) |

## Scope and decisions

- **Scope: Change Password only.** The Change Email row and every other Settings tab are left exactly as they are.
- **Same rules as mobile.**
  - Only accounts with an `email` identity (email/password, or Google linked with a password) can change a password.
  - Google-only accounts see the row disabled with a "Signed in with Google" chip instead of "Coming soon".
- **Current password is required by the app.** The server action checks it with `signInWithPassword` before `updateUser`. Supabase's project-wide "require current password" setting stays **off**: turning it on would also block the forgot-password recovery session. So this is an app-flow check, not a server-enforced one — same accepted trade-off as mobile.
- **After a successful change:** this browser stays signed in (other tabs share the same cookies, so they stay signed in too), and every other session ends with `signOut({ scope: "others" })`. Supabase sends the "password changed" email automatically.
- **Where the form lives: inside the Security tab, as a sub-view.**
  - Clicking the row swaps the tab's content for the form, with a back button to return to the list.
  - No second modal on top of the Settings modal, and no new route. This matches mobile's "Settings → separate screen" feel inside the one modal.
  - The sub-view is local state in `SecurityTab`. It is not in the URL, so a refresh returns to the list and no password can end up in a URL.
- **Tenants and landlords only.** The admin branch of `SecurityTab` (the "Password and email: not available here yet" card and the privacy-policy link) is not touched.
- **Server action, not the browser client.** This matches web sign-in and password recovery. The session cookies are rewritten on the server in one place, and passwords never go through browser-side Supabase calls.
  - Trade-off (same as sign-in): Supabase's per-IP sign-in limits count the web server's IP. That's fine at current traffic.
- **One shared sequence for both platforms.** The mobile service's steps move into `@repo/utils` as a function that takes the Supabase auth client as a parameter. Mobile and web both call it, so the rules can't drift apart.
  - The steps are: check the new password differs, look up the user, check identity, verify the current password, update, sign out the others.
- **No database changes.** Only Supabase Auth's password changes.

## Implementation phases

### Phase 1 — Share the change-password sequence (`@repo/utils`)

1. Add `packages/utils/src/passwordChange.ts` and export it from `packages/utils/src/index.ts`:
   - `PasswordChangeAuth`: a structural type covering only the auth methods used (`getUser`, `signInWithPassword`, `updateUser`, `signOut`). There's no Supabase import, same pattern as `@repo/passport`'s structural row types. Both the mobile client and the `@supabase/ssr` server client fit it.
   - `changePasswordWith(auth, currentPassword, newPassword)`: the exact steps from `apps/mobile/service/auth/passwordChangeService.ts`:
     1. If the new password equals the current one → `PasswordError("same_password")`.
     2. `getUser()`; no user → `toPasswordError`.
     3. Check the account has an email and an email identity (`hasEmailPasswordIdentity`), else `PasswordError("unknown")` plus a log line.
     4. `signInWithPassword({ email, password: currentPassword })`. `invalid_credentials` becomes `wrong_current_password`. If the returned user has a different id → `unknown`.
     5. `updateUser({ password: newPassword })`; `same_password` and `weak_password` map as today.
     6. `signOut({ scope: "others" })`. If this fails, log it with `describeAuthError` and don't show it: the password has already changed.
   - `getPasswordChangeErrorField(reason)` → `"current" | "new" | "general"`. It replaces the `CURRENT_PASSWORD_ERRORS` / `NEW_PASSWORD_ERRORS` sets in the mobile screen, so both platforms put each error under the same field.
2. Mobile keeps its public API:
   - `passwordChangeService.changePassword` becomes `changePasswordWith(supabase.auth, …)`.
   - `getPasswordSignInStatus` stays as it is.
   - The screen uses `getPasswordChangeErrorField`.
3. Tests:
   - Move the sequence cases from `apps/mobile/service/auth/passwordChangeService.test.ts` to `packages/utils/src/passwordChange.test.ts`, using a fake auth object. This folder already runs in the mobile Jest suite through `roots`.
   - Keep a small mobile service test that checks the service passes `supabase.auth` through.
   - Add cases for `getPasswordChangeErrorField`.
4. Never log a password. Logs keep only the error name/code/status (`describeAuthError`), as now.

**Phase 1 status (2026-10-13): done.**
- `packages/utils/src/passwordChange.ts` exports `PasswordChangeAuth`, `changePasswordWith`, `PasswordChangeErrorField` and `getPasswordChangeErrorField`. The steps and log lines are unchanged from mobile. The mobile Supabase client fits `PasswordChangeAuth` with no casts.
- `apps/mobile/service/auth/passwordChangeService.ts`: `changePassword` now calls `changePasswordWith(supabase.auth, …)`; `getPasswordSignInStatus` is unchanged.
- `apps/mobile/app/settings/change-password.tsx` places errors with `getPasswordChangeErrorField` instead of its own two sets.
- Tests:
  - `packages/utils/src/passwordChange.test.ts` (21 tests) covers the steps with a fake auth object, plus every error-field mapping. It adds a "no signed-in user" case.
  - The mobile service test (6 tests) keeps the sign-in-status cases and checks that `changePassword` uses the mobile client.
- Checks run:
  - Mobile typecheck, lint and full Jest suite pass (706 tests).
  - The `@repo/utils` typecheck passes.
  - Web typecheck and tests pass (47 tests).

### Phase 2 — Web server action

Add `apps/web/app/(auth)/actions/change-password.ts` (`"use server"`, `createClient` from `@repo/supabase/server`):

- `changePassword(currentPassword, newPassword)` → `{ error: PasswordErrorReason | null }`. It never throws for expected failures and never returns raw Auth messages; the client turns the reason into text with `new PasswordError(reason).message`, as the reset form does.
  1. Reject non-string or empty inputs: `wrong_current_password` for the current password, `weak_password` for the new one.
  2. **Recovery guard:** if the `apt-password-recovery` marker cookie is present (`readRecoveryMarker` is not `"none"`), return `session_expired`. Server actions skip the middleware, and a recovery session has its own reset page; this keeps the two flows apart.
  3. Call `changePasswordWith(supabase.auth, currentPassword, newPassword)` and map a thrown `PasswordError` to its reason. Anything else is logged by type only and returned as `unknown`.
- `signInWithPassword` rewrites the session cookies for the same user. Next.js then re-renders the current page inside the action response. Client state (the open modal and the sub-view) survives that, but **check it in the browser** (Phase 5).
- No `redirect()`: the user stays where they are, so the client doesn't need `unstable_rethrow`.

**Phase 2 status (2026-10-13): done.**
- `apps/web/app/(auth)/actions/change-password.ts` exports `changePassword(currentPassword, newPassword)` → `ChangePasswordResult` (`{ error: PasswordErrorReason | null }`).
- It does three things, in this order:
  1. checks the inputs;
  2. checks the recovery marker (`readRecoveryMarker(...) !== "none"` → `session_expired`);
  3. runs `changePasswordWith(supabase.auth, …)`.
- A `PasswordError` comes back as its reason. Anything else is logged by type only and returned as `unknown`.
- The `@supabase/ssr` server client fits `PasswordChangeAuth` with no casts.
- Web typecheck, lint and tests pass (47 tests). No UI calls this action until Phase 4, so the browser check is part of Phase 5.

### Phase 3 — Shared web password UI

Move the two forgot-password components that this flow also needs into shared folders, then build the matching web `NewPasswordFields` (mobile has the same component):

1. Move `app/(auth)/forgot-password/components/PasswordRequirementList.tsx` → `app/components/inputs/PasswordRequirementList.tsx`, and `ErrorBanner.tsx` → `app/components/display/ErrorBanner.tsx` (or the closest existing shared folder). Update the forgot-password imports. Behaviour stays the same.
2. Add `app/components/inputs/NewPasswordFields.tsx`:
   - The new-password and confirm-password `PasswordField`s plus `PasswordRequirementList`, with `autoComplete="new-password"`.
   - Props mirror mobile: values, change handlers, requirements, per-field errors, `isDisabled`, `passwordLabel`.
   - Switch `ResetPasswordClient` to it so both forms render the same fields.
3. Add a hook `hooks/use-password-sign-in-status.ts`:
   - Uses `useAsyncResource`; the loader calls `getUser()` on `@repo/supabase/browser` and returns `"has_password" | "no_password"` through `hasEmailPasswordIdentity`.
   - `getUser()` asks the server, so linked identities are current.
   - Loading and error states are kept separate.

**Phase 3 status (2026-10-13): done.**
- Moved with `git mv`, so their history is kept:
  - `PasswordRequirementList.tsx` → `app/components/inputs/`;
  - `ErrorBanner.tsx` → `app/components/display/` (that folder already exists).
  - `ForgotPasswordClient` and `ResetPasswordClient` import them from the new paths.
- `app/components/inputs/NewPasswordFields.tsx`:
  - renders the new-password and confirm-password fields plus the checklist, as a fragment so the fields keep the parent form's spacing;
  - takes the same props as mobile (`passwordLabel` defaults to "New Password");
  - field errors accept `string | null`.
  - `ResetPasswordClient` now uses it. The labels, placeholders, `name`/`autoComplete` values and checklist are unchanged.
- `hooks/use-password-sign-in-status.ts` → `usePasswordSignInStatus()` returns `{ status, loading, error }`:
  - `status` is `"has_password" | "no_password"`, or `null` when no one is signed in;
  - `getUser()` errors come back through `useAsyncResource`'s `error`.
- Checks:
  - Web typecheck, lint and tests pass (47 tests).
  - `/forgot-password` renders in the browser with no console errors.
  - The reset page needs a real emailed code, so its browser check is part of the Phase 5 forgot-password regression test.

### Phase 4 — Security tab and change-password form

1. `SecurityTab.tsx`:
   - Add local `view: "list" | "change-password"` state.
   - **Change Password** row, driven by `usePasswordSignInStatus`:
     - while loading: disabled;
     - `has_password`: clickable (`onClick` → `"change-password"`);
     - `no_password`: disabled with a "Signed in with Google" chip;
     - on error: disabled, with the error logged.
   - Add a small status chip next to `ComingSoonChip` (or give `ComingSoonChip` a label prop) rather than a one-off style.
   - Only the non-admin branch changes; the admin card and the Change Email row stay as they are.
2. New `app/components/settings/ChangePasswordForm.tsx` (client), mirroring the mobile screen. Use HeroUI components first, `cursor-pointer` on every clickable, and follow DESIGN.md's web form and error-banner rules:
   - Header: an icon-only back button (`aria-label="Back to Security"`), the title "Change Password", and the same intro text as mobile ("Enter your current password, then choose a new one. You'll stay signed in here, and any other devices will be signed out.").
   - Inside a HeroUI `Form` (`validationBehavior="aria"`):
     - "Current Password" `PasswordField` (`autoComplete="current-password"`);
     - `NewPasswordFields`;
     - a Cancel button (tertiary, goes back) and an "Update Password" button (`isPending` while saving), side by side like the reset form.
   - Submit:
     - set `submitted`;
     - stop if the current password is empty ("Please enter your current password.") or the new password fails `usePasswordValidation`;
     - otherwise call the action inside `useTransition`.
   - Errors go where `getPasswordChangeErrorField` says:
     - `current` → under Current Password;
     - `new` → under New Password;
     - `general` → `ErrorBanner` at the top of the form.
   - Editing a field clears its server error.
   - Unexpected throws are logged by type only and show "Something went wrong. Please try again."
   - Success:
     - clear all three fields;
     - show `toast.success("Password updated", { description: "Other devices were signed out." })`;
     - return to the list view.
   - While saving, all fields and buttons are disabled, so a second press can't start a second change.
   - Passwords live only in component state, never in the URL, storage, context or logs.

**Phase 4 status (2026-10-13): done; signed-in browser checks are in Phase 5.**
- `SecurityTab.tsx`:
  - The admin branch renders exactly as before.
  - Tenants and landlords get an `AccountSecurity` section with `list` / `change-password` views:
    - the Change Password row is enabled only for `has_password`;
    - it shows a "Signed in with Google" chip for `no_password`;
    - it's disabled while loading, signed out, or on error;
    - Change Email is untouched.
  - When the form closes, focus goes back to the row.
- New `app/components/settings/StatusChip.tsx` (label prop); `ComingSoonChip` now renders `<StatusChip label="Coming soon" />`.
- New `app/components/settings/ChangePasswordForm.tsx`:
  - The layout, copy, validation messages and error placement follow the plan.
  - On open, focus moves to the heading.
  - On success it shows the toast and closes; unmounting discards all three passwords, so there's no separate clearing step.
- `SettingsRow` buttons now show `cursor-pointer` (and `cursor-not-allowed` when disabled) plus a focus ring. The Help tab's FAQ row gets these too.
- Found in the browser: signed out, `getUser()` returned `AuthSessionMissingError`, which the hook logged as a failure. The hook now checks `getSession()` first and returns `null` without an error when signed out.
- Checks:
  - Web typecheck and lint pass.
  - In the browser, signed out on `/?settings=open`: the Security tab renders, Change Password is disabled (`cursor: not-allowed`), Change Email shows "Coming soon", and a fresh load logs no errors.
  - The existing navbar `inert` hydration warning, when Settings opens on page load, is unrelated to this change.
  - The dev server uses the hosted Supabase project and the repo has no test accounts. So the signed-in checks (opening the form, each error, a real change) wait for the Phase 5 manual run on your test account.

### Phase 5 — Verify and document

1. Run:
   - `pnpm --filter web lint`, `pnpm --filter web typecheck`, `pnpm --filter web test`
   - `pnpm --filter mobile lint`, `pnpm --filter mobile exec jest --runInBand` (covers the moved `@repo/utils` tests and the mobile screen/service)
   - `graphify update .`
2. Browser checks with the dev server (`pnpm web`) on an email/password test account, as tenant and landlord:
   1. Settings → Security → Change Password opens the form. A Google-only account sees the disabled "Signed in with Google" row. An admin still sees the unchanged "not available here yet" card.
   2. Wrong current password → error under that field; nothing changes.
   3. New password equal to the current one → "must be different" under New Password; the form keeps its values.
   4. Weak or mismatched new password → submit blocked by the checklist and messages.
   5. Valid change → toast, back on the Security list, still signed in. The modal stays open after the action's cookie update and page re-render.
   6. Sign out and back in: the old password is rejected and the new one works.
   7. A second browser signed into the same account is signed out.
   8. The "Your APT password was changed" email arrives.
   9. Forgot-password still works end to end after the component moves (regression check).
   10. Keyboard only: tab order, visible focus rings, Enter submits, the back button works; dark mode looks right.
3. Docs:
   - ARCHITECTURE.md §4.3: a "Password change" note next to web password recovery (server action, recovery-marker guard, shared `changePasswordWith`).
   - §4.4: say the sequence is now shared through `@repo/utils`.
   - AGENTS.md: web stack notes get the change-password action and the Security-tab sub-view; the `@repo/utils` package row gains `changePasswordWith` / `getPasswordChangeErrorField`.
   - DESIGN.md: document the shared web `NewPasswordFields`, `PasswordRequirementList` and `ErrorBanner` locations.

## Out of scope / follow-ups

- Server-enforced current-password check (same follow-up as mobile: e.g. reauthentication by email code for changes outside recovery).
- Change Email (stays "Coming soon" on both platforms).
- Change password for admins (their Security tab keeps its current card).
- A link from the change-password form to "Forgot your password?". It would start a recovery that signs this session out, so leave it out for now.

## Acceptance criteria

- Email/password and linked tenant and landlord accounts can change their password from Settings → Security on web. Google-only accounts see a disabled row explaining they sign in with Google.
- The password changes only after the current password is verified; a wrong current password changes nothing.
- Same-as-current and too-weak passwords are rejected with inline messages, and the form keeps its values.
- After a change, this browser stays signed in, all other sessions are signed out, and the password-changed email is sent.
- Mobile and web run the same shared change-password sequence, and mobile behaviour is unchanged.
- Forgot-password behaviour is unchanged after the component moves.
- No password appears in URLs, logs, storage or error messages. CI (mobile lint + jest, web lint + typecheck + tests) passes.
