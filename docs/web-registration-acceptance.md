# Web registration policy acceptance

## Scope

New web email registrations and Complete Profile submissions require separate,
explicit acceptance of the Privacy Policy and Terms and Conditions. Google
authentication creates an Auth account (and its incomplete placeholder), not
acceptance. Returning completed accounts are not enrolled again. Role additions
and ordinary sign-in do not ask for acceptance.

The mobile source and its database write contract are unchanged. A person can
leave web onboarding and complete their account through mobile without these
records. This is a web registration journey guard, not platform-wide enforcement
or a claim that direct Supabase profile writes require acceptance.

## UI

See DESIGN.md §10. `RegistrationPolicyAcceptance` is shared by both web forms.
Selections are local, initially false, and never persisted as proof. Policy-name
buttons open `RegistrationPoliciesModal` on the corresponding tab, with both
documents available without navigating away. The dialog's heading, tabs and Close
controls stay outside the scrolling panel. `RegistrationPolicyContent` is loaded
on demand and reuses the public policy data and legal components, including
version metadata, all sections and contact details. Section IDs are namespaced
per dialog and document; their headings are nested beneath the dialog heading.
Reading, switching tabs and closing do not accept policies, submit registration
or reset the form. HeroUI manages keyboard focus/trapping and restores focus on
dismissal. Public policy URLs remain available outside registration.
Submission stays disabled until both are selected;
server actions independently reject missing, malformed or stale acceptance.

## Storage and authorization

`lib/registration-policies.ts` supplies the displayed policy revisions and form
validation. `web_registration_policies` holds database-authoritative revisions;
version changes require a reviewed migration and a matching web configuration
change. The database contract test checks their parity. It does not automatically
require existing accounts to accept later revisions.

`service/registrationService.ts` calls `complete_web_registration` once. This
SECURITY INVOKER transaction preserves existing profile column grants, owner RLS,
validation triggers and `set_onboarding_role`'s Google-only role selection. It
accepts only editable profile fields, resolves the caller with `auth.uid()` and
uses the verified JWT email for new profiles. It rejects completed, suspended,
admin and otherwise ineligible profiles. An advisory account lock also covers
concurrent submissions before a profile row exists.

The narrow SECURITY DEFINER helper `record_web_policy_acceptance` writes only
the caller's own current acceptances. It takes no account ID or timestamp; it
locks/rechecks policy revisions before recording both rows. Its authenticated
EXECUTE grant is necessary because the outer transaction is an invoker. Calling
the helper separately can attest to an already completed account's own policies,
but cannot complete a profile, grant roles, change access or record another
account's acceptance.

`policy_acceptances.user_id` references the internal `public.users.id`, not the
Auth ID. Rows include policy ID, version, database time and web source. The
primary key makes retries idempotent without rewriting original timestamps.
Ordinary clients have owner-only SELECT and no direct write grants. Account
deletion cascades its acceptance rows. No IP address or browser fingerprint is
collected. A failed acceptance insert rolls back the profile and role change.

## Interrupted journeys

Before submission, refresh discards checkbox state and leaves the account
incomplete. Existing server onboarding guards prevent portal entry. Email OTP
verification may already create a session; a failed final submission signs it
out and preserves the existing sign-in-to-finish path. Complete Profile handles
both Google placeholders and confirmed email accounts without profile rows.
Acceptance errors stay inline and clear the selections. Other validation errors
preserve the draft. A stale-policy message asks the user to reload/review; it
does not silently accept a newer revision.

## Deployment

Apply `supabase/migrations/20261029120000_web_registration_policy_acceptance.sql`
to the confirmed target **before deploying the web changes**. No global trigger,
required profile column, Auth configuration or existing mobile RPC is changed.
The migration alone does not impose acceptance on existing registrations.

Never infer a remote target from the CLI link. Confirm it against the active
web app's public Supabase URL through an approved source; `.env` files are not
needed. Local contract tests do not apply a hosted migration. Hosted rollout and
real email/Google end-to-end checks require confirmed project/access and test
accounts. If the new RPC is absent, registration fails rather than falling back
to a profile-only write.

## Verification

```sh
pnpm db:web-registration:test
pnpm --filter web test
pnpm --filter web lint
pnpm --filter web typecheck
```

The embedded PostgreSQL suite exercises actual migration functions, RLS, grants,
rollback, timestamps, replay, account restrictions and mobile-style legacy
writes. Web tests exercise both form integrations, all three server entry
points, policy versions, installed HeroUI markup and OTP error cleanup.

`apps/web/tests/registration/` is an isolated UI fixture for keyboard, disabled
submission, policy-dialog navigation/focus and responsive theme checks. It uses production
checkboxes and freshly compiled application CSS, never Next, Auth, `.env` or hosted data.
Build it with an existing temporary esbuild installation via
`REGISTRATION_ESBUILD_PATH` and pass an output directory to `build-fixture.mjs`.
Run `check-fixture.mjs` with the same output directory and
`REGISTRATION_PLAYWRIGHT_PATH` pointing to a temporary Playwright installation;
`REGISTRATION_BROWSER_PATH` optionally selects an installed Chromium/Edge binary.
It is not a substitute for real OAuth and email journey checks after rollout.
