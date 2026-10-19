## Read Order

This is the primary entry point for AI coding agents.

Before making changes:

1. Read AGENTS.md.
2. If modifying UI, read DESIGN.md.
3. If modifying system behavior, read ARCHITECTURE.md.
4. Use Graphify to navigate the codebase.
5. Use design-tokens.json for machine-readable design values.

# AGENTS.md — APT (A Place to Thrive)

Operating manual for AI coding agents (OpenCode, Junie, Kiro, Claude Code, Codex CLI, and future agents). Durable engineering conventions only — not sprint status. For visual/design decisions, see DESIGN.md.

## Canonical Sources

Authority order — when sources conflict, the highest-ranked source wins.

| Domain | Source of truth | Fallback |
|---|---|---|
| Engineering | 1. AGENTS.md | 2. Source code · 3. Graphify |
| Design | 1. DESIGN.md | 2. design-tokens.json |
| Database | 1. Supabase schema | 2. Migrations |

- Engineering decisions belong in AGENTS.md; visual decisions belong in DESIGN.md.
- Never duplicate design documentation — cross-reference DESIGN.md instead.
- DESIGN.md is the single source of truth for UI (status markers: ✅ canonical · 🚧 transitional · ⚠ legacy).

## Project

Rental management platform for the Philippine market (CAMANAVA area focus), serving tenants and landlords across web and mobile.

## Stack & Monorepo Structure

- pnpm@10.34.5 monorepo (Node 22.17.0 — see `.nvmrc`), workspace roots: `apps/*`, `packages/*`
- Backend: Supabase (Postgres, Auth, Realtime, Storage)
- CI: one required `ci` job (`.github/workflows/ci.yml`) runs population-command tests, mobile lint + jest and web lint + typecheck + tests; no formatter config. `apps/mobile` has a Jest suite (`jest-expo` + `@testing-library/react-native` + `fast-check`, also covering `packages/passport` and `packages/utils`) via `pnpm --filter mobile test`; `apps/web` has `node:test` suites for pure helpers in `lib/*.test.mjs` via `pnpm --filter web test`

### `apps/web` — Next.js 16 (App Router)
- Styling: **Tailwind CSS v4** + PostCSS (`@tailwindcss/postcss`)
- UI: **HeroUI v3** (`@heroui/react`) **and** shadcn/ui (`components/ui/`)
- HeroUI-first (web): use HeroUI interactive components by default — Button, Input/InputGroup, Select, Checkbox/CheckboxGroup (with the compound `Content`/`Control`/`Indicator` parts), Switch, Modal, Tooltip. Reuse APT's HeroUI-based wrappers before building new controls: `app/components/settings/SettingsSelect`, `ToggleSwitch`, `SettingsRow`; `app/components/preferences/BudgetRangeField`, `PreferenceOptionCard`. Tailwind covers layout/spacing/responsive; tokens, typography, radius, and primary `#376BF5` come from DESIGN.md. Never fight HeroUI's unlayered default CSS with Tailwind utilities (unlayered rules win) — scope variable/property overrides in `app/globals.css` (see the `.rental-prefs-checks` pattern). Don't rebuild HeroUI primitives in native HTML without justification; plain layout elements and route-scoped presentational helpers are fine. Verify APIs against the installed v3 in `node_modules/@heroui/react/dist` — never assume another version's API.
- Session profile (`hooks/use-user.ts`) is shared, not fetched per consumer: one keyed request cache (`lib/profile-request-cache.ts`) gives a single in-flight `getUser()` + profile `SELECT` across all hook instances, with resolved reuse inside a 30s TTL (mobile `staleTime` precedent). Invalidated on sign-out, account switch, `USER_UPDATED`, and avatar updates. Don't add parallel profile fetches — reuse `useUser()` or the cache. Portal layouts pass their server-known roles as `SettingsModal initialRoles` so tenant tabs render on first paint; the client profile wins once settled.
- Supabase: use `@supabase/ssr` (`createBrowserClient` / `createServerClient`) directly — NOT the shared `@repo/supabase` client (mobile-oriented). Server client imported from `@repo/supabase/server`, middleware from `@repo/supabase/middleware`.
- Icons: `@tabler/icons-react` exclusively
- Password recovery (`app/(auth)/forgot-password`) mirrors mobile with server actions in `app/(auth)/actions/password-recovery.ts` (`@repo/supabase/server`): request/resend → verify (`"ready" | "google_only"`) → update → `signOut({ scope: "global" })` → `/forgot-password/updated`. The email and code steps share one page and the email stays in component state, never the URL. Before verifying, the action sets the HTTP-only `apt-password-recovery` marker cookie (start time inside, 400-day lifetime like the Auth cookies; a recovery older than 30 minutes is abandoned). `recoveryRouteDecision` in `@repo/supabase/password-recovery` (pure, tested in `lib/password-recovery.test.mjs`) lets a marked session use only `/forgot-password/reset-password`; the middleware signs it out anywhere else. Background requests (`Sec-Fetch-Dest` not `document`; Next.js strips its own router headers before the middleware) get a 204 instead of a sign-out, so prefetches never end a reset. Server actions skip the middleware, so `updateRecoveredPassword` re-checks the marker itself. Actions that end in `redirect()` reject the client's promise with Next's redirect signal: call them inside a transition and `unstable_rethrow` in the `catch`. A server action that sets cookies re-renders the current page, so the reset page renders a "session ended" view rather than redirecting. Middleware redirects that sign out must copy `supabaseResponse` cookies onto the redirect. The marker is a journey guard, not a security boundary. See ARCHITECTURE.md §4.3.
- Password change (Settings → Security; tenants and landlords only, the admin tab is unchanged): the Change Password row closes the Settings modal and opens its own `app/components/settings/ChangePasswordModal.tsx` (state in `SettingsOverlay`, never a route or query param), so passwords never reach a URL and are cleared whenever the modal closes. The row is enabled only for accounts with an `email` identity (`usePasswordSignInStatus`); Google-only accounts see it disabled with a "Signed in with Google" `StatusChip`. The server action `app/(auth)/actions/change-password.ts` refuses while the recovery marker is present (server actions skip the middleware), then runs `changePasswordWith(supabase.auth, …)` from `@repo/utils`. It returns only a `PasswordErrorReason`, and the form places it with `getPasswordChangeErrorField`. Password inputs and the error banner are shared in `app/components/inputs/` (`PasswordField`, `NewPasswordFields`, `PasswordRequirementList`) and `app/components/display/ErrorBanner.tsx`. See ARCHITECTURE.md §4.3.
- Change email (Settings → Security; tenants and landlords only, the admin tab is unchanged): the Change Email row closes the Settings modal and opens its own `app/components/settings/ChangeEmailModal.tsx` (state in `SettingsOverlay`, never a route or query param), so emails, passwords and codes never reach a URL and are cleared whenever the modal closes. The row is enabled only for email/password accounts without Google (`useEmailChangeEligibility`, `isEligibleForEmailChange`); Google and Google-linked accounts see it disabled with a "Signed in with Google" `StatusChip`. The actions in `app/(auth)/actions/change-email.ts` refuse while the recovery marker is present and for suspended accounts, then run the shared `requestEmailChangeWith` / `verifyEmailChangeCodeWith` / `resendEmailChangeCodesWith` steps from `@repo/utils` (`emailChange.ts`): current-password check with `signInWithPassword`, `updateUser({ email })`, dual-inbox `verifyOtp({ type: "email_change" })` with completion confirmed by re-reading Auth, profile sync via the caller-bound `sync_my_profile_email()` RPC, then `signOut({ scope: "others" })`. They return only an `EmailChangeErrorReason`, placed with `getEmailChangeErrorField`. See ARCHITECTURE.md §4.3.
- Notifications (web) are mounted in every portal layout (admin included): one HeroUI drawer opened by the shared `?notifications=open` query, plus a draggable desktop bell (`app/components/notifications/`). The bell's saved placement (`apt-notifications-fab:v1`) records user intent only — the resting slot is re-resolved from live DOM geometry by the pure resolver in `lib/notification-fab-safe-area.ts`, so it never settles over a control marked `data-fab-clearance` (messages composer/header/contact list, browse filter rail, payment footer) and the automatic nudge never overwrites the saved placement. A route that hands over a dedicated parking spot marks it `data-fab-dock` (the messages conversation header): the bell parks inside that surface — right-aligned, vertically centred, not draggable — instead of floating free, so it can never cover the message thread. Mark any new persistent control that must stay clickable with `data-fab-clearance`; the mobile sidebar entry stays the only trigger below `md`.
- `pnpm-workspace.yaml` `overrides` carry security patches only (`@babel/core`, `@hono/node-server`, `@isaacs/brace-expansion`, `@xmldom/xmldom`) — no version pins for app deps

### `apps/mobile` — React Native (Expo 57), Expo Router
- Styling: **Uniwind** utility classes — NOT NativeWind (migrated away; don't reintroduce)
- UI: **HeroUI Native v3** (`heroui-native`). Its `Input` styles (shared by `TextArea`, `SearchField`, `InputGroup`) are patched in `patches/heroui-native@1.0.8.patch` so every field has the same border on iOS and Android (DESIGN.md §10); re-check the patch when upgrading `heroui-native`.
- Bottom sheets (`heroui-native` `BottomSheet`): the sheet only snaps open on a closed → open transition (`BottomSheetContentContainer` in the installed package records `isOpen` on mount and snaps on change). Keep every sheet mounted and drive it with an `isOpen` boolean — never conditionally mount one already open, and never key-remount one into the open state (both render it off-screen). Because sheets stay mounted, an open-once draft has to be reseeded from its request on each open and its form state must never outlive the open (see `components/finance/` entry sheets). A sheet that hosts a control opening a React Native `Modal` (e.g. `DateField`'s iOS picker) must pass `disableFullWindowOverlay` to `BottomSheet.Portal`: on iOS the default full-window overlay draws above native modals, so the picker would open invisibly behind the sheet. Every sheet opens at an explicit snap point (`snapPoints`, never content-measured `enableDynamicSizing`): gorhom only builds the content-sized detent after layout is measured, so a sheet that opens before that detent exists settles short and clips its last row — picker sheets pass a height for short lists and otherwise fall back to a tall default (`FinanceSelect`).
- Icons: `@tabler/icons-react-native` — NOT `lucide-react-native` (migrated away 2026-08-29; dependency removed from `apps/mobile/package.json`)
- State: server state via **React Query** (`@tanstack/react-query`) — single `QueryProvider` at the root layout, shared client in `utils/queryClient.ts`; Zustand for client state only (`stores/`)
- Auth: PKCE flow with `@react-native-async-storage/async-storage`; the platform-aware Supabase client lives in `@repo/supabase` (`packages/supabase/src/client.ts` handles RN/SSR branching)
- Babel: `react-native-reanimated/plugin` in `babel.config.js`
- Keyboard: `react-native-keyboard-controller` (Expo-pinned; native, so adding or upgrading it needs a dev-client rebuild). `KeyboardProvider` wraps the root layout; `ScreenWrapper scrollable` uses its `KeyboardAwareScrollView`. Screens that scroll programmatically take a `ScreenWrapperScrollRef` (standard ScrollView API, e.g. `scrollTo`) and never import the keyboard library. `react-native-keyboard-aware-scroll-view` was removed 2026-10-13 (it logged `viewIsDescendantOf() noop` errors under the New Architecture).
- Services: `service/` mirrors the `hooks/` domain folder layout (e.g. `service/chat/chatService.ts`, `service/media/privateMediaResolver.ts`); tests co-locate in their domain folder, imported via direct file paths (no barrels)
- Profile editing is shared by both portals at `/edit-profile`: keep the draft local and initialize it once per auth account, never on background refetch. `useEditProfile` owns validation and the save mutation; `service/auth/profileService.ts` picks photos locally, uploads compressed binary photos to new account-folder paths on Save, then updates the editable fields and photo references in one caller-owned row write. Never overwrite the current photo before the row write; never delete uploads after a write with an uncertain outcome. Locked identity/email fields, roles and account status never enter the update. See ARCHITECTURE.md §4.4 and DESIGN.md §16.
- Rental application (`app/apartment/[apartmentId]/apply`): no document-upload step — APT Passport documents are attached automatically by reference (`selectPassportDocsForApplication`; expired/rejected docs never attach). Readiness (verified account, not own listing, no pending application, complete passport) is `evaluateApplicationReadiness` in `@repo/passport` and gates both the summary screen and submit. The web has a Passport wallet in both portals (`/tenant/passport`, `/landlord/passport`; verified accounts only, guarded server-side by `requirePassportViewer(portal)`, and the portal layouts hide the nav link unless `canViewPassport(account_status)`; shared components in `app/components/passport/` take a `basePath`, and the application checklist is tenant-only), and the web apply flow (`/browse/[apartmentId]/apply` and `/tenant/browse/[apartmentId]/apply`, one shared `loadApplyPage` loader + `ApplyClient`) mirrors mobile, except that the summary step is the apartment page's Apply Now modal (`ApplyStartModal`) and the route opens at tenant info: no upload step, documents attached by reference, readiness re-read at submit (`use-submit-application`). Web apply never uploads files.
- Applications are validated in the database (`guard_rental_application_insert` / `_update`), not just the client: verified account, proof of income unless Student/Unemployed, and every document path must be the applicant's own (folder, existing file, non-rejected/non-expired Passport row; ID captures only for the ID slot; ID back paired with the ID). Document columns, `tenant_id` and `apartment_id` are immutable after insert. Every session-bound insert gets these checks, admin+tenant applicants included — the guards must not exempt admins. Client checks are for feedback only; DB messages are user-facing, so surface them as-is.
- Notification payloads route through `buildNotificationDeepLink`; actions that only exist on the web (admin passport review, screen `passportReview`) return null there and callers show `getWebOnlyNotificationNotice` as a toast instead. Never reuse a tenant-facing screen key for an admin-facing notification.
- Application document URLs resolve via `resolveApplicationDocumentUrls` (mobile resolver / web `applicationDocumentsService`): a verified ID front/back (`{users.id}/{verification id}/id-front|id-back.*`) signs from `user-verification` with a 15-minute URL; everything else from `application-documents`. Route by path shape — never probe/fall back across buckets. Applications store the front in `gov_id_url` and the back in `gov_id_back_url`; landlords read exactly those two files (never the selfie) through `private.landlord_can_read_applicant_id()`.
- Password recovery (`app/(auth)/forgot-password`): 6-digit email code through `service/auth/passwordRecoveryService.ts` only — `resetPasswordForEmail` (also the resend path; `auth.resend()` doesn't support recovery) → `verifyOtp({ type: "recovery" })` → `updateUser({ password })`. A verified code is a full persisted session: never leave one behind (leaving the reset screen signs out, success signs out `global`, and the AsyncStorage in-progress marker set before verification makes `app/index.tsx` sign out an abandoned reset). Google-only accounts are an app-flow rule checked only after verification — never look up an email's account type first (account enumeration). Keep the email in `usePasswordRecoveryStore`, never in route params. Code length, resend cooldown and email/code validation are shared with web in `@repo/utils` (`passwordRecovery.ts`). See ARCHITECTURE.md §4.4.
- Password change (`app/settings/change-password`, Settings → Change Password): only for accounts with an `email` identity (`usePasswordSignInStatus`; Google-only rows stay disabled). `service/auth/passwordChangeService.ts` runs the steps shared with web, `changePasswordWith` (`@repo/utils` `passwordChange.ts`): it verifies the current password with `signInWithPassword` before `updateUser`, then `signOut({ scope: "others" })`. Place errors with `getPasswordChangeErrorField`. The current-password check is app-flow only: never turn on Supabase's project-wide "require current password" setting, because it would also block the forgot-password recovery session. Both password flows (and web recovery) share `PasswordError` (user-facing messages, safe logging via `describeAuthError`, never the message) and `hasEmailPasswordIdentity` from `@repo/utils` (`passwordErrors.ts`, `authIdentity.ts`), plus `components/inputs/PasswordField` / `NewPasswordFields`; close the keyboard on submit before navigating away. See ARCHITECTURE.md §4.4.
- Change email (`app/settings/change-email`, Settings → Change Email): only for email/password accounts without Google (`useEmailChangeEligibility`, `isEligibleForEmailChange`; Google and linked rows stay disabled with "Signed in with Google"). `service/auth/emailChangeService.ts` runs the steps shared with web, `requestEmailChangeWith` / `verifyEmailChangeCodeWith` (`@repo/utils` `emailChange.ts`): it verifies the current password with `signInWithPassword` before `updateUser({ email })`, confirms both inboxes with `verifyOtp({ type: "email_change" })` and re-reads Auth before reporting completion, syncs the profile via the caller-bound `sync_my_profile_email()` RPC, then `signOut({ scope: "others" })`. Refuses during password recovery and for suspended accounts. Secrets stay in screen state (cleared on unmount), never in route params. See ARCHITECTURE.md §4.4.
- Apartment sharing (`service/apartments/apartmentShare.ts`): the share message includes a public link only when `EXPO_PUBLIC_WEB_URL` (the web app's origin, linking to `/browse/<apartmentId>`) is set; the app's own `mobile://` scheme is never shared. Apply gating on the apartment page (`applyEligibility.ts`) is feedback only; the database guards decide.
- Listing create/edit (web `landlord/properties/create` + `EditPropertyModal`, mobile `add-apartment/*` + `description/edit-main`): pricing uses the shared month options from `@repo/utils` (`apartmentPricing.ts`: rent ≥ `MIN_MONTHLY_RENT`, deposit none/1/2 months, advance none/1 month, `validateApartmentPricing`, `pricingMonthsFromAmount`), stored as peso amounts. Edits keep a listing's older off-rule amounts until its pricing changes. Amenity pickers use `toggleAmenitySelection` from `@repo/constants` (`amenity-rules.ts`: picking one side of an `AMENITY_CONFLICTS` pair, e.g. No Cooking vs Kitchen, turns the other off) and hide `RETIRED_AMENITIES` (e.g. `furniture`, covered by Furnished Type) unless already picked; existing listings are not rewritten. Descriptions are capped at `MAX_DESCRIPTION_LENGTH` (2,000; `getDescriptionError` in `@repo/constants`, DB check `apartments_description_length`) with a live counter on every editor. Addresses are CAMANAVA only: city from `CAMANAVA_CITIES`, province `Metro Manila`, barangay picked from `getBarangaysByCity` (map-search names mapped with `matchBarangay`), ZIP checked with `isCamanavaZipForCity`, geocoder names mapped with `toCamanavaCity`, and the pin checked with the `validate_camanava_location` RPC before moving on. The listing row is inserted before any upload; listing photos go to `{apartmentId}/` as two compressed tiers on both platforms (web `lib/apartment-image-upload.ts`), and failures roll back the row and uploaded files. The database (`guard_apartment_pricing`, `guard_camanava_apartment_location`, `guard_new_apartment_listing`) is the final authority; surface its messages as-is.
- Payment receipt: GCash-style receipt in `apps/mobile/app/tenant/payment/success.tsx` via `components/ReceiptCard.tsx` (same folder)
- Landlord finance (`landlord/analytics`): use the finance hooks/services and `@repo/utils` finance rules; never relabel collected revenue as profit. Operating income requires an explicit per-property/month expense review; expense changes invalidate that review. Capital improvements, reserve plans and rental-period balances stay separate from operating costs and cash-month receipts. Finance tables are private to their active landlord owner, including mixed admin/landlord profiles; admin membership alone grants no access. Mobile finance requests and mutations require the same account's active landlord portal. Client writes are column-scoped. The plan tab groups budgets by category and drills into the properties holding each plan, with spending limits and reserve plans kept as separate kinds. See ARCHITECTURE.md §12.1 and DESIGN.md §11.

### Shared packages (`packages/`)
| Package | Exports | Notes |
|---|---|---|
| `@repo/supabase` | `.`, `./browser`, `./server`, `./middleware`, `./password-recovery` | `client.ts` handles RN/SSR branching; peer deps for `next`, `react-native`, `async-storage` are optional |
| `@repo/constants` | `.` | Colors, apartment/user constants, PH address data |
| `@repo/utils` | `.` | Shared utilities, including the password-flow logic used by web and mobile: `PasswordError` / `toPasswordError` / `describeAuthError`, `hasEmailPasswordIdentity`, recovery constants and `normalizeRecoveryEmail`, the change-password steps `changePasswordWith(auth, …)` (structural `PasswordChangeAuth`, no Supabase dependency) with `getPasswordChangeErrorField`, and the change-email steps `requestEmailChangeWith` / `verifyEmailChangeCodeWith` / `resendEmailChangeCodesWith` (`emailChange.ts`, structural `EmailChangeAuth`) with `EmailChangeError` / `isEligibleForEmailChange` / `getEmailChangeErrorField`; listing pricing rules (`apartmentPricing.ts`, mirrored by the DB `guard_apartment_pricing()`); and rent billing periods (`rentPeriod.ts`: `getCurrentRentStatus`, `resolvePaymentPeriod`, `nextPaymentPeriod`, `paidAmountForPeriod`, structural `RentStatusTenancy`), which follow the server's `notify_rent_due_status()` rule (calendar month due on `tenancies.rent_due_day` clamped to month end, never before the lease, a month due before move-in is skipped). Tests run in the mobile Jest suite via `roots` |
| `@repo/hooks` | `.` | `usePasswordValidation`, `usePHMobileValidation`, `usePHPostalCode` |
| `@repo/passport` | `.` | Pure APT Passport logic shared by web and mobile: slot selection (`selectPassportDocsForApplication`), `evaluateApplicationReadiness`, expiry helpers, `isVerifiedIdPath`, `verifiedPassportPaths` (landlord Verified badges; expired documents never count), document statuses and slot states, document-type descriptions. Structural row type (`PassportSlotDocument`), no Supabase client; tests run in the mobile Jest suite via `roots` in `apps/mobile/jest.config.js` |

## Commands (root `package.json`)

```bash
pnpm web          # pnpm --filter web dev
pnpm mobile       # pnpm --filter mobile start
pnpm db:populate --help  # operator-only demo activity: preview/apply/reset/cleanup
pnpm db:populate:test   # generator/CLI tests; PostgreSQL contract suite is opt-in
```

Individual app scripts:
- `pnpm --filter web dev` / `pnpm --filter web build` / `pnpm --filter web lint` / `pnpm --filter web typecheck` / `pnpm --filter web test`
- `pnpm --filter mobile start` / `pnpm --filter mobile ios` / `pnpm --filter mobile android` / `pnpm --filter mobile lint` (expo lint)
- `pnpm --filter mobile test` (jest) / `pnpm --filter mobile exec jest --runInBand` (CI-style run)

No root-level `dev`, `lint`, `typecheck`, or `build` scripts exist.

## Git & CI Workflow

- `main` is protected by the `main-protection` ruleset: PR required, `ci` check (mobile lint + jest, web lint + typecheck + tests) must pass, direct pushes to `main` are rejected by design. Always work on a feature branch and open a PR.
- Sync with `main` before opening/merging a PR: `git merge main` on your branch (the `ci` check runs against the PR's merge commit).
- If CI fails with `ERR_PNPM_OUTDATED_LOCKFILE`, run `pnpm install` locally and commit the updated `pnpm-lock.yaml` (CI installs with `--frozen-lockfile`).
- Stale branches (long-diverged from `main`) commonly fail CI on lockfile drift or moved tests — merge `main` first, then re-run.

## Config & Hoisting

- `.npmrc` hoists `@heroui/*` and `@types/*` to root `node_modules`
- Mobile `@source` directives in `global.css` reference sibling packages (`../../../packages/`) — when adding monorepo package deps to Tailwind content, check there too

## Supabase Conventions

- `public.users` has both `user_id` (→ `auth.uid()`) and internal `id` UUID PK. **All RLS policies and FK relationships use the internal `id`**, resolved via:
  ```sql
  (SELECT id FROM public.users WHERE user_id = auth.uid())
  ```
- Dual-role profiles may act in either portal, but a tenant must not transact with an apartment owned by the same internal `users.id`. Database triggers enforce this for applications, visits, favorites, reviews, tenancies, and payments; apartment chat participants cannot be the same user. Client guards only improve feedback and must not replace these checks.
- New tenant-side records and changes to their tenant/apartment/landlord relationship require a current tenant membership (`tenant` in `users.roles`), enforced by the `require_tenant_membership_for_new_transaction()` triggers. Admin membership grants nothing and never adds consumer access, but it no longer cancels a held tenant role: mixed admin/tenant profiles transact like any tenant (parity with mixed landlord finances), while admin-only profiles have zero consumer access. Historical rows remain readable and can be cancelled/rejected without granting a new role; approval that creates a new tenancy still requires tenant membership. Do not infer a new role from historical activity, and never exempt admins in new tenant-side guards.
- `public.users.roles` (`text[]`) and `account_status` are server-managed. Client profile UPDATE grants cover only editable fields; registration INSERT is restricted to tenant/landlord with `unverified` status. Google OAuth users may choose tenant/landlord while incomplete through `set_onboarding_role()` only; completed non-admin profiles may add a normal role through `grant_user_role()`. Admin promotion uses a trusted database-operator connection (see `docs/admin-provisioning.md`); never add a direct client-side role update or admin registration option.
- Account suspension is **app-level**: `public.users.is_suspended` (+ `suspension_reason`) is the source of truth, enforced by the restrictive `Active accounts only` RLS policies and the `admin_set_user_access()` RPC (admin-only, audited, deletes sessions). Never use Supabase Auth's `ban_duration`; suspended users authenticate normally, and clients read their own state via `get_my_suspension_status()` to show the notice (mobile `suspensionService`/`useSuspensionGuard`, web `/suspended`). Service-role code paths (edge functions, notification push) must check `is_suspended` themselves.
- When a table has multiple FKs to `public.users` (e.g. `reviews`, `chat`), disambiguate joins explicitly: `users!reviews_tenant_id_fkey`.
- Use DB migrations for schema changes; direct SQL only for read-only queries or one-off DML.
- Demo activity is managed only by `pnpm db:populate` (`scripts/db-populate/`, private `demo_population` schema), never client-facing RPCs or blanket resets. It reuses existing users/listings, freezes one deterministic rental dataset plus a separately tracked finance component, tracks inserted rows and allowed apartment patches, and refuses reset/cleanup after edits or new dependencies. `--finance --run <id>` can add expenses/budgets to an applied rental run without rebuilding/rebaselining its plan or relaxing its drift checks; existing reviewed/manual finance months are preserved, and new review confirmations block finance cleanup. Fresh populations include both components atomically. Hosted writes require a reviewed preview token and explicit project confirmation; do not run them as part of implementing the tool. Keep integrity triggers enabled and review the importer audit hashes when trigger bodies change. See `docs/demo-population.md` for setup, limits and tests.
- Before remote backend operations, confirm the target against the active app's public Supabase URL; the CLI link can point to a different project. Profile UPDATE must stay column-scoped: after removing a broad table grant, explicitly retain the intended profile/onboarding columns and `updated_at`, never `email` or server-managed identity/access fields. Owner-only and active-account RLS still apply.
- `apartments` INSERT is column-scoped like UPDATE: clients never set `is_verified`, moderation (`is_hidden_by_admin`, `hidden_*`), ratings/counters or timestamps. New client listings are forced to `status = 'available'`, `is_verified = false` (verification is `is_verified` + `apartment_verifications`; `status` is occupancy only, and clients may not set `unverified`). `apartment-images` uploads are landlord-only and deletes owner-only.
- Storage buckets are private by default; store **storage paths** (not public URLs) in DB columns, generate signed URLs on read. **Exception:** `apartment-images` is **public** (`public=true`, 10 MB limit) — `apartment_images.url` / `url_thumb` store permanent CDN public URLs (`getPublicUrl`) and render via `expo-image cachePolicy="disk"` with no signing (verified `storage.buckets.public=true` on `apartment-images`).
- Messages list state is server-side and per user: `conversation_preferences` (pin, archive, mute, marked unread) is written only through `set_conversation_preference` / `mark_conversation_read`; blocks (`user_blocks`, messaging only) through `block_user` / `unblock_user` and enforced by the `guard_chat_blocks` trigger in both directions — `block_user` refuses while the two share an active tenancy (mute/report instead; unblocking is always allowed); reports (`user_reports`) through `report_user`, reviewed by admins via `admin_resolve_user_report`. Clients never write these tables directly, and block/report DB messages are user-facing.
- Signed lease is one executed contract per tenancy, private to its landlord and tenant (never admins): the file lives in the `signed-leases` bucket at `{tenancyId}/{ts}.{ext}` and the row fields (`tenancies.signed_lease_path`, `signed_lease_uploaded_at`, `signed_lease_uploaded_by`, `tenant_acknowledged_at`) are written only through the caller-bound `set_tenancy_signed_lease` / `acknowledge_signed_lease` RPCs — `guard_tenancy_signed_lease_fields` rejects direct client writes to those four columns, because `authenticated` holds table-level UPDATE on `tenancies`. Storage policies scope that folder to the tenancy's landlord (upload/delete, active tenancy only) and to its landlord or tenant (read); replacing the file deletes the replaced object and resets the acknowledgement, so it always refers to the current document. Web only: landlord uploads from My Properties → Tenant Information, tenant reviews and confirms in My Rental → Signed lease (toast nudge; no notification trigger).
- Notifications are generated **server-side only**: DB triggers insert into `notifications` via `create_notification()` (which also fires the `push-notify` edge function through pg_net). Clients only SELECT their own rows and UPDATE `is_read` — never INSERT. Expo push tokens live in `push_tokens`: register through the caller-bound `register_push_token()` RPC so a token can move between accounts on one device without loosening owner-only table RLS; delete on sign-out.
- Auth email templates live in `supabase/templates/` (mirrored in `config.toml`) and reach the hosted project only via `supabase/templates/build-payload.py` + Management API `PATCH .../config/auth` — never `supabase config push` (it would push local-only auth settings) and never print the full response (it contains SMTP credentials). Never embed fonts in templates: emails over ~102 KB are clipped by Gmail and hide the code. See ARCHITECTURE.md §4.5.
- `create_notification()` EXECUTE is revoked from `authenticated` — only SECURITY DEFINER triggers (and service_role) call it. Trigger functions identify the acting user via `auth.uid()` (PostgREST JWT GUC), e.g. to skip self-notifications (tenant self-cancel of a visit request).
- Message reactions notify the reacted-to message author through the same path: `notify_chat_reaction()` (`after insert on public.chat_reactions`, SECURITY DEFINER, migration `20261017090635`). It reuses `type = 'message'` so the per-type preference, the message icon/colour, the `screen: 'chat'` portal audience and the in-conversation toast suppression all apply unchanged. Only the message author is notified (never a self-reaction, never a non-participant), muted conversations and either-direction `user_blocks` are skipped, and it is INSERT-only with a 15-minute per `(recipient, message, reacting user)` cooldown — so replacing an emoji or remove/re-add toggling cannot spam. The OS push body is the reaction sentence only; the short message preview rides `data.messagePreview` (server-truncated, one line) and is rendered in-app by `getNotificationPreview` (`@repo/utils`) as a quoted line in the web drawer row and the mobile `NotificationCard`.
- `push-notify` includes `notificationId` in the push payload `data`; clients mark the feed row read on tap or banner action (fire-and-forget) so the in-app unread count stays accurate.
- Trigger payloads include the `apartmentId` needed to resolve deep links (payment, maintenance); never rely on payloads without it.

## PayMongo Test-Mode Hybrid (No Disbursement)

- **Hosted checkout in Test Mode** (`sk_test_...`): tenant selects GCash/Maya/QRPh/Card → `paymongo` edge function `POST /v2/checkout_sessions` (inserts `payment` `pending` + `paymongo_session_id`) → returns `checkout_url` → `e-wallet-redirect` opens PayMongo page via `Linking.openURL` → Pay button → deep link `?sessionId=cs_...` → `getCheckoutSessionStatus` + `paymongo-webhook` (`checkout_session.payment.paid` / `payment.paid` HMAC-verified) flips `pending` → `paid`. No real money — test funds only. When `PAYMONGO_SECRET_KEY` is unset, the edge function returns mock `simulation://` responses (reference `-fail`/`-expired`, card `0002` etc) so local dev still works.
- **Cash** stays `pending` awaiting landlord `landlord_update_payment_status`; e-wallet/card are webhook-owned. No payout disbursement — landlord profit is `payment` aggregates + Realtime `tenancy-live`.
- MCP: `.opencode/opencode.json:19-25` `paymongo` via `npx -y @theyahia/paymongo-mcp` with `PAYMONGO_SECRET_KEY` (`sk_test_...`). Validate with `python3 -m json.tool .opencode/opencode.json`.

## Engineering Philosophy

- Prefer reuse over duplication.
- Extend existing components before creating new ones.
- Minimize custom implementations — let HeroUI / shadcn / platform primitives do the work.
- Keep Web and Mobile behavior aligned (mobile-first; web mirrors its semantics).
- Prioritize readability over cleverness.
- Type safety over convenience.
- Keep business logic separate from UI.
- Prefer composition over inheritance.
- Optimize for maintainability.

## Architecture Principles

- Shared logic belongs in `packages/`; platform-specific code stays inside `apps/`.
- UI components remain presentation-focused.
- Business logic belongs in hooks/services, not components.
- Database logic belongs in Supabase (RLS, policies, migrations) — not in client code.
- Never duplicate validation logic — use `@repo/hooks` / `@repo/utils` / `@repo/constants`.
- Keep state as local as possible (see State Management Rules).

## Decision Hierarchy

When multiple solutions are possible, follow this order:

1. Reuse existing code.
2. Extend an existing implementation.
3. Share code between platforms.
4. Create a new abstraction.
5. Create a new component.

Always prefer the smallest change that satisfies the requirement. For UI-component decisions, follow DESIGN.md §21 (AI Decision Hierarchy).

## Repository Conventions

### Web (`apps/web`)
- Route folders kebab-case (`browse`, `forowners`); route groups in parens (`(auth)`, `(main)`); dynamic segments camelCase (`[apartmentId]`).
- App components PascalCase with `export default function`; shadcn primitives kebab-case in `components/ui/`.
- Hooks: kebab-case files (`use-favorites.ts`) exporting camelCase (`useFavorites`); `"use client"`.
- No barrel exports — components imported directly by path.
- Alias `@/*` (tsconfig); monorepo packages via `@repo/*`.
- Server actions in `app/(auth)/actions/*.ts` with `"use server"`.
- Server pages fetch and pass props to `"use client"` children; wrapper components get a `Client` suffix (`MessageClient`, `FavoritesClient`).

### Mobile (`apps/mobile`)
- Feature folders lowercase (`apartment/`, `chat/`) or kebab-case (`document-id/`); route files kebab-case (`sign-in.tsx`); dynamic routes in brackets (`[apartmentId]`).
- `components/` subfolders plural lowercase (`buttons/`, `cards/`, `display/`, `inputs/`, `layout/`); component files PascalCase.
- Hooks: `hooks/<domain>/useX.ts` camelCase files; each domain folder has a barrel `index.ts` with named re-exports.
- Stores: `stores/useXStore.ts` — `create<State & Actions>((set) => …)` with exported `interface`, `initialState`, and `reset()`.
- Import aliases mixed (`@/*` and bare `components/*`, `hooks/*`, `constants/*`, `assets/*`) — match the surrounding file.
- Components never import the Supabase client directly — hooks/services do.

### Packages (`packages/`)
- Layout: `src/` + `package.json` + `tsconfig.json`; single entry `exports` → `./src/index.ts`.
- Named exports only; barrel `index.ts` at package root (and per-subfolder where applicable).
- Cross-platform, dependency-light; platform-specific peer deps are optional.

### TypeScript
- `strict: true`. Avoid `any` — explicit typing preferred.
- `interface XxxProps` for component props; `type` for unions/statuses.
- Route-scoped shared types in `types.ts` files.
- Type-only imports: `import type { … }` or inline `type` in destructuring.
- Semicolons in app code (shadcn `components/ui/*` files omit them — don't reformat).

## Code Quality Rules

- Avoid duplicated code — extract to shared packages or reuse.
- Avoid magic numbers — name them or use `@repo/constants`.
- Prefer semantic naming over abbreviations.
- Keep functions focused on one responsibility.
- Prefer early returns.
- Avoid deeply nested logic.
- Keep components small.
- Avoid unnecessary abstractions.
- Prefer explicit typing over inference shortcuts.
- Remove dead code.

## Performance Guidelines

- Avoid unnecessary re-renders.
- Memoize only when beneficial (e.g. `React.memo` on heavy stable components — used sparingly today).
- Virtualize long lists (`FlatList`/`FlashList`); adopt as list screens grow.
- Lazy load heavy screens where the framework supports it.
- Cache signed URLs on read (see Supabase Conventions).
- Keep bundle size reasonable — mind the icon library mix and heavy deps.
- Avoid unnecessary network requests (reuse fetches, avoid refetch loops).
- Prefer optimistic updates where appropriate.
- Media uploads are **binary with client-side compression** (`compressImage.ts`) — never base64; apartment images are stored two-tier (thumb + full), thumbs render from the thumb column.
- Lists fetch **bounded pages** with keyset cursors — never unbounded selects (chat history: 30-message pages, descending `created_at, id`, ID-deduplicating merge).
- External media (GIFs) are referenced by `externalUrl` on the row — no download-then-re-upload round trips.

## State Management Rules

- **Local state** (`useState` + custom hooks) is the default — use nothing else unless needed.
- **React Query** (mobile only): the standard layer for server data. Reads via `useQuery` on stable query keys; mutations via optimistic updates + exact-key `invalidateQueries`. Default `staleTime` 30s; `clearQueryClient()` on sign-in/sign-out (sensitive in-memory state — e.g. signed URLs — clears with it). Never put tokens or signed URLs in query keys; never mirror server data in Zustand.
- Read-settling mutations (mark-read, status changes) settle with exact-key `invalidateQueries({ refetchType: "none" })` — mark-stale only; the mutation's own realtime event is the single refetch trigger. UI counters (e.g. unread) update optimistically with rollback, never via extra refetches.
- **Realtime (mobile)** — one channel per user/resource identity via refcounted registries (`useNotificationRealtime`, chat channels); never one channel per consumer. Channel identity is keyed by data identity (user/peer/apartment), never by render callbacks; event callbacks flow through refs.
- **Zustand** (mobile only): client state shared across screens — form flows, theme, personalization. Lives in `stores/`; includes `reset()`.
- **Theme** (mobile): `useThemeStore` holds only the saved `system | light | dark` preference; `useThemeSync()` at the root is the single place that applies it via `Uniwind.setTheme(mode)` (`system` clears the override and follows the device) and keeps the splash up until the saved choice has loaded. Read the resolved palette with `useColors()` (Uniwind's active theme); read/set the preference with `useThemePreference()` only where needed. Mobile neutral roles live in `constants/theme.ts`, mapped in `app/global.css` and checked by parity/contrast tests; shared brand/status colors remain in `@repo/constants`. See DESIGN.md §3 for values. Never call `Appearance.setColorScheme()` from components or hooks.
- **Portal preference** (mobile): `users.roles` is server-authoritative; `usePortalStore` holds only the active tenant/landlord navigation choice in memory. Persist that choice per auth user in AsyncStorage across sign-out, but clear in-memory state and React Query on sign-out/account change. Always validate the saved choice against the latest roles before routing; never persist roles or treat a preference as authorization.
- **Boot prefetch** (mobile): `app/index.tsx` loads the profile into `CURRENT_USER_QUERY_KEY` (the tabs layout reuses it) and, for the tenant portal, `prepareTenantHome` starts the Rentals queries under their hooks' own keys. A failed prefetch is reset, not left as an error. The Rentals skeleton shape comes from a per-account AsyncStorage layout hint (`service/tenancy/rentalsLayoutHint.ts`): a UI hint only, never shown as data or used for access.
- **Supabase** is the source of truth for all server data; fetch in hooks/services behind React Query — never mirror it in stores.
- **Server data (web)**: data hooks load through `hooks/use-async-resource.ts` (memoized loader → `{ data, loading, error, refresh, setData }`); effects never set state synchronously (`react-hooks/set-state-in-effect` is enforced in CI). Browser-only values use `useSyncExternalStore` (`use-hydrated`, `use-mobile`); prop-to-state resets compare with the previous prop during render instead of an effect.
- **URL state** (web): filters and search via `searchParams` / `useSearchParams`. Admin list pages share `useListFilters` (`app/admin/_components/filters/use-list-filters.ts`): applied filters show optimistically (`useOptimistic`) while the server re-renders, search applies debounced with `router.replace`, and local state syncs from props during render — never remount the client with a filter-derived `key`.
- **Context** (web): none for session state — `AuthContext` is form-state scoped to the `(auth)` route group only. Session awareness comes from `hooks/use-user.ts` (with `onAuthStateChange`) and server pages. Avoid adding global contexts.
- Never duplicate state: derive from a single source, reset stores on completion, keep stores out of server data.

## Component Guidelines

Before creating a component, ask:

- Does one already exist (app, `packages/`, HeroUI, shadcn)?
- Can HeroUI (`@heroui/react`) / HeroUI Native (`heroui-native`) solve this?
- Can it be shared between platforms (goes in `packages/`)?
- Is it platform-specific (stays in `apps/`)?
- Is it reusable, or should it stay route-scoped?

Follow DESIGN.md §22 (Before Creating a New Component — Checklist) for the full UI-side checklist.

## Error Handling

- Never silently swallow errors.
- Show user-friendly messages (`FieldError` + `isInvalid` pattern on inputs).
- Log unexpected failures.
- Keep loading and error states separate.
- Fail gracefully — degrade, don't crash.

## Accessibility

- Follow DESIGN.md §1 (Design Philosophy) — accessibility rules live there.
- Accessible labels on all inputs and icon-only buttons.
- Manage focus and show visible focus rings (`#376BF5`/15% on web, `border-focus` on mobile).
- Touch targets sized for mobile use.
- Color contrast: muted text no lighter than `#6C757D`/`gray-500`; status colors never used alone.
- Support screen readers (semantic HTML, `aria` roles, `accessibilityLabel`).

## Security

- Never expose secrets — only `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*` env vars reach the client; never commit `.env*`.
- Validate all user input client-side.
- Trust server validation — RLS is the final authority; don't rely on UI hiding.
- Store storage paths, not URLs; generate signed URLs on read.
- Respect RLS — never bypass `public.users.id` indirection.
- Avoid leaking sensitive data (PII, reference numbers) in logs, URLs, or client state.

## AI Working Rules

- Read existing code before writing — start with Graphify.
- Prefer consistency over novelty.
- Follow DESIGN.md — never redesign UI unless requested.
- Reuse shared packages (`@repo/*`) before writing new utilities.
- Match the surrounding code's style.
- Don't introduce new dependencies without justification.
- Keep changes minimal.
- Preserve backwards compatibility whenever possible.
- Content/visual decisions: follow DESIGN.md §25 (AI Working Rules).

## Continuous Plan Execution

When asked to implement any Markdown plan file, such as PLAN.md, FIX_PLAN.md, IMPLEMENTATION_PLAN.md, REFACTOR_PLAN.md, or similar:

1. Treat the entire plan as one continuous task.
2. Complete all unfinished, feasible tasks.
3. Do not stop after one task, phase, or section.
4. After completing one item, immediately continue to the next.
5. Do not ask "Should I continue?" between tasks.
6. Continue until all implementable tasks are completed and verified.
7. Ask questions only when genuinely blocked by a decision, missing requirement, permission, credential, or external dependency.
8. Prefer concise multiple-choice questions when appropriate, with the recommended option first.
9. Questions are temporary interruptions. After the user answers, immediately resume the remaining plan.
10. If a safe choice can be inferred from the repository, conventions, documentation, or surrounding code, make that decision yourself.
11. Do not leave TODOs, placeholders, mocks, or incomplete work that can reasonably be finished now.
12. Inspect existing code before modifying it and preserve working behavior unless the plan requires otherwise.
13. Follow repository instructions, architecture, and coding conventions.
14. Run relevant type checks, linting, tests, builds, and project-specific verification.
15. Fix errors introduced by the implementation before finishing.
16. Re-read the entire plan before declaring completion and confirm no feasible unfinished tasks remain.

Only stop when:
- every feasible task is completed and verified, or
- progress is genuinely blocked by user input or an external dependency.

Progress updates are allowed, but they must not interrupt implementation.

### End-of-Implementation Summary

After every implementation (plan-driven or not), finish with a short summary in simple, plain language:

- What was done, in everyday terms (avoid jargon; explain any unavoidable technical term).
- What was verified (tests, lint, type checks) and the result, including anything that failed or was skipped.
- Anything left undone or blocked, and why.

## When Modifying Existing Code

Before editing:

- Understand the nearby code and its conventions.
- Understand shared components (`app/components`, `components/`, `packages/`).
- Check platform parity — does the sibling platform implement this feature?
- Search for an existing implementation (Graphify first).

After editing:

- Run `graphify update .` to keep the graph current.
- Update documentation if necessary.
- Keep imports clean.
- Remove unused code.

## Documentation Responsibilities

When introducing new architecture:

- Update AGENTS.md if engineering conventions change.
- Update DESIGN.md if UI changes.
- Update design-tokens.json if tokens change.
- Document new shared components.

## Future-Proofing

- Prefer durable rules over implementation details; avoid naming specific components/screens unless they're long-lived architecture.
- When facts change (stack, tooling, conventions), update AGENTS.md in the same change.

## Maintaining AGENTS.md

- Capture durable engineering conventions only.
- Sprint status, tickets, and implementation details belong in PRs/issue trackers — not here.
- Every claim must be verifiable against the repo; fix or remove anything that drifts from reality.

## Graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

**Graphify is the default navigation mechanism** — run it before repository-wide searching (grep) for any codebase question.

Choosing the right command:

| Goal | Use |
|---|---|
| Codebase question ("how does X work?") | `graphify query "<question>"` |
| Focused concept, component, or feature | `graphify explain "<concept>"` |
| Relationship between two files/concepts | `graphify path "<A>" "<B>"` |
| Broad navigation / first look at the repo | `graphify-out/wiki/index.md` (if present) |
| Broad architecture review, or when query/explain/path surface too little | `graphify-out/GRAPH_REPORT.md` |

These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.

Rules:
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## What NOT to do

- Don't reintroduce NativeWind, `lucide-react-native` or `react-native-keyboard-aware-scroll-view` on mobile.
- Don't bypass `public.users.id` indirection in new RLS policies or FK joins.
- Don't store public URLs for private bucket assets — store paths and sign on read.
- Don't use `@repo/supabase`'s default export on web (it's mobile-oriented); use `@supabase/ssr` directly or `@repo/supabase/server` / `@repo/supabase/browser`.
