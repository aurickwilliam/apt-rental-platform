# Application-wide content performance — combined implementation

## Scope and baseline

The baseline is the 62-page audit, commit `d5c24046`, plus the existing uncommitted Phase 1 content-readiness implementation. Phase 1 was preserved. This batch changes presentation reads, data dependencies and public media selection across Tenant, Landlord and Admin; it does not redesign skeletons, add delays or change authorization/business rules. No commit, push, merge, rebase or deployment is part of this work.

## Completed

### Tenant

- Application summaries (My Rental) skip private-document signing. Application detail reads one tenant-owned application and retains document access. Request-visit reads its selected application's context without signing documents it does not display. The service's default full-document contract remains available.
- Maintenance history renders metadata and existing controls before photo signing finishes. One independent batch signs the visible history's paths; late URL results are retired on resource changes. My Rental's text-only summary retains Phase 1's no-photo behavior.
- Favorites uses existing public thumbnail URLs with full-image fallback, preserving the same rows/order/cursors and existing cache. Related listing cards request one cover image instead of galleries. Browse already preferred thumbnails, so no replacement cache/image pipeline was added.
- Read-only rating breakdown/preview widgets stop performing unused review-eligibility work. The full ratings page and review forms still check eligibility. Existing review-data in-flight deduplication is preserved, not replaced.
- The pending-application check on apartment detail starts immediately after profile resolution rather than waiting for related listings. Review-form headers load alongside their independent review/stay read; ownership/stay checks still run before fields are published.

### Landlord

- Application and visit details filter the existing authorized query by record ID instead of downloading a collection. List reads preserve their order and coverage. Visit card images request one cover and prefer its thumbnail.
- Maintenance lists no longer sign every issue photo. Detail reads retain owner and ID filters, all metadata, fee states, resolution notes and only the selected request's photos. Mutation transports and rules are unchanged. Hook identity/resource changes retire old reads.
- Property description uses apartment plus active lease dates (two reads, not four), preserving the lease-date fields and edit controls. Reviews and property payment history use one apartment read instead of the four-read overview. The same Auth/role/owner/error guard is reused. Description/review component identity follows the property ID.
- Property-list cards use existing thumbnails and one embedded cover while retaining all list metadata and whole-list statistics. Full detail/gallery payloads remain intact.

### Admin

- Apartment status/property counts start alongside previews after the existing administrator and apartment checks. All exact-count definitions, predicates and results remain unchanged; no counts are inferred from a preview page.
- All-time analytics starts its three current-state RPCs alongside start-date resolution. Date-bound RPCs still use the validated dates and run concurrently with unfinished current-state reads. Ordinary ranges retain their six RPCs; all-time valid ranges retain seven. Invalid/missing all-time history can finish already-started read-only current-state calls, but publishes no invalid report.
- Phase 1's dashboard regions and shared enrichment queries remain intact. No additional per-card loading stages were introduced.

### Shared/media/navigation

- Original Passport uploads are not modified. Its primary visible ID image is eager/high priority; the first image in document detail receives the same hint. Other image previews remain lazy. Inline private previews retain direct, unoptimized URLs; no optimizer/cache/access changes were made.
- Existing route Links, bounded opt-in intent prefetch, Favorites reuse and scoped finance cache were reviewed and retained. No authenticated production evidence established a new prefetch gap, so no extra speculative requests were added.

## Before/after dependency counts

These are source-derived operations and controlled fixture observations, not measured production HTTP totals. Shared Auth/layout work, SDK behavior and conditional empty results can change actual counts.

| Work | Before | After |
|---|---|---|
| Discovery (Phase 1 preserved) | Sections RPC plus unused exact count | Sections RPC only; counted callers unchanged |
| Tenant application summaries | Rows, then up to two bucket-signing batches across all applications | Same metadata/order, zero signing batches |
| Tenant application detail | Collection, then signing across collection | At most one tenant-owned row; signs only its documents |
| Two read-only review widgets | Two context lookups plus three eligibility reads per widget | No unused eligibility/context reads; review-data request remains shared |
| Review form presentation | Header, then review/stay read | Header and independent read overlap; dependent stay validation unchanged |
| Tenant maintenance history | Rows, then signing, then metadata publication | Rows publish metadata; same one signing batch resolves independently |
| Landlord application/visit detail | Collection then local selection | ID-filtered query, at most one row |
| Landlord maintenance list/detail | List signs all photos; detail re-fetches same collection | List signs none; detail filters one request and signs only its paths |
| Description data after guard | Four overview queries | Two queries, including displayed lease dates |
| Reviews/history property context after guard | Four overview queries | One apartment query; actual reviews/history still load |
| Admin apartment preview/count waves | Preview batch, then count batch | Both batches overlap; request count unchanged |
| Admin analytics all-time | Start-date RPC, then six RPCs | Start date plus three current-state RPCs; date-bound three start once dates validate |
| Admin Dashboard (Phase 1 preserved) | Whole-snapshot barrier across nine base + three enrichment reads | Same requests/results; independent regions settle without unrelated enrichment |

The description is deliberately not apartment-only: inspection found that it displays active lease dates. Removing that read would have lost existing UI functionality, so it was retained in a smaller contract.

## Equivalence and safety

- No Supabase schema, migrations, RPC definitions, RLS, policies or production records are changed.
- No middleware, role rules, suspension rules, payment calculations/decisions, Passport linking, signing permissions/TTLs, or messaging/notification Realtime changes.
- Property guards still validate the fresh caller and landlord role, then compare the loaded apartment's owner. Direct maintenance/visit reads retain owner predicates; tenant application reads retain the tenant predicate; landlord application reads retain their existing RLS and caller-role gate.
- No new privileged server-to-client payload was introduced. New description data removes unused identity fields rather than adding them. No global private-data cache was added.
- Summary transports intentionally omit unused signed URLs but do not change their displayed metadata, ordering, status or action rules. Detail tests compare the selected row with the existing collection mapping.
- All list limits and filter/pagination contracts are retained. Thumbnail limits apply to embedded images, never to the parent collection used for summary totals.
- Financial reads and existing reconciliation locks remain unchanged. Property history drops only unused overview reads, not its actual payment/history requests.

## Deferred individual improvements

- Auth/profile consolidation: no authenticated request trace proves the redundant network cost; no checks removed.
- Overlapping Tenant payment reads: different field/error/authority contracts require a dedicated financial-equivalence review. No speculative financial cache or bounding changes.
- Collection pagination beyond existing limits: would require preserving complete summaries/filter choices and possibly separately approved aggregates. No rows silently truncated.
- Passport wallet lifecycle reuse, linking reorder/suppression, signed-URL sharing and PDF thumbnail cache changes: verification/security lifetimes need separate approval.
- Shared private gallery optimizer/source changes: not part of the safe image-priority hints.
- More route/data prefetch: existing mechanism retained; no demonstrated production gap justifies extra background traffic.
- Authenticated cold/warm/throttled latency and decode benchmarks: unavailable without approved test sessions and production traces. No millisecond speedup is claimed.

## Verification

Targeted tests exercise tenant/landlord query-result parity, selected-record filters, original detail completeness, lease-date preservation, text-only/independent photo loading, account/resource retirement, exact Admin count definitions and concurrent scheduling, and Passport image-priority hints. Existing suites cover filters, ordering, pagination, financial rules, reconciliation and loading lifecycle.

Final integrated validation: web lint passed; typecheck passed; **631 web tests passed, zero failed/skipped**; production build passed; `git diff --check` passed. This batch ran one final full lint/type/test/build cycle after targeted development checks. Existing warnings remain: Next's middleware-to-proxy deprecation, Node's module-type notices and Graphify's extractor warning for generated Supabase types (application TypeScript/build pass).

Browser evidence: local `next start` against the final production build passed the existing 34-route signed-out smoke with zero page errors and no writes/external requests. This checks guard/navigation presentation, not authenticated interiors. The isolated finance browser fixture passed its account/role matrix, collection pagination/retry, drawers/forms, mutation reconciliation, filters and light/dark responsive checks; its transport is in-memory and all hosted requests are blocked. A separate local HEAD-versus-working Admin Dashboard replay confirmed identical datasets and query descriptors with 12 requests in both versions; current totals/users/activity settle while image enrichment is blocked, unlike the old whole-snapshot loader. Browser and replay artifacts are temporary files outside the repository.

No authenticated production cold/warm/Fast-4G measurements were possible. Tests and source-derived operation counts do not certify hosted RLS behavior or establish production timing gains. No private ID images, signed URLs or production records were inspected or written.

## Exact changed-file inventory (combined working tree, including Phase 1)

Root: `ARCHITECTURE.md`, `DESIGN.md`, `docs/application-wide-performance-results.md`.

Paths below are relative to `apps/web/`:

```text
app/admin/analytics/page.tsx
app/admin/apartments/[id]/page.tsx
app/admin/dashboard/lib/get-dashboard-data.ts
app/admin/dashboard/page.tsx
app/browse/[apartmentId]/components/ApartmentDetailView.tsx
app/browse/[apartmentId]/components/ApartmentReviewsPreview.tsx
app/browse/[apartmentId]/components/RateApartmentForm.tsx
app/browse/[apartmentId]/components/RatingsSection.tsx
app/browse/components/BrowseDiscoveryContent.tsx
app/browse/lib/fetch-browse-sections.ts
app/components/passport/PassportDocumentDetailClient.tsx
app/components/passport/PassportDocumentThumbnail.tsx
app/components/passport/ValidIdCard.tsx
app/landlord/applications/[applicationId]/page.tsx
app/landlord/maintenance-requests/[requestId]/page.tsx
app/landlord/properties/[apartmentId]/description/components/DescriptionClient.tsx
app/landlord/properties/[apartmentId]/description/page.tsx
app/landlord/properties/[apartmentId]/lib/get-unit-detail.tsx
app/landlord/properties/[apartmentId]/payment-history/page.tsx
app/landlord/properties/[apartmentId]/reviews/page.tsx
app/landlord/properties/page.tsx
app/tenant/applications/[applicationId]/page.tsx
app/tenant/applications/request-visit/page.tsx
app/tenant/favorites/components/FavoritesClient.tsx
app/tenant/maintenance/components/MaintenanceHistory.tsx
app/tenant/maintenance/page.tsx
app/tenant/my-rental/MyRentalClient.tsx
app/tenant/my-rental/page.tsx
hooks/use-apartment-reviews.ts
hooks/use-landlord-applications.ts
hooks/use-landlord-maintenance-requests.ts
hooks/use-landlord-visit-requests.ts
hooks/use-maintenance-photo-urls.ts
hooks/use-maintenance-request-history.ts
hooks/use-tenant-applications.ts
lib/application-wide-performance.test.mjs
lib/content-readiness.test.mjs
lib/maintenance-loading.test.mjs
lib/phase3-loading-boundaries.test.mjs
service/favoritesService.ts
service/landlordApplicationsService.ts
service/landlordMaintenanceService.ts
service/landlordUnitDetailService.ts
service/landlordVisitRequestsService.ts
service/maintenanceService.ts
service/tenancy-context.ts
service/tenantApplicationsService.ts
```
