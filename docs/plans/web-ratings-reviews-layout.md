# Web Ratings & Reviews — Layout Redesign

Status: Implemented (2026-10-26). Web lint, typecheck and the full 910-test suite pass; the browser checks in §7 have not been run yet.
Scope: Web only. `apps/web/app/browse/[apartmentId]/components/ApartmentRatingsView.tsx` and its route-scoped components, which serve both `/browse/[apartmentId]/ratings` and `/tenant/browse/[apartmentId]/ratings`.
Goal: Give the reviews page a bounded, balanced layout: a compact listing/score rail beside a full-width review feed that starts at the top of the page, reads in sort order, and degrades cleanly when a listing has zero or one review.
Non-goals:
- No database, RLS, migration, or service-query change.
- No change to review eligibility, one-review-per-tenant rules, the review form, or the review-unlock prompt.
- No mobile change (the mobile ratings screen is already a separate implementation).
- No new dependency, no new design token, no global CSS rewrite.
- No sticky aside in this iteration (see Follow-ups).

## 1. Current state (verified)

| Concern | Where it is today |
| --- | --- |
| Shared view | `apps/web/app/browse/[apartmentId]/components/ApartmentRatingsView.tsx` (~348 lines) |
| Public route | `apps/web/app/browse/[apartmentId]/ratings/page.tsx` renders the shared view directly |
| Tenant route | `apps/web/app/tenant/browse/[apartmentId]/ratings/page.tsx` performs the auth/tenant guard, then renders the same view |
| Detail-page entry | `RatingsSection.tsx` pushes to `${basePath}/${apartmentId}/ratings`; `ApartmentReviewsPreview.tsx` and the review-unlock gate also link there |
| Data | `useApartmentReviews(apartmentId)` (`apps/web/hooks/use-apartment-reviews.ts`) owns loading/error/sort/average/buckets; eligibility from `useReviewEligibility` |
| Header data | `fetchRateApartmentHeader(apartmentId)` (`apps/web/service/reviewsService.ts`) loads cover, name, address, landlord, type, status |
| Unknown risk | None; the page is client-rendered and reads only existing RLS-backed queries |

What the current page does, and why it feels stretched:

1. **No page shell.** `ApartmentRatingsView` uses `w-full px-3 py-4 sm:px-4`, while the listing page in the same flow uses `max-w-7xl mx-auto p-4 sm:p-6` (`ApartmentDetailView.tsx`). At desktop widths the reviews page is full-bleed and its left edge jumps when leaving the listing page.
2. **Three full-width blocks stack before the feed.** Listing summary card (cover `sm:w-[38%]`, `lg:h-64`) → rating summary card → "Tenant Reviews". The first review begins roughly 600px below the navbar.
3. **The rating card is mostly whitespace.** A 1/3-width score block sits beside distribution bars stretched across ~840px. The card repeats the score label ("Overall Rating") and says "Based on 1 reviews" (grammar; `RatingBreakdown` renders `{count} reviews` for every row).
4. **Masonry leaves a hole and scrambles reading order.** The feed is `columns-1 md:columns-2`; a single review occupies the left half only, and CSS columns fill column-major, so "Most Recent" / "Highest Rating" read down the left column then jump back to the top of the right one.
5. **The listing card shows the viewer's own stay.** "Duration of Stay" comes from the signed-in viewer's tenancy (`fetchReviewTenancy` + `viewerTenancyId`), so it is always "—" for signed-out visitors and duplicates information already on the listing page. It also triggers a second tenancy read.
6. **The write/edit action is buried.** "Write a Review" / "Edit Review" and the "Reviews unlock after 3 months" hint sit in the reviews header, below the summary, next to the sort control.
7. **The in-view loading state is plain text.** `if (loading)` returns the back button, title, and "Loading reviews…"; there is no destination-shaped skeleton. The public route has no `loading.tsx`; the tenant route's boundary uses `ApartmentDestinationLoading`.

Relevant test coverage that inspects this page:

- `apps/web/lib/apartment-reviews.test.mjs` — mounts `ApartmentRatingsView` with stubbed modules and asserts error/empty behavior; its module map asserts every import is declared.
- `apps/web/lib/rating-breakdown.test.mjs` — transpiles `RatingBreakdown` and checks the score and star colors.
- `apps/web/lib/landlord-properties-loading.test.mjs` — calls `RatingBreakdown` and asserts the default (`responsive`) and landlord (`stacked`) layouts.
- `apps/web/lib/listing-preview.test.mjs` — renders the create-listing preview's `RatingBreakdown` at zero reviews.
- `apps/web/lib/application-wide-performance.test.mjs` — asserts the ratings view calls `useApartmentReviews(apartmentId)` (not with `false`).
- `apps/web/lib/final-skeleton-cleanup.test.mjs` — asserts the tenant ratings `loading.tsx` still renders `BackBtn`, the title, and one accessible status.

## 2. Target layout

### Desktop (`lg` and up)

```text
┌ max-w-7xl mx-auto p-4 sm:p-6 ──────────────────────────────────────────────┐
  ← Back to listing                                    [ Write a Review ]     ← header
  Ratings & Reviews
  Tenant feedback for {apartmentName}.

  ┌─ aside: 20rem (lg) / 22rem (xl) ─┐   Tenant Reviews                      ← main
  │ ┌──────────────────────────────┐ │   1 review        [ Most Recent ⌄ ]
  │ │ [thumb]  ● Available         │ │   ┌──────────────────────────────────┐
  │ │          Irene's Housing     │ │   │ (avatar) Aurick William  ★★★★★ 5.0│
  │ │          📍 142 MH Del Pilar │ │   │ May 18, 2024                     │
  │ │ ──────────────────────────── │ │   │ Demo review: convenient commute  │
  │ │ 👤 Landlord  MAHARTT Navales │ │   │ and responsive communication…    │
  │ │ 🏠 Type      Apartment       │ │   │ [photo][photo] +2                │
  │ │ View listing →               │ │   └──────────────────────────────────┘
  │ └──────────────────────────────┘ │   ┌──────────────────────────────────┐
  │ ┌──────────────────────────────┐ │   │ …                                │
  │ │            5.0               │ │   └──────────────────────────────────┘
  │ │          ★★★★★              │ │
  │ │      Based on 1 review       │ │
  │ │ 5★ ████████████████████  1   │ │
  │ │ 4★ ░░░░░░░░░░░░░░░░░░░░  0   │ │
  │ │ 3★ ░░░░░░░░░░░░░░░░░░░░  0   │ │
  │ │ 2★ ░░░░░░░░░░░░░░░░░░░░  0   │ │
  │ │ 1★ ░░░░░░░░░░░░░░░░░░░░  0   │ │
  │ └──────────────────────────────┘ │
  └──────────────────────────────────┘
```

### Tablet (`md`, 768–1023px)

```text
← Back to listing
Ratings & Reviews
Tenant feedback for {apartmentName}.

┌ listing card ────────────────┐  ┌ rating summary ──────────────┐
│ [thumb] name / address / meta│  │ 5.0, stars, 5 bars           │
└──────────────────────────────┘  └──────────────────────────────┘

Tenant Reviews                              [ Write a Review ]  [ Most Recent ⌄ ]
┌ review card ──────────────────────────────────────────────────────────────┐
└───────────────────────────────────────────────────────────────────────────┘
```

### Mobile (`<md`)

```text
← Back to listing
Ratings & Reviews
Tenant feedback for {apartmentName}.
[ Write a Review ]            ← full-width when eligible

┌ listing card ──────────────────────────────┐
│ [thumb]  ● Available                       │
│          Irene's Housing                   │
│          📍 142 MH Del Pilar St, Malanday… │
│ 👤 Landlord  MAHARTT Navales               │
│ 🏠 Type      Apartment                     │
│ View listing →                             │
└────────────────────────────────────────────┘

┌ rating summary ────────────────────────────┐
│ 5.0 ★★★★★  Based on 1 review               │
│ 5★ ████████████████████ 1                  │
│ …                                          │
└────────────────────────────────────────────┘

Tenant Reviews — 1 review      [ Most Recent ⌄ ]
┌ review card (full width) ──────────────────┐
└────────────────────────────────────────────┘
```

## 3. Design decisions

- **Page shell.** `mx-auto w-full max-w-7xl p-4 sm:p-6`, matching `ApartmentDetailView`. This is the one intentional deviation from DESIGN.md §18's `py-6 sm:py-8` portal shell: the reviews page is reached from the listing page and must keep the same left edge.
- **Reviews lead.** The feed's top aligns with the rail's top, so the first review is above the fold on a standard laptop. The rail is context, not the page's subject.
- **One rail, two cards.** Listing identity first, then the score. The rail is not sticky in v1. A sticky rail is wrong here if it is taller than the viewport (its lower card becomes unreachable); see Follow-ups.
- **Single-column feed.** Replaces `columns-*` for three reasons: one review fills the column instead of half of it, sorted order stays top-to-bottom, and long reviews and photo rows get a comfortable measure. The feed uses the wide main column (`~656px` at `lg`, `~872px` at `xl`), not the full 1280px.
- **Demote the listing photo.** The reviews page does not need a hero gallery. An 80–96px thumbnail plus name, address, status, landlord, and type is enough recognition. The cover photo remains available on the listing page.
- **Remove "Duration of Stay".** It reflects the *viewer's* tenancy, is empty for signed-out visitors, and duplicates the per-review `stayPeriod` already passed to `ReviewCard`. Removing it also removes the `fetchReviewTenancy` effect, its `stay` state and `viewerTenancyId`, and the `formatStayPeriod` / `IconCalendar` imports from this view. The service functions stay because `RateApartmentForm` still uses them.
- **CTA in the page header.** Writing/editing a review is the page's only action; it belongs beside the title, not under the summary. The locked hint becomes a quiet line with a lock icon under the subtitle.
- **Shared breakdown, compact usage.** Keep `RatingBreakdown` and pass `layout="stacked"` (the pattern already used by landlord Property Reviews in its 360px rail). No new layout variant is needed.
- **No-rating state.** Keep the summary card visible with a muted star icon and "No ratings yet" instead of a zero score (the landlord reviews page already does this; DESIGN.md requires never presenting an absent rating as 0). The main column keeps the existing "No reviews yet…" card with the eligibility-gated CTA.
- **No new colors, radii, shadows, or fonts.** Cards stay `rounded-3xl border border-border bg-card shadow-none`; the score and stars use `text-rating`; body copy stays Inter, headings Nunito.

## 4. Implementation steps

### Phase 1 — Shell, header, and back navigation

File: `apps/web/app/browse/[apartmentId]/components/ApartmentRatingsView.tsx`

1. Replace the root container with `mx-auto w-full max-w-7xl p-4 sm:p-6`. Do not change the loading early return into a full-bleed block.
2. Replace `<BackBtn />` on this page with a quiet link row:
   - `import Link from "next/link"` and `usePathname` from `next/navigation`.
   - Derive the listing base: `pathname.startsWith("/tenant/") ? "/tenant/browse" : "/browse"`, then `${base}/${apartmentId}`.
   - Render `← Back to listing` as `Link` with `ArrowLeft` 16, `text-sm text-muted-foreground hover:text-primary`, `w-fit`, and a visible focus ring. Keep `BackBtn` untouched for the detail page, rate form, and loading boundaries.
3. Build the header block:
   - Back link on its own row.
   - `h1` `Ratings & Reviews` (`font-nunito text-2xl font-bold md:text-3xl`).
   - Subtitle `Tenant feedback for {aptHeader.name}.` while the header loads, fall back to `Tenant feedback for this apartment.` (no layout shift from a placeholder title).
   - Action slot: `Write a Review` (primary) or `Edit Review`, using the existing `showReviewButton` / `showEditButton` and handlers. Stack below the title on mobile; align right from `sm`. Do not duplicate the CTA in the reviews header.
   - Locked hint: when `showLockedHint`, render `Reviews unlock after 3 months of stay.` with `IconLock` 14 in muted text under the subtitle (not in the sort row).
4. Keep `RateApartmentModal` at the end of the component with the same state and callbacks.

### Phase 2 — Listing identity rail

New file: `apps/web/app/browse/[apartmentId]/components/RatingsListingCard.tsx` (presentational, client component, default export).

Props: `name`, `status`, `address`, `landlordName`, `type`, `coverImage`, `listingHref`.

- Card: `rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5`.
- Top row: `flex gap-3 sm:gap-4`.
  - Thumbnail `size-20 sm:size-24 shrink-0 overflow-hidden rounded-2xl` with `next/image` (`unoptimized`, `object-cover`) and the existing default thumbnail fallback.
  - Right column `min-w-0 flex-1`:
    - `StatusChip` + `Chip.Label` dot + formatted status as today, `self-start`.
    - Name `font-nunito text-lg font-semibold leading-snug text-card-foreground` with `line-clamp-2`.
    - Address row with `IconMapPin` 16, `text-sm text-muted-foreground`, `line-clamp-2`.
- `Separator` `my-3`.
- Meta rows: a two-row grid (`grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm`), labels `Landlord` / `Type` in `text-muted-foreground`, values in `text-card-foreground` (wrap, never truncate the landlord name). Icons `IconUser` / `IconHome` 16, aligned with the first line.
- Footer link: `View listing →` as a Next `Link` to `listingHref`, `text-sm font-medium text-brand hover:underline`, `w-fit`.
- When `aptHeader` fails to load, render a small bordered card with `We couldn't load this apartment's details.` (`text-sm text-muted-foreground`) so the grid keeps its shape. Keep the reviews feed usable; do not block the page.
- No "Duration of Stay".

### Phase 3 — Rating summary rail

File: `ApartmentRatingsView.tsx` and `RatingBreakdown.tsx`

1. In the view, render the summary inside the rail:
   - `<Card className="rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">`.
   - If `!error && totalReviews > 0`, render `<RatingBreakdown layout="stacked" …>` with the existing `countFor` values.
   - If `totalReviews === 0` (and no error), render the no-rating state: `IconStar` 32 in a muted circle, `No ratings yet` (`font-nunito font-semibold`), and one muted line ("Ratings will appear after tenants review this apartment."). Do not render a `0` score or zero-filled bars.
   - On error, omit the summary (the main column owns the error banner).
2. Polish `RatingBreakdown` without changing its layout API:
   - Reuse `StarRating` from `@/app/components/display/StarRating` for the 22px stars (`rating={overallRate}`, `size={22}`, `className="mt-2 flex flex-wrap justify-center gap-2"`) instead of the duplicated half-star loop. This gives the score a role/label for assistive technology and keeps one star implementation.
   - Keep the score as the existing `h3` with `text-rating` so the rating-yellow rule and its test stay true.
   - Replace the bold `Overall Rating` line with the count line only: `Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}`.
   - Fix row counts: `{count} {count === 1 ? "review" : "reviews"}`.
   - Improve the meter label: `${label} star${label === 1 ? "" : "s"}: ${count} of ${totalReviews} reviews`.
   - Do not change the root class strings or the `responsive` / `stacked` behavior; landlord and preview usages must render identically.

### Phase 4 — Review feed and states

Files: `ApartmentRatingsView.tsx`

1. Main column: `flex min-w-0 flex-col gap-4` (or just a section in the grid's second track).
2. Section header row (`flex flex-wrap items-center justify-between gap-3`):
   - Left: `h2` `Tenant Reviews` (`font-nunito text-lg font-semibold`) + count `text-sm text-muted-foreground` (`1 review` / `N reviews`). Keep the count in a separate span from the heading for cleaner screen-reader output.
   - Right: the existing HeroUI `Dropdown` sort control (`Most Recent`, `Highest Rating`, `Lowest Rating`), `variant="outline" size="sm"`, `rounded-full`, with `aria-label={`Sort reviews: ${sortBy}`}` (the landlord page already does this).
   - The CTA does not appear here except inside the zero-review empty state.
3. Feed: replace `columns-1 md:columns-2` with `flex flex-col gap-3` and render `ReviewCard` directly (no wrapper needed for break-inside). Keep all existing props (`reviewText`, `images`, `stayPeriod`, `rating`, etc.).
4. Error state: keep `ErrorBanner` + Retry in the main column, under the section header.
5. Empty state: keep the existing copy and icon card in the main column; render `Write a Review` / `Edit Review` only when the existing eligibility flags allow it.
6. Loading: replace the early-return text block with a new `RatingsPageSkeleton` (Phase 5) inside the shell. Keep the `loading` gate until reviews resolve so the header subtitle/summary do not flash placeholder content.

### Phase 5 — Skeleton

New file: `apps/web/app/browse/[apartmentId]/components/RatingsPageSkeleton.tsx`.

- Mirror the final layout block for block: shell, back-link placeholder, title/subtitle, header action placeholder, rail (listing card, summary card), reviews header, two review-card placeholders.
- Reuse `Skeleton` from `@heroui/react` with `bg-skeleton!` (same as `landlord/.../ReviewsSkeleton.tsx`).
- One `aria-busy="true"` region with `aria-label="Loading reviews"`; every placeholder is `aria-hidden`; no private data, no fake numbers.
- Use it in the view's loading branch. The tenant route (`apps/web/app/tenant/browse/[apartmentId]/ratings/loading.tsx`) keeps `ApartmentDestinationLoading`; do not add a public `ratings/loading.tsx` because the page's server component performs no async work and never suspends.

### Phase 6 — Tests and documentation

1. `apps/web/lib/apartment-reviews.test.mjs`
   - Extend the module map for the new view imports: `next/link`, `usePathname` on `next/navigation`, `IconLock` (the icon module is already stubbed as `{}`; add string stubs for the icons used), `RatingsListingCard`, and `RatingsPageSkeleton`.
   - Add a source-inspection test for the new layout contract:
     - the view root contains `max-w-7xl` and not `w-full px-3`;
     - the view contains no `columns-` and renders the feed in a single `flex flex-col` list;
     - the view contains no `Duration of Stay` and no `fetchReviewTenancy`;
     - the view uses `layout="stacked"`;
     - the back control is a `Link` to the listing (source contains `usePathname`), not `router.back`.
   - Keep the existing error-vs-empty assertions passing.
2. `apps/web/lib/rating-breakdown.test.mjs`
   - Add `"@/app/components/display/StarRating"` to the mocked modules and `@heroui/react` as today.
   - Keep the assertion that the score `h3` and stars use `text-rating`; now assert the `StarRating` receives `rating={4.5}`.
   - Add pluralization cases: `totalReviews: 1` renders `Based on 1 review`; `totalReviews: 2` renders `Based on 2 reviews`; row counts use `1 review` / `2 reviews`.
3. `apps/web/lib/landlord-properties-loading.test.mjs` — no behavior change expected; confirm the default layout still contains `sm:flex-row` and the stacked layout does not.
4. `apps/web/lib/listing-preview.test.mjs` — unchanged; confirm the zero-review preview still renders.
5. `apps/web/lib/application-wide-performance.test.mjs` — unchanged; keep `useApartmentReviews(apartmentId)` in the view.
6. `DESIGN.md` — add a "Web ratings & reviews ✅" paragraph to §18 (Page widths) describing: the `max-w-7xl` shell shared with the listing page, the identity/score rail, `layout="stacked"` breakdown, single-column feed, the removed viewer-only "Duration of Stay", the header-level Write/Edit action, the zero-review summary state, and the destination skeleton. No `AGENTS.md` or `design-tokens.json` change (no new convention or token).

## 5. Files to touch

- `apps/web/app/browse/[apartmentId]/components/ApartmentRatingsView.tsx` — shell, header, rail + feed grid, loading branch, remove the stay effect.
- `apps/web/app/browse/[apartmentId]/components/RatingsListingCard.tsx` — new presentational identity card.
- `apps/web/app/browse/[apartmentId]/components/RatingsPageSkeleton.tsx` — new skeleton.
- `apps/web/app/browse/[apartmentId]/components/RatingBreakdown.tsx` — pluralization, `StarRating` reuse, accessible meter labels; same layout API.
- `apps/web/lib/apartment-reviews.test.mjs` — module map + layout assertions.
- `apps/web/lib/rating-breakdown.test.mjs` — star mock + pluralization.
- `DESIGN.md` — new page-layout entry.
- No change: `apps/web/service/reviewsService.ts` (`fetchReviewTenancy` and `formatStayPeriod` remain for the rate form and review rows), `useApartmentReviews`, `useReviewEligibility`, `ReviewCard`, `BackBtn`, the route `page.tsx` files, and the tenant loading boundary.

## 6. Acceptance criteria

- [x] At 1440px wide, the page content is `max-w-7xl` and aligns with the listing page (`max-w-7xl mx-auto p-4 sm:p-6`); it does not stretch edge to edge at 1920px.
- [x] From `lg`, the listing/score rail sits left (20rem, 22rem at `xl`) and the review feed fills the right column; the first review card starts at the rail's top.
- [x] At `md`, the two rail cards sit side by side above a full-width feed; below `md`, everything stacks in order: header, listing, summary, reviews.
- [x] A listing with one review shows one full-width review card (no empty half-column, no masonry reordering).
- [x] Changing the sort control reorders cards top-to-bottom; the default remains `Most Recent`.
- [x] Signed-out visitors see no "Duration of Stay" row and no Write/Edit action; the summary still renders.
- [x] `Write a Review` / `Edit Review` appears in the page header only for eligible tenants; the locked hint appears only when `stayLocked`; the review form still opens from both the header and the empty state.
- [x] Zero reviews shows "No ratings yet" in the summary (no `0` score) and the existing empty-state card with the eligible CTA.
- [x] The error banner still appears in the feed column with Retry, and the listing card failure never blocks the feed.
- [x] `RatingBreakdown` says `1 review` / `N reviews` correctly, keeps the score and stars in `text-rating`, and leaves the landlord (`stacked`) and create-listing preview layouts visually unchanged.
- [x] Loading shows the destination-shaped skeleton with one `aria-busy` region and no fabricated values.
- [x] Light and dark mode both use existing tokens; no new CSS is added to `globals.css`.
- [x] `pnpm --filter web lint`, `pnpm --filter web typecheck`, and `pnpm --filter web test` pass.

## 7. Manual verification

Run `pnpm web` and check both routes with an existing listing:

1. `/browse/{id}/ratings` signed out, at 360, 768, 1024, 1440, and 1920px.
2. `/tenant/browse/{id}/ratings` as an eligible tenant (Write), as a tenant with an existing review (Edit), and as a tenant in the 3-month wait (locked hint).
3. A listing with 0, 1, and several reviews; a review with 4+ photos and a review longer than 150 characters (Read more and gallery still work).
4. Force the reviews read to fail (offline in DevTools) and confirm Retry; force the header read to fail and confirm only the listing card shows the message.
5. Toggle dark mode and the reduced-motion setting; confirm no motion was added.

## 8. Follow-ups (not part of this change)

- **Sticky score on long feeds.** Only the rating summary should stick (`lg:sticky lg:top-24`, below the 80px sticky navbar), not the whole rail, and only if its measured height fits the viewport.
- **Server-seeded header.** `fetchRateApartmentHeader` currently runs in a client effect. If the page later streams the listing header from the server, the skeleton and subtitle can be simplified; that is a separate data-loading change.
- **Rating filters.** `All / 5★ / 4★…` chips beside the sort once listings routinely collect enough reviews to need them.
