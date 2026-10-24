# Navigation readiness — remaining optimizations

## Scope and repository safety

Implemented on the existing `performance/speed` branch. The working tree was clean before editing. After `git fetch origin`, both HEAD and `origin/main` were `114925afb162f314bb297a65df973d12f14f75d2` (zero commits of divergence); the branch was 31 commits ahead of `origin/performance/speed`. PR #233's merge (`0e04b133`) and the LegalPageSkeleton CI fix (`e9a9a549`) were verified ancestors, and the skeleton file was tracked. Newer upstream messaging work was already present and was preserved.

No branch creation/switch, commit, push, merge, pull, rebase, reset, stash, deployment, database write or schema change was performed. The implementation remains modified/untracked working-tree files for review; HEAD is unchanged. Graphify output remains ignored.

## Improvements and dependencies

These are source-confirmed changes, not authenticated browser timing measurements. Counts below describe the affected route's identity prerequisites, not middleware or unrelated shared browser consumers.

| Area | Before | After |
|---|---|---|
| Tenant/Landlord layouts and converted loaders | Each repeated equivalent `getUser()` and self-profile reads | One authoritative `getUser()` and one explicitly selected self-profile read shared within the React request |
| Tenant Maintenance | Browser hydration → profile → active tenancy → history | Authorized server tenancy/history seed; no initial browser context/history read |
| Tenant Application Detail | Browser identity/application read → profile and visit prerequisites; document signing was part of application readiness | Exact tenant/application seed and scoped visits loaded concurrently, personal information from the request identity; private signing runs separately in the browser |
| My Rental applications | Browser identity/filter → applications | Server read starts alongside tenancy and streams independently into the applications region; a valid seed skips its initial browser read |
| Landlord Applications | Hydration → Auth → profile → applications | Server role/suspension/onboarding checks → owner-filtered presentation seed |
| Landlord Maintenance Requests | Hydration → Auth → profile → requests | Server access checks → same mapped request list, with the existing limit and no private signing |
| Landlord Visit Requests | Hydration → Auth → profile → visits | Server access checks → same owner-filtered visit list |
| Landlord Dashboard / Properties | Layout identity plus a second page identity chain before the RPC/list | Shared request identity before the dependent RPC/list |
| Property subpage guard | Another Auth/profile chain before owner validation | Shared request identity, same role and apartment-owner comparison |
| Tenant and Landlord Messages | Layout identity plus a second page identity chain | Shared request identity; existing streamed workspace and parallel tenancy/conversation queries unchanged |
| Tenant Browse | Layout identity plus another Auth/profile query | Shared request identity, including preferences; discovery/grid/filter streaming unchanged |
| Admin Profile Edit | Cached Admin guard plus another Auth and profile query | Reuses the authorized request identity and projects only the edit form's fields |
| Admin Reports / Activity / Analytics | Existing guarded reads | Guard now uses the shared request identity; existing queries, exact counts, paging and analytics concurrency preserved |

Middleware remains a separate authorization/session-refresh context. Server actions retain their independent authorization. No `getClaims`, persistent identity cache, global router-cache setting or full private prefetch was introduced.

## Server-seeded routes

- `/tenant/maintenance`: active tenancy and existing text-only maintenance history.
- `/tenant/applications/[applicationId]`: exact application, scoped visits and read-only personal information. Seeds contain private storage paths, never signed document URLs.
- `/tenant/my-rental`: existing tenancy seed plus independently streamed application presentation. `RentalApplications` is the only region that waits for the applications promise.
- `/landlord/applications`: existing collection query/mapping, with an explicit authorized owner filter on the inner apartment join.
- `/landlord/maintenance-requests`: existing collection query/mapping, no private photo signing.
- `/landlord/visit-requests`: existing collection query/mapping.

The same service functions supply server initialization and browser refetches by accepting an injected caller-bound Supabase client. Server readers do not instantiate the browser client. No collection was silently truncated: tenant maintenance retains its 100-row history limit, landlord maintenance retains its 200-row limit, exact application detail retains its one-row scope, and the existing application/visit collection contracts remain intact.

## Preserved behavior

- Authoritative Auth validation, portal membership, suspension/onboarding restrictions, internal profile IDs, owner/resource filtering and caller-bound RLS.
- Admin denial behavior and the Admin guard's original limited return shape; the expanded request profile is not spread into that return value.
- Auth ID/generation/resource/request-keyed seed retirement, including sign-out and A → B → A transitions. Failed initialized reads remain errors rather than fabricated empty success.
- Explicit Refresh, mutation caller checks, optimistic updates, decision reconciliation, late-response/callback rejection and existing Realtime behavior.
- Existing complete-list behavior, summary counts, URL filters, sorting, pagination and empty/error/loading states.
- All finance arithmetic and payment authority. My Rental's bill/payment reads remain independent, fresh and unseeded; existing finance caches/invalidation are unchanged.
- Existing private document/photo resolvers, buckets, signing permissions and lifetimes. Passport linking/verification was not changed.
- Existing skeletons, dark/light theme styles, Browse query optimizations and Admin streaming. No skeleton or theme stylesheet was redesigned.

## Reviewed but intentionally unchanged

No prioritized server-seeding route was deferred.

- The landlord dashboard RPC and property list require the authorized internal owner ID; they were not speculatively started before access checks.
- Admin Reports and Activity each already use one paged, exact-count query after authorization. There was no independent serial database read to parallelize.
- Admin Analytics and Messages already parallelize their independent reads; that completed work was retained rather than repeated.
- Browser Refresh/mutation authorization remains fresh instead of trusting a server seed indefinitely. The shared browser profile cache, finance browser identity resolution and other client-only pages were not replaced with a new global session/presentation cache.
- Large application/visit collections and existing maintenance caps remain scalability limitations. Changing those contracts requires a separate pagination/count/filter design, not an implicit limit in a performance patch.
- Authenticated cold/warm navigation timings, live cross-account browser journeys and hosted RLS enforcement were not measured/certified. Regression tests exercise source contracts and deterministic mocked request/hook lifetimes. No navigation millisecond claims are made.

## Validation

| Check | Result |
|---|---|
| Focused navigation/readiness/lifecycle/maintenance/layout tests | Passed |
| `pnpm --filter web lint` | Passed |
| `pnpm --filter web typecheck` | Passed |
| `pnpm --filter web test` | 712 passed; 0 failed, skipped or cancelled |
| `pnpm --filter web build` | Passed; optimized production build, TypeScript and 51 static pages completed; seeded routes are dynamic |
| `git diff --check` | Passed |
| `graphify update .` | Updated the ignored local graph; existing extractor warning for generated Supabase types is not an application TypeScript error |

The production build retains Next.js's existing middleware-to-proxy deprecation warning; middleware migration is outside this task. Node tests retain existing module-type warnings. Regression tests were updated to follow extracted client components while retaining their assertions; none were weakened by skipping/deleting a failing case. New tests cover request-local deduplication, authorization, suspension/onboarding, Admin Profile Edit reads, seed/refetch equivalence, owner/resource filters, existing limits, hydration, account transitions, stale races, mutation freshness and streamed My Rental applications. Existing finance, theme and skeleton tests also passed.

## Exact files changed or added

Paths are relative to the repository root. New client files preserve the corresponding page's existing presentation; server wrappers now occupy those page paths.

### Documentation and package exports

```text
AGENTS.md
ARCHITECTURE.md
docs/navigation-readiness-results.md
packages/supabase/package.json
```

### Shared web infrastructure

```text
apps/web/lib/server-identity.ts
apps/web/lib/presentation-seed-server.ts
apps/web/lib/landlord-finance-server.ts
apps/web/service/presentation-seed.ts
apps/web/service/tenant-application-presentation.ts
apps/web/app/components/display/PresentationBoundary.tsx
```

### Tenant

```text
apps/web/app/tenant/layout.tsx
apps/web/app/tenant/browse/page.tsx
apps/web/app/tenant/messages/page.tsx
apps/web/app/tenant/maintenance/page.tsx
apps/web/app/tenant/maintenance/MaintenanceClient.tsx
apps/web/app/tenant/applications/[applicationId]/page.tsx
apps/web/app/tenant/applications/[applicationId]/ApplicationDetailClient.tsx
apps/web/app/tenant/my-rental/page.tsx
apps/web/app/tenant/my-rental/MyRentalClient.tsx
apps/web/app/tenant/my-rental/components/RentalApplications.tsx
apps/web/hooks/use-applicant-personal-info.ts
apps/web/hooks/use-maintenance-tenancy.ts
apps/web/hooks/use-maintenance-request-history.ts
apps/web/hooks/use-tenant-applications.ts
apps/web/hooks/use-visit-request.ts
apps/web/service/maintenanceService.ts
apps/web/service/tenancy-context.ts
apps/web/service/tenantApplicationsService.ts
apps/web/service/visitRequestsService.ts
```

### Landlord

```text
apps/web/app/landlord/layout.tsx
apps/web/app/landlord/dashboard/page.tsx
apps/web/app/landlord/dashboard/lib/get-dashboard-data.ts
apps/web/app/landlord/properties/page.tsx
apps/web/app/landlord/properties/[apartmentId]/lib/get-unit-detail.tsx
apps/web/app/landlord/messages/page.tsx
apps/web/app/landlord/applications/page.tsx
apps/web/app/landlord/applications/ApplicationsClient.tsx
apps/web/app/landlord/maintenance-requests/page.tsx
apps/web/app/landlord/maintenance-requests/MaintenanceRequestsClient.tsx
apps/web/app/landlord/visit-requests/page.tsx
apps/web/app/landlord/visit-requests/VisitRequestsClient.tsx
apps/web/hooks/use-landlord-applications.ts
apps/web/hooks/use-landlord-maintenance-requests.ts
apps/web/hooks/use-landlord-visit-requests.ts
apps/web/service/landlordApplicationsService.ts
apps/web/service/landlordMaintenanceService.ts
apps/web/service/landlordVisitRequestsService.ts
```

### Admin

```text
apps/web/app/admin/_lib/require-admin.ts
apps/web/app/admin/profile/edit/page.tsx
```

### Regression tests

```text
apps/web/lib/navigation-readiness.test.mjs
apps/web/lib/application-wide-performance.test.mjs
apps/web/lib/content-readiness.test.mjs
apps/web/lib/landlord-applications-loading.test.mjs
apps/web/lib/landlord-maintenance-loading.test.mjs
apps/web/lib/loading-lifecycle.test.mjs
apps/web/lib/maintenance-header.test.mjs
apps/web/lib/maintenance-loading.test.mjs
apps/web/lib/phase3-loading-boundaries.test.mjs
apps/web/lib/rental-layout.test.mjs
```
