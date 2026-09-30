# Mobile roles migration and production Supabase types

## Implementation status (2026-09-30)

The original steps below describe the migration as planned. Current mobile code already reads/inserts `users.roles`, uses the onboarding RPC, and rejects unsupported admin-only sessions. The remaining multi-role navigation gap is addressed with a per-auth-account portal preference in `apps/mobile/service/auth/portalPreference.ts` and `apps/mobile/stores/usePortalStore.ts`: last-used portal survives sign-out/sign-in for the same account, is revalidated against current roles on entry, and never grants a role. Sign-in no longer asks for a role; sign-up and incomplete Google onboarding retain role choice. The profile switch is shown only for accounts holding both roles. Notification routing and verification success use the authorized active portal instead of `roles[0]`.

Production schema was inspected read-only before regenerating `packages/supabase/src/types.ts` from project `ezxirkpgfpripjydcqnt` (`public,graphql_public` schemas). The generated diff removes obsolete suspension fields/relationships and missing admin RPCs and reflects the current schema. The web admin apartment visibility action now reports that the operation is unavailable; its server function and call site must be implemented and deployed together rather than bypassing authorization with a direct table update. Run the checks below again whenever this implementation changes. Device/simulator checks with non-destructive accounts are still required.

## Goal

Bring `apps/mobile` and `packages/supabase/src/types.ts` in line with **production** `public.users.roles` (`text[]`). The shared generated types still describe `users.role` and suspension columns that are absent from production. Updating the types before mobile is ready currently causes mobile TypeScript errors; ship both changes together.

The steps below are the original plan, retained for audit context. Do not treat the linked test project, older generated files, or older migration files as the current schema authority; do not mutate production account data to test routing.

## Scope and decisions

- Production project: `ezxirkpgfpripjydcqnt`. Read the live `users` columns, constraints, grants, RLS, and onboarding RPC signature before generation. Regenerate types from **this project only**, then review the whole diff (not just the `users` table) for unrelated drift. Do not hand-maintain the generated file.
- `users.roles` is the server-authoritative set of memberships. Keep `public.users.id` as the internal FK; `user_id` maps to `auth.uid()`.
- Tenant+landlord users may access either portal. The last-used portal preference is scoped to the auth account and survives sign-out; without a valid preference, use a deterministic held tenant/landlord role. Validate that preference against the latest profile roles; never use it to grant database access. If it is no longer valid, choose a valid remaining role. Admin profiles remain web-only on mobile.
- Onboarding may request `tenant` or `landlord` through `set_onboarding_role` only for eligible incomplete OAuth accounts. Never add client-side updates to `roles`, admin signup, or role promotion.
- Do not repurpose unrelated `role` fields (AI messages, conversation participants, notification payloads, team-member labels). Audit each occurrence in context.

## Implementation order

1. **Baseline and schema.** Capture current `pnpm --filter mobile exec tsc --noEmit --pretty false`, Jest, and lint results; note pre-existing failures. Query production for `users` columns/defaults, `set_onboarding_role`, profile INSERT/UPDATE grants, and RLS. Inspect `packages/supabase/src/types.ts` for stale `role`, suspension fields/relationships, and other generated schema drift. Confirm the CLI flags with `supabase gen types --help` or use the Supabase `generate_typescript_types` tool for the production project.
2. **Central profile contract.** Update `apps/mobile/service/auth/currentUserService.ts` (`UserProfile` Pick and `USER_PROFILE_FIELDS`) to select `roles`; this feeds `useCurrentUser` and `useProfile`. Keep React Query as the source of server profile data. Introduce a small typed role-membership/portal-selection helper if it prevents duplicating logic; do not mirror `roles` in Zustand or AsyncStorage. Store only the selected portal preference under a per-account key; clear its in-memory value and sensitive query data on sign-out/account switch, but retain the saved preference.
3. **Auth and entry routing.** Replace scalar-column reads in `apps/mobile/app/(auth)/sign-in.tsx`, `apps/mobile/hooks/auth/useGoogleAuth.ts`, and `apps/mobile/app/index.tsx`. Check selected membership before routing; reject/sign out of unsupported admin-only sessions. Update `apps/mobile/app/(tabs)/_layout.tsx` so a dual-role account is not forced into one tab group, while unauthorized groups remain inaccessible. Review incomplete-profile/onboarding redirects for role selection, error handling, and preference persistence.
4. **Signup and dependent screens.** Change the profile insert in `apps/mobile/app/(auth)/otp-verification.tsx` from scalar `role` to validated `roles: [selectedRole]`. Update `apps/mobile/hooks/preferences/useUserPreferences.ts`, tenant/landlord profile screens, `apps/mobile/app/(auth)/verify-account/success.tsx`, and any other consumers of `profile.role`. Where a UI needs a singular label, derive it from the active, authorized portal instead of treating membership as a scalar.
5. **Notifications.** Review `useNotificationTapHandler`, `useInAppNotificationBanner`, `NotificationList`, and `utils/notificationDeepLink.ts`. Deep links should use the resource's intended tenant/landlord route and the user's allowed memberships, not blindly assume one stored profile role; preserve cold-start and mark-read behavior.
6. **Regenerate shared types.** Generate `packages/supabase/src/types.ts` from production after the mobile code is prepared; review `Row`, `Insert`, `Update`, relationships, and RPC signatures. Remove temporary web casts used solely to work around the obsolete generated `users` type where possible. Address newly exposed type errors in both apps without weakening types or adding broad `any` casts. Do not add fictitious suspension fields to production or keep them in the generated types.
7. **Audit tests and remaining references.** Update mobile fixtures and mocks that return scalar `role` (notably `useCurrentUser.test.tsx`, verification tests, and characterization tests). Search mobile, web, and shared packages for database `users.role` selects/filters/inserts and `.role` references tied to the user profile; distinguish intentional UI/conversation roles. Update documentation only where a durable convention changes.

## Verification / acceptance criteria

- Typecheck **both** apps: `pnpm --filter mobile exec tsc --noEmit --pretty false` and `pnpm --filter web exec tsc --noEmit`; run `pnpm --filter web build` and both app lints, distinguishing existing lint failures from regressions.
- Run `pnpm --filter mobile exec jest --runInBand` (plus focused auth/notification tests). Cover tenant-only, landlord-only, dual-role selecting either portal, invalid/stale preference, admin-only denial, missing profile, OAuth incomplete/complete profiles, signup insert shape, tab guards, profile labels, and cold-start notification routing.
- On a connected mobile device/simulator using production-backed **non-destructive** test accounts, exercise password and Google sign-in, app restart, both authorized tab groups, profile and verification-success navigation, preferences, and notification taps. Avoid real signup or verification submission in production unless explicitly approved; use mocks or a local stack for write-path tests.
- Confirm production read-only queries return `roles` and the regenerated types match production. No mobile path queries/inserts the removed `users.role`; no admin bypass or client-side role write is introduced. Run `graphify update .` after implementation.

## Rollout note

The web migration in this workspace already uses production `roles` with temporary explicit web-side typing. Coordinate the shared type regeneration with mobile fixes in one change so neither platform is left uncompilable. Older plans/migrations may still describe scalar roles; they are historical, not schema authority.
