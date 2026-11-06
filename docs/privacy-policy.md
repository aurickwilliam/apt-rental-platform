# Privacy Policy revision 1.1

The November 6, 2026 revision describes APT's existing processing. It does not
add data collection, change permissions, implement erasure, or certify compliance.
Terms remain version 1.1 with their existing wording.

## Content and evidence

- Web source: `apps/web/app/(main)/pap/data/pap-sections.ts`.
- Mobile mirror: `apps/mobile/constants/legal/privacy.ts`; the policy parity test
  checks every section, paragraph, list, callout and metadata against the web.
- Account, Passport, application, finance and signed-lease access boundaries:
  `AGENTS.md`, `ARCHITECTURE.md` and the existing caller-bound service/RLS contracts.
  `apps/web/lib/public-profile-loaders.ts` separates display from contact columns.
- Ava: `docs/ai-search.md` and `supabase/functions/ai-search/index.ts`; disclose
  conversation text sent to Gemini, possible free-tier prompt reuse, no automatic
  profile/document inclusion, and fallback search. Do not promise provider-side
  non-retention or that user-entered text contains no personal information.
- Payments: the existing hosted PayMongo test-mode/simulation flow, not live
  collection or landlord disbursement; credentials are entered on hosted checkout.
- Notifications: `supabase/functions/push-notify/index.ts` and
  `supabase/functions/email-notify/index.ts`; Expo push and configured Brevo
  moderation emails process delivery data and content.
- Permissions: `apps/mobile/app.config.js`; describe feature-specific camera,
  media, location and notification use without claiming whole-library uploads.
- Device storage and optional CAPTCHA follow their existing feature contracts;
  do not describe optional Turnstile as enabled in every environment.

Keep the existing 13 sections and readers. The Questions/contact footer stays
removed. Sensitive answers, public versus restricted records, recipient copies,
deletion limitations and Philippine privacy rights are now explicit. This notice
is not a replacement for specific consent where legally required, including for
sensitive information. A policy checkbox alone does not implement such consent.

## Release coordination

1. Have the responsible operator review the wording and obtain Philippine
   privacy/legal review. Confirm the legal operator, an actual usable privacy
   request channel, actual hosting/provider arrangements, retention practices and
   any necessary feature-specific consent. These facts are not invented by this
   revision; the notice must not be treated as proof that operational gaps are fixed.
2. Review and apply `20261106120000_privacy_policy_revision.sql` to the correct
   project as part of the coordinated release. This local implementation does not
   apply the migration remotely or publish web/mobile releases.
3. Release matching web/mobile content and revision metadata. The database's
   `web_registration_policies` privacy row becomes `1.1`; Terms stay `1.1`.
   Historical `policy_acceptances` rows and their timestamps stay untouched.
4. An old web tab or installed app submitting privacy `1.0` will be refused at
   registration completion and must reload/update and review the current notice.
   Coordinate mobile distribution accordingly; never silently substitute a new
   revision or bypass the acceptance transaction to keep old clients registering.
5. Ordinary sign-in and completed accounts are not given a universal reacceptance
   gate. Any notice or renewed consent legally needed for a particular processing
   change must be assessed separately, not inferred from existing acceptance rows.

## Verification

- Mobile legal content/rendering, registration and onboarding tests.
- Web registration policy/modal tests.
- `pnpm db:web-registration:test` and `pnpm db:mobile-registration:test` use
  embedded PostgreSQL, apply the revision, reject stale submissions and exercise
  current registration. The web contract also checks that historical acceptance
  records and completed-account access survive the revision.
- Typecheck and lint the affected apps/files. No new dependencies or UI controls.
