# Final skeleton loading cleanup

## Outcome and scope

Presentation-only cleanup on `performance/speed`. Existing uncommitted performance
work is preserved. No commits, pushes, merges or deployments were performed.
No auth/role checks, database operations, business rules, private-document access,
finance reads/calculations, cache lifetimes, Realtime or Vercel configuration changed.

## Confirmed fixes and loading sequences

| Area | Before | After |
| --- | --- | --- |
| Browse See All | Loaded sections → entire grid skeleton → results; local flag could stick without a URL change | Loaded cards + Next-owned inline Opening status → results; no local pending flag |
| Tenant application, rate and ratings | Apartment gallery/price placeholder → unrelated form/list | Destination Back/title + accessible compact loading status → content |
| Admin profile, edit, user and verification details | Generic four-stat/table placeholder → profile/form/review | Reusable profile, form, apartment-review or document-viewer geometry → content |
| Admin Analytics | Generic table placeholder → analytics panels | Controls, four cards and two chart-panel placeholders → analytics |
| Admin Dashboard | Generic table placeholder → independent region placeholders → data | Compact overview loading status → existing independent region placeholders/data |
| Landlord finance | Overview route placeholder regardless of selected tab → correct client placeholder | URL-aware selected-tab placeholder inside explicit Suspense → content |
| Theme/motion | Fixed bright neutral; shimmer/pulse despite OS preference | Theme-aware fill; softened sweep; OS or APT reduced motion stops animation without removing placeholders |

`loading.tsx` is not passed `searchParams`. Finance's client-only URL reader sits
inside an explicit server `Suspense` boundary, with a neutral accessible status if
the URL read suspends. It calls the existing `financeTabParam`; supported tabs are
Overview, Expenses and Budget. There is no separate Plan tab in this repository;
unknown values, including `plan`, retain the existing Overview fallback.

## Preserved loading contracts

- Both Passport wallets/details, Rent Payment, landlord Application Details and
  Maintenance Details retain their intentional route shell/status → client body
  skeleton handoff. Only their skeleton fill/motion changed.
- My Rental still starts from its fresh server-authorized context and loads
  authoritative finance independently. No new full-page client wait was added.
- Messages keeps its shared route/in-page skeleton. Notifications and chat data
  and Realtime behavior are untouched.
- Admin list/table routes retain `AdminLoadingSkeleton`; existing streamed
  Dashboard regions and all Admin data/authorization code are unchanged.
- Visit-request spinners, payment receipt/verification states, Favorites pagination
  and the existing scoped presentation cache remain unchanged by this cleanup.

## Accessibility and theme

- Shared web skeleton fill: `#E5E7EB` light and `#303030` dark, recorded in
  `design-tokens.json` and `DESIGN.md`.
- Replaced fixed `bg-grey-300!` skeleton fills, including four inline consumers
  omitted by the original filename-only audit. Profile pulse placeholders also
  use the supported theme token instead of obsolete `bg-default-*` utilities.
- HeroUI shimmer retains its engine, with sweep opacity reduced to 0.45.
  Existing Admin/finance shadcn pulse engines were not converted.
- CSS disables skeleton animations and pseudo-elements for OS reduced motion
  immediately, including server-rendered placeholders. APT's existing saved
  preference independently disables them. Its settings semantics are unchanged.
- Added labeled busy states for new destinations, profile placeholders and the
  finance drill-downs. New Admin placeholder bodies are decorative; one status
  announces loading. shadcn blocks are decorative by default.

## Production-mode browser evidence

Local `next start`, Chromium, 1440×900; public `/browse` only. These are sampled
single-run observations, not server/database benchmarks or an authenticated audit.

| Scenario | Audit baseline | After cleanup |
| --- | --- | --- |
| See All, unthrottled | 48 cards removed at 171 ms; grid skeleton until results at 617 ms (~446 ms without cards) | All 48 cards remained; Opening at 95 ms; 25 result cards at 821 ms; no interval with zero cards |
| See All, Fast 4G | No directly comparable baseline transition | All 48 cards remained; Opening at 83 ms; 25 result cards at 485 ms; no grid skeleton |
| Search commit | Previous grid retained; results at 356 ms | Previous grid retained; results at 395 ms; no full-grid skeleton |
| Warm Back | Cards at 96 ms; no skeleton | Cards at 99 ms; no skeleton |
| Warm Forward | Cards at 52 ms; no skeleton | Cards at 67 ms; no skeleton |

On the unthrottled result page, eight temporary filter-control skeleton blocks
were observed after the 25 actual cards arrived (821–1115 ms). They did not replace
the cards and remain valid, independent loading feedback.

A real interrupted-navigation check held the Browse RSC response, clicked See All,
then navigated to For Owners. All 48 cards stayed visible while pending; returning
to Browse showed 48 cards and no Opening status. Unit tests also simulate repeated
pending/settled/failed lifetimes without hiding any cards.

Rendered production CSS confirmed both engines have the same fill:

- Light: `rgb(229, 231, 235)`.
- Dark: `rgb(48, 48, 48)`.
- OS reduced motion: shimmer and pulse `animation-name: none`.
- Saved APT reduced motion: shimmer and pulse `animation-name: none`.
- Placeholder width stayed 100 px in the controlled fixture in all modes.
- No browser page errors were recorded during the checks.

This improves continuity, not actual server latency. The slower unthrottled
completion versus the baseline is included rather than claiming a latency win.

## Validation

- Focused new regressions plus existing loading-lifecycle suite: 38/38 passed.
- `pnpm --filter web lint`: passed.
- `pnpm --filter web typecheck`: passed.
- `pnpm --filter web test`: 640/640 passed, no failures/skips.
- `pnpm --filter web build`: passed on Next.js 16.3.8; no Suspense/prerender error.
- The build retains the existing middleware-to-proxy deprecation warning. Tests
  retain existing Node module-type warnings; no dependencies/config were changed
  just to suppress them. Validation used the available Node 24.14.0 runtime.
- `graphify update .`: completed; generated root outputs remain ignored. Its
  extractor reported a partial parse of unchanged `packages/supabase/src/types.ts`
  at line 1837. App TypeScript and production compilation passed.
- `git diff --check`: passed with the repository's normal line-ending settings.
  Git emitted its existing LF/CRLF conversion notices. New untracked cleanup files
  were also scanned for trailing whitespace; none was found. A diagnostic run
  overriding `core.autocrlf=false` treated raw CRLF as whitespace and failed;
  no source was rewritten to work around that diagnostic setting.

## Final Git state

- Branch: `performance/speed`.
- HEAD unchanged: `d5c24046b50f6c1d3b1b61b378b8068310ed18d7`.
- Whole working tree: 89 tracked files modified, 26 untracked files, nothing staged.
  These totals include the earlier uncommitted performance work.
- This cleanup's manifest contains 65 repository files: 43 existing files extended
  and 22 new files. No earlier work was reset, stashed or discarded.
- Generated root Graphify files are ignored/untracked by Git. The temporary
  production server was stopped after browser checks.

## Deferred and limitations

- Favorites page retention is deferred: copying old rows outside the live cache
  snapshot requires account-generation, expiry and invalidation reconciliation.
  This final low-risk cleanup does not add another retention layer or weaken the
  existing account-owned cache. Previous/Next still have their original loading UI.
- Authenticated browser traces and screenshots remain unavailable without test
  accounts. New private-route boundaries are covered by rendered component tests
  and the production build, not claimed as authenticated browser verification.
- A full pulse-to-shimmer migration and intentional shell/status handoff redesign
  remain out of scope.

## Exact repository files changed by this cleanup

This list excludes earlier performance work. `DESIGN.md` and `ValidIdCard.tsx`
already had uncommitted edits; this cleanup extends them without replacing those
edits. FavoritesClient and ARCHITECTURE remain modified from earlier work, not
from this cleanup. Paths below are relative to the repository root.

```text
DESIGN.md
design-tokens.json
docs/final-skeleton-cleanup-results.md
apps/web/app/(main)/loading.tsx
apps/web/app/admin/_components/AdminAnalyticsLoading.tsx
apps/web/app/admin/_components/AdminApartmentReviewLoading.tsx
apps/web/app/admin/_components/AdminDestinationLoading.tsx
apps/web/app/admin/_components/AdminFormLoading.tsx
apps/web/app/admin/_components/AdminLeaseLoading.tsx
apps/web/app/admin/_components/AdminProfileLoading.tsx
apps/web/app/admin/analytics/loading.tsx
apps/web/app/admin/dashboard/loading.tsx
apps/web/app/admin/profile/loading.tsx
apps/web/app/admin/profile/edit/loading.tsx
apps/web/app/admin/users/[id]/loading.tsx
apps/web/app/admin/verification/users/[id]/loading.tsx
apps/web/app/admin/verification/documents/[id]/loading.tsx
apps/web/app/admin/verification/apartments/[id]/loading.tsx
apps/web/app/admin/verification/apartments/[id]/lease/loading.tsx
apps/web/app/browse/components/BrowseSectionsList.tsx
apps/web/app/browse/components/BrowseSeeAllPending.tsx
apps/web/app/browse/[apartmentId]/components/ApartmentDestinationLoading.tsx
apps/web/app/browse/[apartmentId]/apply/components/ApplyStartModal.tsx
apps/web/app/components/chat/MessagesRouteSkeleton.tsx
apps/web/app/components/passport/PassportSkeleton.tsx
apps/web/app/components/passport/ValidIdCard.tsx
apps/web/app/components/passport/VerificationActivitySkeleton.tsx
apps/web/app/components/settings/ChangeEmailModal.tsx
apps/web/app/globals.css
apps/web/app/landlord/analytics/loading.tsx
apps/web/app/landlord/analytics/components/AnalyticsLoadingContent.tsx
apps/web/app/landlord/analytics/budget-category/loading.tsx
apps/web/app/landlord/analytics/category-expenses/loading.tsx
apps/web/app/landlord/applications/components/ApplicationsSkeleton.tsx
apps/web/app/landlord/applications/[applicationId]/components/ApplicationDetailSkeleton.tsx
apps/web/app/landlord/dashboard/components/DashboardSkeleton.tsx
apps/web/app/landlord/maintenance-requests/components/MaintenanceSkeletons.tsx
apps/web/app/landlord/maintenance-requests/components/MaintenanceSummary.tsx
apps/web/app/landlord/maintenance-requests/[requestId]/components/MaintenanceDetailSkeleton.tsx
apps/web/app/landlord/payments/components/PaymentsSkeleton.tsx
apps/web/app/landlord/profile/loading.tsx
apps/web/app/landlord/properties/components/PropertiesSkeleton.tsx
apps/web/app/landlord/properties/[apartmentId]/components/PropertyDetailSkeleton.tsx
apps/web/app/landlord/properties/[apartmentId]/description/components/DescriptionSkeleton.tsx
apps/web/app/landlord/properties/[apartmentId]/reviews/components/ReviewsSkeleton.tsx
apps/web/app/tenant/applications/components/ApplicationDetailSkeleton.tsx
apps/web/app/tenant/browse/[apartmentId]/apply/loading.tsx
apps/web/app/tenant/browse/[apartmentId]/rate-apartment/loading.tsx
apps/web/app/tenant/browse/[apartmentId]/ratings/loading.tsx
apps/web/app/tenant/maintenance/components/MaintenancePageSkeleton.tsx
apps/web/app/tenant/my-rental/components/ApplicationStatusCardSkeleton.tsx
apps/web/app/tenant/my-rental/components/MyRentalSkeleton.tsx
apps/web/app/tenant/my-rental/components/PaymentHistorySkeleton.tsx
apps/web/app/tenant/my-rental/components/RentFinanceSkeleton.tsx
apps/web/app/tenant/payment/components/PaymentHistorySkeleton.tsx
apps/web/app/tenant/payment/components/PaymentPageSkeleton.tsx
apps/web/app/tenant/profile/loading.tsx
apps/web/components/ui/skeleton.tsx
apps/web/lib/final-skeleton-cleanup.test.mjs
apps/web/lib/landlord-application-detail.test.mjs
apps/web/lib/landlord-applications-loading.test.mjs
apps/web/lib/landlord-dashboard-loading.test.mjs
apps/web/lib/landlord-maintenance-loading.test.mjs
apps/web/lib/landlord-payments-loading.test.mjs
apps/web/lib/landlord-properties-loading.test.mjs
```

Temporary browser-check script (not a repository file):
`C:\Users\Aaron23\AppData\Local\Temp\opencode\final-skeleton-browser.py`.
