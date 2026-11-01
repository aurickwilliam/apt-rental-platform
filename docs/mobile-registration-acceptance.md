# Mobile registration policy acceptance

## Scope and UI

Email signup's Complete Profile and signed-in Finish Profile (Google onboarding,
interrupted email signup, incomplete profiles) require separate Privacy and Terms
selections. Both start false. Completed accounts, ordinary sign-in and role
additions are not enrolled again. Older installed apps remain compatible.

The existing mobile form stays in place. `RegistrationPolicyAcceptance` uses
HeroUI Native controls and opens `RegistrationPoliciesDialog`; its fixed title,
policy switch and Close surround the scrollable `LegalPolicyContent`, also used
by Settings. Reading or closing never accepts a policy or resets the form.
See DESIGN.md §10. No new dependencies or native rebuild requirements are added.

## Flow and storage

`useRegistrationAcceptance` owns local selections/errors. Submit is disabled
until both are selected, and hooks/services validate independently. The email
journey carries the selected versions and normalized profile snapshot through
`useRegistrationStore` in memory only. Resending and wrong codes retain the
selections. A fresh registration starts unchecked; success/back clears the store.
Confirm-email mode has no signup draft and continues through the existing
Finish Profile recovery path, where policies are presented before completion.

After verifying the code, signup calls `completeMobileRegistration`. Finish
Profile calls the same service. No direct profile-only fallback exists.
Acceptance errors stay inline; other errors retain the existing error handling.
If final signup completion fails after verification, the session is signed out;
the verified account can sign in to finish onboarding. Stale policy errors ask
for an updated app and fresh review, never silently substitute new versions.

## Database contract

`20261031120000_mobile_registration_policy_acceptance.sql` is additive. It
extends acceptance source values with `mobile_registration` and
`mobile_profile_completion`, reuses `web_registration_policies` revisions, and
adds `complete_mobile_registration` plus `record_mobile_policy_acceptance`.
The existing web functions are unchanged.

The completion function is SECURITY INVOKER: profile column grants, owner RLS
and validation triggers still apply. It derives ownership/email from the caller,
checks an expected Auth ID to reject account-switch races, locks the account,
validates editable fields and onboarding eligibility, and writes the profile.
Google role selection uses `set_onboarding_role`; held consumer roles on mixed
accounts remain available without granting any new role or admin access.

The narrow definer helper records only the caller's two current policies, using
the internal `users.id`, database timestamps and owner-only SELECT. Clients have
no direct acceptance writes. The helper locks/rechecks authoritative revisions;
any failure rolls back completion, including a Google role change. Retries of
completed mobile registrations do not overwrite profiles or original timestamps.
Calling the helper alone cannot complete a profile or grant access.

This is journey-specific enforcement, not a universal account gate. There are no
new global triggers, Auth settings or restrictions on older profile-only writes.
There are no IP addresses, device fingerprints or acceptance flags in Auth metadata.

## Release and verification

Apply the migration **before releasing this mobile code**. This implementation
does not apply hosted changes. Confirm the remote target against an approved
source for the mobile app's public Supabase URL, without reading `.env` files;
do not infer the target from the CLI link. A missing RPC fails safely rather
than allowing signup without recorded acceptance.

Run:

```sh
pnpm db:mobile-registration:test
pnpm db:web-registration:test
pnpm --filter mobile typecheck
pnpm --filter mobile lint
pnpm --filter mobile exec jest --runInBand --forceExit
```

The mobile database command runs embedded PostgreSQL only (no remote access),
covering ownership, source/version validation, atomic rollback, timestamps,
replay, role rules, suspension, completed accounts and web/older-app compatibility.
Mobile tests cover checkbox behavior, policy reading, drafts, hooks and OTP paths.
Real email/Google signup and device accessibility checks remain release checks
after the migration is applied to the confirmed project.
