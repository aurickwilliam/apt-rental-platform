# Mobile Forgot-Password Recovery

## Goal

Replace the current mobile-only prototype with a secure, working Supabase email password-recovery flow. The current UI claims both SMS and email recovery, but neither sends nor verifies a recovery credential, and submitting a new password does not update Supabase Auth.

## Scope and decisions

- Implement **email-link recovery only** in this change. Remove the SMS option rather than presenting an unavailable recovery method.
- Keep the existing password-strength rules from `@repo/hooks`.
- Use the existing mobile Supabase client, which is configured for PKCE, and the existing `mobile://` Expo scheme.
- Do not create or update `public.users` records: password recovery changes only the Supabase Auth password.
- Preserve account-enumeration resistance by showing the same post-submit confirmation for an existing or unknown email address.

## Implementation plan

1. **Verify Supabase Auth configuration before client work.**
   - Confirm the hosted APT project permits `mobile://` recovery redirect URLs, including the exact recovery callback path chosen below.
   - Configure the hosted recovery email template to preserve the caller-provided redirect URL and work with PKCE.
   - Enable the password-changed security notification if it is available for the project.
   - Mirror the recovery template and redirect URL in `supabase/config.toml` for local development where feasible. Do not treat the local config as deployment of the hosted project configuration.

2. **Add a focused auth recovery service.**
   - Create `apps/mobile/service/auth/passwordRecoveryService.ts` following the existing `service/auth/` conventions.
   - Expose typed helpers to:
     - request a password reset via `supabase.auth.resetPasswordForEmail(email, { redirectTo })`;
     - parse a returned recovery URL safely;
     - exchange the PKCE `code` with `supabase.auth.exchangeCodeForSession` and confirm the recovery session;
     - update the authenticated recovery user's password with `supabase.auth.updateUser({ password })`.
   - Normalize expected Supabase errors into safe user-facing messages, log only unexpected errors, and never log the email, recovery code, or session tokens.

3. **Replace the recovery-method picker with an email-request screen.**
   - Update `apps/mobile/app/(auth)/forgot-password/index.tsx` to collect and validate an email using the project’s existing `isValidEmail` helper.
   - Build the redirect URL with Expo Linking for a dedicated recovery callback route.
   - Disable the submit action while the request is pending, surface inline validation/network errors, and show a neutral “check your email” confirmation after Supabase accepts the request.
   - Remove the non-functional SMS choice and the prototype OTP navigation.

4. **Handle recovery deep links across cold and warm app starts.**
   - Add a recovery callback route under `apps/mobile/app/(auth)/forgot-password/` and register it in that folder’s layout.
   - Ensure the handler processes both a newly opened deep link and a link delivered while the app is already running. Exchange the PKCE code exactly once, then replace the callback route with the reset-password screen.
   - Reject malformed, expired, reused, or non-recovery links with a clear retry path back to the email-request screen.
   - Avoid routing normal sign-in/OAuth callbacks into the recovery path; preserve the existing Google OAuth callback behavior.

5. **Make password submission perform the real password change.**
   - Update `apps/mobile/app/(auth)/forgot-password/reset-password.tsx` to call the recovery service only after local password validation succeeds.
   - Add pending state, prevent duplicate submissions, and retain the entered form when the server rejects the change.
   - On success, clear sensitive local password state, sign out the recovery session, clear the mobile React Query cache, and use `router.dismissAll()`/`replace()` to show the existing success screen without leaving a navigable recovery stack.

6. **Retire or repurpose the prototype OTP screen.**
   - Remove `apps/mobile/app/(auth)/forgot-password/otp-verification.tsx` and its layout registration if the new email-link flow makes it unused.
   - Do not reuse the signup OTP flow: it has signup-specific account-creation behavior and cannot safely verify password-recovery credentials.

7. **Add regression coverage.**
   - Add service unit tests covering reset requests, recovery-code exchange, password update, and Supabase error mapping.
   - Add screen tests for invalid email, pending/disabled controls, neutral success messaging, expired/invalid callback handling, failed password update, and successful sign-out/navigation.
   - Mock Expo Linking, Expo Router, and Supabase Auth; assert no password or token is written to logs or route parameters.
   - Add a device-level manual test using a non-production test account: request reset, open the email link from a cold app start, set a new password, verify old-password sign-in fails and new-password sign-in succeeds.

8. **Verify and document the completed flow.**
   - Run `pnpm --filter mobile typecheck`.
   - Run `pnpm --filter mobile lint`.
   - Run the new focused recovery tests, then `pnpm --filter mobile exec jest --runInBand`; separately record and avoid changing unrelated existing failures if they remain.
   - Run `graphify update .` after code changes.
   - Update `ARCHITECTURE.md` only if the shipped authentication flow diagram or canonical mobile-auth description changes materially.

## Acceptance criteria

- A user can request an email reset link from the mobile sign-in flow without revealing whether the account exists.
- The link opens the installed app, establishes a valid recovery session, and leads only to password reset.
- Password updates succeed only with a valid recovery session; invalid, expired, or reused links cannot reach the success state.
- On success, the user is signed out and can sign in using the new password only.
- The UI contains no available-but-nonfunctional SMS option, hard-coded contact data, fake OTP verification, or unconditional success navigation.
- Automated tests cover the request, callback, update, and error paths.
