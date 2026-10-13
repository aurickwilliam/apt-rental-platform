# Mobile Forgot-Password Recovery

## Goal

Replace the current mobile-only prototype with a secure, working Supabase email-code password-recovery flow for accounts that use email and password authentication. The current UI claims both SMS and email recovery, but neither sends nor verifies a recovery credential, and submitting a new password does not update Supabase Auth.

## Scope and decisions

- Implement **email-code recovery only** in this change. Remove the SMS option rather than presenting an unavailable recovery method.
- Recovery is intended for accounts with an email/password credential. Google-only accounts are told to continue with Google instead.
- **Google-only exclusion is an app-flow rule, checked after code verification.** The app cannot know an email's account type before sending a code without revealing that the account exists, so the request step treats every email the same. After `verifyOtp` succeeds, the recovery session exposes the user's identities; if there is no `email` identity, the app signs the recovery session out and shows a "continue with Google" message instead of the reset screen. This is not an enforceable security boundary — a direct Supabase Auth call could still set a password — and that is accepted: whoever can read the inbox already controls the account. A server-side block (Send Email Auth Hook) is out of scope.
- Keep the existing password-strength rules from `@repo/hooks`.
- Use the existing mobile Supabase client and Supabase Auth recovery OTP verification.
- Do not create or update `public.users` records: password recovery changes only the Supabase Auth password.
- Preserve account-enumeration resistance by showing the same post-submit confirmation for an existing or unknown email address.
- **A verified recovery code creates a full, persisted Supabase session.** The flow must never leave that session behind unless the password was actually changed and the user then signed out (see Phase 4).
- The recovery email address is passed between screens in local in-memory state only — never in route params or URLs (AGENTS.md: no PII in URLs).

## Implementation phases

### Phase 1 — Confirm account types and configure recovery email

- Confirm how the hosted Supabase project represents email/password, Google-only, and linked Google-plus-password identities (`user.identities[].provider`), so the post-verification check in Phase 3 uses the right field.
- Document the Google-only exclusion as an app-flow limitation (see Scope and decisions) in the service file and in the PR description.
- Configure the hosted `recovery` email template to send the six-digit `{{ .Token }}`, not a link, with copy specific to password recovery (the existing `supabase/templates/otp.html` says "verification code"; add a recovery-specific template such as `supabase/templates/recovery.html`).
- Confirm the hosted OTP length is six digits and note the OTP expiry and the email-send frequency limit (default ~60 seconds); the resend cooldown in Phase 3 must match that limit.
- Enable the password-changed security notification if available.
- Mirror the recovery template in `supabase/config.toml` by adding an `[auth.email.template.recovery]` section (subject + `content_path`), and the password-changed notification where the local config supports it. Local config must not be treated as deployment of hosted Auth configuration.

**Phase 1 findings (2026-10-13):**
- Hosted accounts come in three shapes, and an `email` identity always means the account has a password: Google-only (`identities` = `google`, no password), email/password (`email`), and linked (`email` + `google`, has a password). The Phase 3 check is therefore: the verified user's `identities` include provider `email` (mirrored in `app_metadata.providers`).
- Templates: `supabase/templates/recovery.html` (6-digit `{{ .Token }}`, recovery wording) and `supabase/templates/password-changed.html` (security notice), both using the existing OTP email design; mirrored in `supabase/config.toml` under `[auth.email.template.recovery]` and `[auth.email.notification.password_changed]`.
- Hosted Auth settings (confirmed via the Management API): `mailer_otp_length` 6, `mailer_otp_exp` 300 s (matches "expires in 5 minutes" in the emails), `smtp_max_frequency` 60 s (→ Phase 3 resend cooldown is 60 s), `security_update_password_require_reauthentication` false (so `updateUser({ password })` works on the recovery session without a reauth step), `password_min_length` 6 (the app's `@repo/hooks` rules are stricter and remain the user-facing rule). Mirrored in `supabase/config.toml` `[auth.email]`.
- Hosted templates applied 2026-10-13 via the Management API; the recovery template and password-changed notification are live. The dashboard editor rejects them as "Too big" (>50,000 characters, because of embedded fonts) — edit them only through `build-payload.py` + the API, never by saving or resetting in the dashboard. When printing the API response, never print the full config: it contains SMTP credentials.
- Hosted rollout: `python3 supabase/templates/build-payload.py <out.json>` builds the Management API payload (fonts embedded) for `PATCH /v1/projects/{ref}/config/auth`. Never use `supabase config push` for this — it would also push local-only auth settings such as `site_url`.

### Phase 2 — Add the mobile recovery service

   - Create `apps/mobile/service/auth/passwordRecoveryService.ts` following the existing `service/auth/` conventions.
   - Expose typed helpers to:
     - request a password reset via `supabase.auth.resetPasswordForEmail(email)` — also used for **resend**, because `supabase.auth.resend()` does not support recovery codes (do not copy the signup screen's resend call);
     - verify a supplied six-digit recovery code with `supabase.auth.verifyOtp({ email, token, type: "recovery" })`;
     - report whether the verified user has an email/password identity (Google-only check);
     - update the authenticated recovery user's password with `supabase.auth.updateUser({ password })`;
     - end the recovery session (`supabase.auth.signOut()`).
   - Normalize expected Supabase errors into safe user-facing messages, at minimum:
     - invalid or expired code (`otp_expired`, invalid token);
     - email send rate limit (`over_email_send_rate_limit` / HTTP 429);
     - new password equal to the old one (`same_password`);
     - password rejected by Supabase's own strength policy (`weak_password`);
     - missing or expired session during the update;
     - network failure.
   - Log only unexpected errors, and never log the email, recovery code, password, or session tokens.

### Phase 3 — Replace the prototype UI

   - Update `apps/mobile/app/(auth)/forgot-password/index.tsx` to collect and validate an email using the existing `isValidEmail` helper from `@repo/utils`.
   - Disable the submit action while the request is pending, surface inline validation/network errors, and show a neutral “check your email” confirmation after Supabase accepts the request.
   - Remove the non-functional SMS choice.
   - Show a static note on the email screen, visible to everyone, e.g. "Signed up with Google? You don't have a password — use Continue with Google on the sign-in screen instead." It involves no account lookup, so it reveals nothing about whether an account exists; the post-verification Google-only check below remains the safety net.
   - Hold the submitted email in local in-memory state shared by the recovery screens (e.g. a small Zustand store in `stores/` with `reset()`, cleared when the flow ends) — not in route params.
   - Repurpose `forgot-password/otp-verification.tsx` as the email recovery-code screen: show the email the code was sent to, verify the code, then:
     - if the account has an email/password identity, navigate to reset password;
     - if it is Google-only, sign the recovery session out, clear flow state, and show a "this account signs in with Google" message with a way back to sign-in.
   - Resend: call the same `resetPasswordForEmail` helper. Keep a visible cooldown timer that matches the server's send-frequency limit (Phase 1), and also surface the server's rate-limit error clearly if it is hit anyway.

### Phase 4 — Perform and close the real password change

   - Update `apps/mobile/app/(auth)/forgot-password/reset-password.tsx` to call the recovery service only after local password validation succeeds.
   - Add pending state, prevent duplicate submissions, and retain the entered form when the server rejects the change.
   - Guard the reset screen so it cannot be used without a valid recovery session.
   - **Never leave an unfinished recovery session behind:**
     - leaving the reset screen without completing it (back button, hardware back, swipe) signs the recovery session out and clears flow state;
     - mark "recovery in progress" in AsyncStorage when the code is verified and clear it on completion; on app start (`app/index.tsx` boot redirect), if the marker is present, sign out and route to sign-in instead of restoring the session into a portal.
   - On success, clear sensitive local password state, clear the recovery-in-progress marker and flow store, sign out the recovery session, clear the mobile React Query cache, and use `router.dismissAll()`/`replace()` to show the existing success screen without leaving a navigable recovery stack.

### Phase 5 — Retire prototype behavior and add regression coverage

   - Remove hard-coded contact data, unconditional success navigation, and fake OTP verification from the recovery flow.
   - Do not reuse the signup OTP flow: it has signup-specific account-creation behavior and cannot safely verify password-recovery credentials.
   - Add service unit tests (co-located in `service/auth/`) covering reset requests, resend via `resetPasswordForEmail`, recovery-code verification, the Google-only identity check, password update, sign-out, and every error mapping listed in Phase 2.
   - Add screen tests, following the existing render tests under `components/` (`@testing-library/react-native`), for invalid email, pending/disabled controls, neutral success messaging, expired/invalid codes, the Google-only message, failed password update, abandoning the reset screen (sign-out), and successful sign-out/navigation.
   - Test email/password, Google-only, and linked Google-plus-password accounts against the post-verification rule.
   - Mock Expo Router and Supabase Auth; assert no email, password, token, or recovery code is written to logs or route parameters.
   - Add a device-level manual test using a non-production test account: request reset, enter the email code, set a new password, verify old-password sign-in fails and new-password sign-in succeeds. Also kill the app on the reset screen and confirm the next launch lands on sign-in, not a portal.

### Phase 6 — Verify and document the completed flow

   - Run `pnpm --filter mobile typecheck`.
   - Run `pnpm --filter mobile lint`.
   - Run the new focused recovery tests, then `pnpm --filter mobile exec jest --runInBand`; separately record and avoid changing unrelated existing failures if they remain.
   - Run `graphify update .` after code changes.
   - Update `ARCHITECTURE.md` only if the shipped authentication flow diagram or canonical mobile-auth description changes materially.

## Out of scope / follow-ups

- **Web forgot-password page.** The web sign-in form (`apps/web/app/(auth)/components/AuthForm.tsx`) links to `/forgot-password`, but no such route exists, so it shows a "not found" page. Track a follow-up to build the web flow mirroring this one (AGENTS.md: keep web and mobile aligned), or hide the link until then.
- Server-side enforcement of the Google-only exclusion (Send Email Auth Hook).

## Acceptance criteria

- A user can request an email recovery code from the mobile sign-in flow without revealing whether the account exists.
- A user with an eligible email/password account can enter the emailed recovery code to establish a valid recovery session and reach password reset.
- A Google-only account that verifies a code is signed out and told to continue with Google; it never reaches the reset screen.
- Password updates succeed only with a valid recovery session; invalid, expired, or reused codes cannot reach the success state.
- Abandoning the flow after verifying a code — backing out, or closing the app — never leaves the user signed in.
- Resend sends a real new code via `resetPasswordForEmail`, with a cooldown matching the server limit.
- On success, the user is signed out and can sign in using the new password only.
- The recovery email is never placed in route params or URLs.
- The UI contains no available-but-nonfunctional SMS option, hard-coded contact data, fake OTP verification, or unconditional success navigation.
- Automated tests cover the request, resend, code-verification, Google-only, update, abandonment, and error paths.
