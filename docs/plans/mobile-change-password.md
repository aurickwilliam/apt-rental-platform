# Mobile Change Password

## Goal

Turn the **Change Password** row in mobile Settings (currently disabled with a "Coming soon" chip) into a working flow that lets a signed-in user with an email/password credential change their password, reusing the building blocks shipped with forgot-password (`docs/plans/mobile-forgot-password.md`).

## Scope and decisions

- **Mobile only.** The web has no settings page for this yet; web parity is a follow-up.
- **Who can use it:** accounts with an `email` identity (email/password, or linked Google-plus-password). Google-only accounts have no password to change: their row stays disabled with a "Signed in with Google" note instead of "Coming soon". **Change Email** stays "Coming soon".
- **Current password is required by the app.** The screen asks for the current password and checks it with `signInWithPassword` before changing anything. Supabase's own "require current password" setting is project-wide and would also apply to the recovery session used by forgot-password (where the user doesn't know the old password), so it stays off. This is therefore an app-flow check, not a server-enforced one: a session that is already signed in could still change the password through a direct Auth call. Accepted for now; listed under follow-ups.
- **After a successful change:** the user stays signed in on this device and every **other** session is ended (`signOut({ scope: "others" })`), so anyone else using the account is signed out. The hosted "password changed" security email (already enabled) is sent by Supabase automatically.
- **Reuse, don't duplicate:**
  - Password rules stay in `usePasswordValidation` (`@repo/hooks`).
  - Supabase error mapping moves out of `passwordRecoveryService.ts` into a shared module both flows use.
  - The password fields and requirements checklist move out of the reset screen into one shared component used by both screens.
- No database changes: only Supabase Auth's password changes.

## Implementation phases

### Phase 1 — Share the password building blocks

- Move `PasswordRecoveryError`, its reasons/messages and `toRecoveryErrorReason` from `service/auth/passwordRecoveryService.ts` into `service/auth/passwordErrors.ts` (named for both flows, e.g. `PasswordError` / `toPasswordErrorReason`). Add the reason `wrong_current_password` ("Your current password is incorrect."). Update the recovery service, its screens and tests to import from the new module; behaviour unchanged.
- Extract the new-password + confirm fields and the "Your password must contain" checklist from `app/(auth)/forgot-password/reset-password.tsx` into a shared component (e.g. `components/inputs/NewPasswordFields.tsx`). Build it on the canonical HeroUI `TextField` + `InputGroup` with the eye-toggle suffix (DESIGN.md §10) and Tabler icons, replacing the transitional `AppInput` and the `@expo/vector-icons` Ionicons the reset screen uses today. The reset screen switches to the shared component; its behaviour and tests stay green.

### Phase 2 — Change-password service

- Create `service/auth/passwordChangeService.ts`:
  - `getPasswordSignInStatus()` — reads the signed-in user (`supabase.auth.getUser()`) and reports whether they have an email/password identity, reusing `hasEmailPasswordIdentity`.
  - `changePassword(currentPassword, newPassword)`:
    1. Read the user's email from the session.
    2. Verify the current password with `signInWithPassword({ email, password: currentPassword })`; `invalid_credentials` → `wrong_current_password`.
    3. `updateUser({ password: newPassword })` (`same_password`, `weak_password` map as in recovery).
    4. `signOut({ scope: "others" })`. A failure here is logged, not shown: the password has already changed.
- Never log the current or new password (log only error name/code/status, as the recovery service does).
- Note: if Supabase's "secure password change" (reauthentication) is ever enabled, `updateUser` returns `reauthentication_needed`; the error module maps it to a clear message rather than the recovery-specific "reset session has expired".

### Phase 3 — Settings row and screen

- `app/settings/index.tsx`: the Change Password row reads `getPasswordSignInStatus()` through a small React Query hook (`hooks/auth/`, stable key, cleared with the query client on sign-out):
  - Email/password or linked account: the row is enabled and opens `/settings/change-password`.
  - Google-only account: the row stays disabled with a "Signed in with Google" chip.
  - While loading or on error: the row stays disabled, so it fails safe.
- New `app/settings/change-password.tsx` (registered in `app/settings/_layout.tsx`), using `StandardHeader` like the other settings screens:
  - **Current password** field (eye toggle) and the shared new-password fields.
  - Submit stays disabled until the new password passes the rules; it shows a pending state and ignores repeat presses.
  - `wrong_current_password` shows under the current-password field; `same_password` / `weak_password` show under the new-password field; other failures open `ErrorDialog`. The form keeps what was typed on any error.
  - On success: clear all password fields, show a success toast ("Password updated. Other devices were signed out.") with `useToast`, and go back to Settings.

### Phase 4 — Tests

- Service tests (`service/auth/passwordChangeService.test.ts`):
  - Current-password check, then update, then `signOut({ scope: "others" })`, in that order.
  - A wrong current password never calls `updateUser`.
  - Error mapping, including `wrong_current_password`.
  - A sign-out failure still resolves successfully.
  - Google-only, email and linked accounts in `getPasswordSignInStatus`.
  - No password in logs.
- Screen tests (`tests/settings/change-password.test.tsx`, with the `heroui-native` stub):
  - Validation and disabled submit.
  - Each inline error, plus the error dialog.
  - Pending state and repeat presses.
  - Success: toast, fields cleared, back to Settings.
  - Passwords never reach route params or console output.
- Settings row test: the row is enabled for password accounts, disabled with the Google note for Google-only accounts, and disabled while loading.
- Keep the forgot-password suites green after the Phase 1 refactor.

### Phase 5 — Verify and document

- Run `pnpm --filter mobile typecheck`, `pnpm --filter mobile lint` and `pnpm --filter mobile exec jest --runInBand`, then `graphify update .`.
- Update ARCHITECTURE.md §4.4 (password change next to password recovery) and AGENTS.md (the shared password service/error module and the "current password is an app-flow check" rule).
- **Manual device test** (email/password test account):
  1. Settings → Change Password opens the screen; a Google-only account sees the disabled row instead.
  2. Wrong current password → error under that field, nothing changes.
  3. New password equal to the current one → "must be different", form kept.
  4. Valid change → success toast, back in Settings, still signed in.
  5. Sign out and back in: the old password is rejected, the new one works.
  6. Another device or simulator signed into the same account is signed out.
  7. The "Your APT password was changed" email arrives.
  8. Forgot-password still works end to end (regression check after the Phase 1 refactor).

## Out of scope / follow-ups

- Server-enforced current-password check (needs a solution that keeps the forgot-password recovery session working, e.g. reauthentication by email code for changes outside recovery).
- Change Email (stays "Coming soon").
- Web change-password page.

## Acceptance criteria

- Email/password and linked accounts can change their password from Settings; Google-only accounts see a disabled row explaining they sign in with Google.
- The password changes only after the current password is verified; a wrong current password changes nothing.
- Same-as-current and too-weak passwords are rejected with inline messages, and the form is kept.
- After a change, this device stays signed in and all other sessions are signed out; the password-changed email is sent.
- Forgot-password behaviour is unchanged after the shared-component and error-module refactor.
- No password is written to logs or route params; automated tests cover the service, the screen and the settings row.
