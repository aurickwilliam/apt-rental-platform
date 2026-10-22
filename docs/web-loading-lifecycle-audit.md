# Web loading-lifecycle implementation report

Scope: approved application-wide audit Phases 1–4, followed by coverage review and regression validation. This report distinguishes source/component evidence from browser evidence. Existing uncommitted performance/loading work was retained; the file list below identifies this implementation pass, not the entire working-tree diff.

## Outcome

- Seven route fallbacks no longer duplicate the client's full-body skeleton: Tenant Payment, both Passport wallets, both Passport document details, landlord application details and landlord maintenance details.
- Five nested payment boundaries override unrelated parent fallbacks: tenant history/success/verify, landlord receipt and property payment history.
- Tenant visit responses, landlord visit decisions and landlord receipt decisions reconcile without restoring full-page loading. Application cancellation navigates without an unnecessary pre-navigation read.
- The property payment-history shell remains visible through loading/errors. Previously corrected routes were not rewritten; Admin application code was not changed.
- Actions have synchronous duplicate-submission locks through reconciliation. Successful writes with failed reconciliation stay locked; Refresh details repeats only the read. Receipt statuses are not optimistic: only the fresh caller-bound server read can change them.

## Implemented route checklist and before/after sequences

All entries below are source/component-confirmed. The browser limitation is recorded under Validation.

| Done | Route | Before | After |
|---|---|---|---|
| [x] | `/tenant/payment` | Route full payment skeleton → client full payment skeleton | Shell/header + compact loading status → client body skeleton → content |
| [x] | `/tenant/passport` | Route wallet skeleton → client wallet skeleton | Shell/header + loading status → client wallet skeleton → content |
| [x] | `/landlord/passport` | Route wallet skeleton → client wallet skeleton | Shell/header + loading status → client wallet skeleton → content |
| [x] | `/tenant/passport/[documentId]` | Route document skeleton → client document skeleton | Shell/back + loading status → client document skeleton → content |
| [x] | `/landlord/passport/[documentId]` | Route document skeleton → client document skeleton | Shell/back + loading status → client document skeleton → content |
| [x] | `/landlord/applications/[applicationId]` | Route full detail skeleton → client same full detail skeleton | Shared detail shell + loading status → client body skeleton → content; prior silent application-decision handling retained |
| [x] | `/landlord/maintenance-requests/[requestId]` | Route full detail skeleton → client same full detail skeleton | Shared detail shell + loading status → client body skeleton → content; private photos/actions unchanged |
| [x] | `/tenant/payment/history` | Inherited Rent Payment skeleton → history skeleton | History-specific boundary → matching existing history/Suspense skeleton → content |
| [x] | `/tenant/payment/success` | Inherited Rent Payment skeleton → blue receipt wait | Shared neutral blue receipt wait → same client wait → authoritative result; existing pending-payment polling retained |
| [x] | `/tenant/payment/verify` | Inherited Rent Payment skeleton → blue verification wait | Shared neutral blue verification wait → same client wait → existing provider-derived result |
| [x] | `/landlord/payments/[paymentId]` | Inherited payment-list skeleton → blue receipt wait; decisions reset full page | Shared blue receipt wait → receipt; decisions retain last-read receipt with progress notice → fresh server result |
| [x] | `/landlord/properties/[apartmentId]/payment-history` | Inherited property-detail skeleton → headerless spinner | Destination shell + compact history wait → same shell/known name + localized wait → rows/error; changed sessions retire context |
| [x] | `/tenant/applications/[applicationId]` | Visit accept/decline restores full detail skeleton; application cancel waits for another read | Loaded application remains; visit response locks through background reconciliation; cancel navigates directly after successful write |
| [x] | `/landlord/visit-requests/[requestId]` | Approve/reject/reschedule restores full-page spinner | Loaded request remains with progress notice; status changes only after fresh read; read failure clears private request details |

The route hand-off status is a single compact HeroUI spinner, not another full-body skeleton or an empty screen. Existing client body skeletons remain genuine loading placeholders. There are no timers or artificial delays. History's matching route/Suspense/client skeletons can still remount; their shared geometry is intentional, and animation continuity has not been authenticated-browser verified.

## Complete portal coverage review

“Retained” means no rewrite in this pass, with existing behavior covered by the full regression suite/build and source review. It does not imply every authenticated screen was visually tested.

### Tenant

| Route | Disposition |
|---|---|
| `/tenant` | Retained redirect |
| `/tenant/browse` | Retained streaming shell/filter rail/grid boundaries |
| `/tenant/browse/[apartmentId]` | Retained destination-specific apartment-detail skeleton |
| `/tenant/browse/[apartmentId]/apply` | Retained; inherited apartment-detail geometry is a deferred design issue |
| `/tenant/browse/[apartmentId]/rate-apartment` | Retained; inherited detail/text loading is a deferred design issue |
| `/tenant/browse/[apartmentId]/ratings` | Retained; inherited detail/text loading is a deferred design issue |
| `/tenant/favorites` | Retained account-scoped presentation reuse and localized cards |
| `/tenant/my-rental` | Retained server context, separate fresh finance, localized placeholders and lease reconciliation |
| `/tenant/maintenance` | Retained single heading and independent context/history loading |
| `/tenant/payment` | Fixed single body owner |
| `/tenant/payment/history` | Fixed inherited boundary |
| `/tenant/payment/success` | Fixed inherited boundary; polling unchanged |
| `/tenant/payment/verify` | Fixed inherited boundary; provider verification unchanged |
| `/tenant/passport` | Fixed single body owner; linking/read path unchanged |
| `/tenant/passport/[documentId]` | Fixed single body owner; private signing unchanged |
| `/tenant/passport/add` | Retained redirect; no new data owner |
| `/tenant/messages` | Retained streaming, workspace and Realtime composition |
| `/tenant/profile` | Retained immediate account status and streamed verification timeline |
| `/tenant/applications` | Retained redirect |
| `/tenant/applications/[applicationId]` | Fixed blocking visit reconciliation/cancel navigation; account/resource-keyed action lifetime |
| `/tenant/applications/request-visit` | Retained form-local loading/navigation |
| `/tenant/personalize` | Retained onboarding form; no changes |

### Landlord

| Route | Disposition |
|---|---|
| `/landlord` | Retained redirect |
| `/landlord/dashboard` | Retained shared heading and destination-shaped skeleton |
| `/landlord/properties` | Retained destination-shaped skeleton |
| `/landlord/properties/create` | Retained form skeleton/workflow |
| `/landlord/properties/[apartmentId]` | Retained destination-shaped detail skeleton |
| `/landlord/properties/[apartmentId]/description` | Retained specific boundary |
| `/landlord/properties/[apartmentId]/reviews` | Retained specific boundary |
| `/landlord/properties/[apartmentId]/payment-history` | Fixed inherited boundary and persistent shell; session changes retire old context |
| `/landlord/applications` | Retained heading, localized list loading and filtering |
| `/landlord/applications/[applicationId]` | Fixed duplicate body owner; previous decision reconciliation retained |
| `/landlord/maintenance-requests` | Retained heading and localized results loading |
| `/landlord/maintenance-requests/[requestId]` | Fixed duplicate body owner; mutation/photo services unchanged |
| `/landlord/visit-requests` | Retained localized list loading; shared hook now hides retired account data |
| `/landlord/visit-requests/pending` | Retained localized list loading; same shared hook safety |
| `/landlord/visit-requests/[requestId]` | Fixed blocking decision reconciliation; exact-resource/account action lifetime |
| `/landlord/payments` | Retained heading, selector and localized cards; prior account/property protections retained |
| `/landlord/payments/[paymentId]` | Fixed inherited boundary and blocking decision reset; no optimistic financial outcome |
| `/landlord/messages` | Retained streaming and Realtime composition |
| `/landlord/passport` | Fixed duplicate body owner; reads/linking unchanged |
| `/landlord/passport/[documentId]` | Fixed duplicate body owner; signing unchanged |
| `/landlord/passport/add` | Retained redirect |
| `/landlord/profile` | Retained existing skeleton/profile streaming |

### Admin (reviewed, not rewritten)

| Route | Disposition |
|---|---|
| `/admin/dashboard` | Retained server-rendered page and localized trends boundary |
| `/admin/users` | Retained server list and pending-filter presentation |
| `/admin/users/[id]` | Retained; generic loading geometry deferred |
| `/admin/apartments` | Retained server list and pending-filter presentation |
| `/admin/apartments/[id]` | Retained specific detail skeleton |
| `/admin/verification` | Retained queue/workflows; generic geometry deferred |
| `/admin/verification/users/[id]` | Retained; generic geometry deferred |
| `/admin/verification/apartments/[id]` | Retained; generic geometry deferred |
| `/admin/verification/apartments/[id]/lease` | Retained; generic geometry deferred |
| `/admin/verification/documents/[id]` | Retained; generic geometry deferred |
| `/admin/reports` | Retained server list and pending-filter presentation |
| `/admin/activity` | Retained server list and pending-filter presentation |
| `/admin/analytics` | Retained; generic chart/table loading geometry deferred |
| `/admin/profile` | Retained; generic geometry deferred |
| `/admin/profile/edit` | Retained; generic geometry deferred |

Admin has no confirmed client full-page skeleton duplicate from this audit. Build and existing Admin tests pass; production-mode signed-out guard checks cover all 15 page routes. Authenticated Admin functionality/visual stability remains unverified without a test session.

### Public/other routes

- Landing, public Browse/detail, auth, suspended, verification and onboarding behavior were not rewritten.
- `/about`, `/careers`, `/community`, `/company`, `/cookies`, `/pap`, `/tos` still inherit the landing fallback: deferred marketing-only geometry.
- Public `/browse/[apartmentId]/apply`, `/rate-apartment`, `/ratings` retain their inherited detail fallback/text states: deferred design-only work, matching the tenant equivalents.
- Profile pulse-style consistency, Passport add-redirect hand-offs and same-geometry history shimmer remounts remain design/visual follow-ups.

## Exact files modified in this implementation pass

Paths are repository-relative. Files already dirty at the start remain dirty; unrelated prior edits were not discarded.

### Hooks

- `apps/web/hooks/use-reconciled-action.ts` (new)
- `apps/web/hooks/use-visit-request.ts`
- `apps/web/hooks/use-landlord-visit-requests.ts`
- `apps/web/hooks/use-landlord-payments.ts` (receipt hook only; prior list-hook improvements retained)

### Shared loading/reconciliation presentation

- `apps/web/app/components/display/RouteLoadingStatus.tsx` (new)
- `apps/web/app/components/display/ReconciliationNotice.tsx` (new)
- `apps/web/app/tenant/payment/components/PaymentStatusLoading.tsx` (new)

### Tenant routes

- `apps/web/app/tenant/applications/[applicationId]/page.tsx`
- `apps/web/app/tenant/applications/components/VisitRequestDetailsCard.tsx`
- `apps/web/app/tenant/payment/loading.tsx`
- `apps/web/app/tenant/payment/history/loading.tsx` (new)
- `apps/web/app/tenant/payment/success/loading.tsx` (new)
- `apps/web/app/tenant/payment/success/page.tsx`
- `apps/web/app/tenant/payment/verify/loading.tsx` (new)
- `apps/web/app/tenant/payment/verify/page.tsx`
- `apps/web/app/tenant/passport/loading.tsx`
- `apps/web/app/tenant/passport/[documentId]/loading.tsx`

### Landlord routes

- `apps/web/app/landlord/applications/[applicationId]/loading.tsx`
- `apps/web/app/landlord/applications/[applicationId]/components/ApplicationDetailSkeleton.tsx`
- `apps/web/app/landlord/applications/[applicationId]/components/ApplicationDetailShell.tsx` (new)
- `apps/web/app/landlord/maintenance-requests/[requestId]/loading.tsx`
- `apps/web/app/landlord/maintenance-requests/[requestId]/components/MaintenanceDetailSkeleton.tsx`
- `apps/web/app/landlord/maintenance-requests/[requestId]/components/MaintenanceDetailShell.tsx` (new)
- `apps/web/app/landlord/passport/loading.tsx`
- `apps/web/app/landlord/passport/[documentId]/loading.tsx`
- `apps/web/app/landlord/payments/[paymentId]/loading.tsx` (new)
- `apps/web/app/landlord/payments/[paymentId]/page.tsx`
- `apps/web/app/landlord/visit-requests/[requestId]/page.tsx`
- `apps/web/app/landlord/properties/[apartmentId]/payment-history/loading.tsx` (new)
- `apps/web/app/landlord/properties/[apartmentId]/payment-history/components/PaymentHistoryClient.tsx`
- `apps/web/app/landlord/properties/[apartmentId]/payment-history/components/PropertyPaymentHistoryShell.tsx` (new)

### Tests/documentation

- `apps/web/lib/loading-lifecycle.test.mjs` (extended existing uncommitted suite)
- `apps/web/lib/test-support/hook-runtime.mjs` (memoized-value identity matches React's `useMemo` semantics)
- `apps/web/lib/landlord-application-detail.test.mjs`
- `apps/web/lib/landlord-maintenance-loading.test.mjs`
- `DESIGN.md`
- `ARCHITECTURE.md`
- `docs/web-loading-lifecycle-audit.md` (this report)

The read-only production browser smoke script and screenshots live outside the repository under `C:/Users/Aaron23/AppData/Local/Temp/opencode/apt-loading-production-smoke*`. Generated root Graphify output was refreshed locally, remains ignored, and was not force-added or committed. No tracked nested graph snapshots were regenerated.

## Safety verification

- No schema, migration, RLS, trigger, function, production-record, Auth/role/suspension rule, payment calculation, decision service, notification/Realtime, Vercel setting or deployment-configuration change.
- No remote write tools or production mutation tests were run. Unit/component tests use local fixtures and deferred promises. Browser automation has no login session and permits local GET requests only; non-GET/external browser requests are blocked.
- Existing database-backed mutation services and arguments are unchanged. Duplicate-submission protection and uncertainty handling are frontend presentation state only.
- Payment confirmation/rejection uses existing authoritative writes and a fresh caller-bound receipt read, never a speculative paid/rejected status. A disappeared receipt becomes unavailable, not perpetual loading or a stale actionable receipt.
- Visit/receipt read failures clear private snapshots, and no decision actions render from failed reads. Account/resource changes retire old reads/callbacks and component-local action locks. Property history does not reuse server-known context after a session change.
- Passport private reads, signed URLs, verification linking, upload behavior and access guards were not moved or changed. Maintenance photo signing stays unchanged. No private-data cache or financial seed was introduced.
- Existing My Rental, Maintenance, Favorites, Browse/Profile/Messages streaming, navigation and notification regression tests remain in the full passing suite.

## Validation and evidence limits

- Web lint: passed.
- Web typecheck: passed.
- Web tests: 535 passed, zero failed/skipped; loading-lifecycle suite includes 28 passing tests, with real hook-runtime and component-composition checks for background progress, denied/missing reads, duplicate actions, read-only retries, resource/account handovers, receipt authority and shell preservation. An initial run exposed three old tests asserting duplicate route/client skeleton ownership; their composition assertions were updated to verify shell-only routes and client-only bodies, and the full suite passed afterward.
- Production build: passed (Next.js 16.3.8). Existing middleware-to-proxy deprecation warning remains; no migration was attempted.
- `git diff --check`: passed; Git emits existing LF/CRLF normalization notices.
- An extra diagnostic run with `core.autocrlf=false` incorrectly treated existing CRLF line endings as trailing whitespace. The required command with the repository's normal configuration passes; unrelated user files and line-ending settings were not rewritten.
- Actual Playwright evidence: local `next start` against the production build, 34 signed-out protected routes (14 changed routes, five prior-regression routes and all 15 Admin pages) redirected to sign-in with HTTP 200 after redirect, zero browser page errors. Desktop and mobile screenshots were inspected. No browser writes or external requests occurred.
- This browser run verifies signed-out navigation/guard presentation only, not authenticated skeleton timing, cold/warm prefetch behavior, network-throttled transitions, mutation workflows or Admin interiors. Those require approved test sessions. Component/source tests are not represented as authenticated browser evidence.
- Graphify AST refresh completed locally. It reported an extractor parse warning in existing generated Supabase types and unsupported/no-symbol files; web TypeScript checking/build passed. This is not a new application TypeScript error.

## Remaining separate-approval items

- Authenticated production-mode cold/warm/throttled visual validation and same-skeleton animation continuity.
- Admin generic loading geometry, marketing inherited landing fallbacks, browse apply/rate/ratings geometry, profile skeleton styling and redirect-only hand-offs.
- Server seeding Passport would intersect verification linking; server seeding maintenance would move private signing; broader application-detail seeding introduces PII into another transport; financial seeding intersects freshness. None was implemented or required for the approved shell/body fixes.

No commit, push, merge or deployment was performed.
