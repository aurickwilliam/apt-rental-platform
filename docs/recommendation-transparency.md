# Apartment recommendations and explanations

## What was verified

The survey concern does not, by itself, prove a broken recommendation engine.
Synthetic tests confirm that a listing can match city and budget while missing
bedrooms by design. No survey respondent's account or production records were
read or changed for this work.

Web's tenant default Browse and Mobile's tenant Search add a personalized
section to the existing discovery sections. Eligibility and ranking come from
one pure module shared by both platforms,
`packages/utils/src/recommendations.ts`; web re-exports it from
`apps/web/lib/recommendations.ts` and Mobile calls it through
`service/search/recommendations.ts`. Ordinary public discovery and explicit
search/filter results are not personalized.

## Two-stage policy

### Stage 1 — strict eligibility

Only eligible listings can appear in the personalized section. The same rules
run in the bounded candidate query and again in memory, so a provider-side
prefilter can never admit an ineligible card.

| Signal | Eligibility rule |
|---|---|
| Saved cities | If any are selected, the listing's **whole normalized city name** must equal one of them (case/whitespace normalized, multiple cities are alternatives). Barangay names and partial names never match. No selected cities means all visible CAMANAVA listings remain eligible. |
| Monthly budget | A complete, non-default saved range is enforced inclusively: `minimumBudget <= monthly_rent <= maximumBudget`. Budget only ever uses `monthly_rent`; deposits, advance and fees do not affect eligibility. A listing with missing, non-finite, zero or negative rent is never eligible. |
| Household size | Saved options are ranges, so only a capacity **provably below the option's minimum** excludes a listing (e.g. `3 - 4 Persons` requires `max_occupants >= 3`). A missing, non-finite or zero capacity is unconfirmed and stays eligible. Household size never earns a chip because the top of the range is not confirmed. |
| Smoking household | If the tenant smokes, a listing with the explicit `nonsmoking` amenity is excluded. A listing with both `smoking` and `nonsmoking` counts as prohibited. Missing smoking information stays eligible. Non-smoking tenants keep every listing eligible. |
| Pets | APT has no explicit pet-ban, species or pet-count field on a listing. Missing pet information therefore cannot exclude a listing; only the affirmative `petfriendly` amenity is scored and explained. |
| Visibility | Not deleted, not admin-hidden, `status` `available` or `unverified`, and readable through the caller-bound client. RLS remains the final authority. |

The full contract range ₱5,000–₱100,000 doubles as the existing cross-platform
cleared/default sentinel, so it is treated as “no explicit budget” rather than
an artificial cap. Older blobs have no explicit-selection flag and cannot
distinguish a deliberately chosen full range. A partial or malformed budget
pair is **invalid**, not default-filled: recommendations are withheld and the
tenant is asked to review preferences. A saved city outside CAMANAVA is
invalid for the same reason (APT has no listings there).

The query (`fetchRecommendationCandidates`) applies these filters before its
bounded 200-row limit, orders deterministically, and embeds a single card photo
(cover first). Generic discovery cohorts are never re-ranked or used as
fallbacks, so the carousel is never filled by widening the tenant's budget,
city or household requirement.

### Stage 2 — soft ranking

Eligible listings are deduplicated by id, scored, and ordered by score
descending, rating descending, then id ascending. Only the first eight are
rendered in the carousel.

- Preferred city adds 3; no city preference adds a baseline 1.
- A configured saved budget adds 2.
- Bedrooms: an exact range match adds 2 (4+ adds 3); adjacent partial credit
  adds 1 where applicable; no bedroom preference adds 1.
- Pets: if requested, explicit `petfriendly` adds 2; its absence subtracts 1.
- Parking: if requested, explicit `parking` adds 1.
- Smoking: if the tenant smokes, explicit `smoking` without `nonsmoking` adds 1.
- Mobile accessibility: explicit `wheelchair` adds 1. Web has no wheelchair
  identifier in its amenity catalogue and does not invent the match.
- Verified listings add 1.

Bedrooms, parking, pets, smoking and accessibility are **optional** ranking
signals: an eligible listing that misses one stays in the section, ranks lower,
and never receives that match label. City, budget, household capacity and an
explicit smoking ban are not optional.

## Preferences, statuses and freshness

The personalized section is shown only when the saved blob is meaningful. With
no saved preferences there is no section at all, not an empty one. Once shown,
the section distinguishes:

| Status | Meaning | Action |
|---|---|---|
| `ready` | At least one eligible listing | Cards with verified chips |
| `empty` | Preferences are valid but no visible listing qualifies | Update preferences; Browse all apartments (web) |
| `invalid` | Saved budget or city data cannot be used | Review/update preferences |
| `error` | The candidate request failed | Try again |
| `loading` (Mobile) | The candidate request is in flight | Skeleton |

A failed request is never rendered as “No matches”, and an empty result never
borrows generic listings to fill the carousel. One eligible listing shows one
card.

- Web has no persistent recommendation cache: the server reads the current
  profile and candidate rows per request. Saving preferences calls
  `router.refresh()`, which re-reads the section; a changed ranking/reason
  snapshot retires the open preview.
- Mobile keys its React Query candidate read by account id plus the serialized
  recommendation preferences and keeps a 30-second stale time. Saving
  preferences invalidates the current-profile query, so the new blob produces
  a new key and a new read without re-login. There is no separate ranked cache.
- This does not add cross-device live updates. Another device must perform its
  normal refresh/profile fetch.

## Explanation contract

`recommendationReasons` returns at most two unique labels in stable priority
order: Preferred city, Within budget, Bedroom match, Pet-friendly, Parking
available. Only finite, positive actual rent inside finite, ordered, configured
saved bounds earns Within budget. Bedrooms must be an integer in the selected
range; partial ranking credit is never labeled a match. Parking and pets
require both an affirmative saved preference and the corresponding affirmative
amenity ID. Unknown data produces no claim. These are individual matches, not a
suitability guarantee; the supporting copy is “Apartments selected based on your
rental preferences.” Pet kinds/counts, parking quantities, household capacity
above the option's minimum and smoking rules remain matters to confirm with the
landlord.

Reasons belong to the `for_you` **section**, not shared apartment records. The
same apartment in a generic row or ordinary results grid has no personalized
claims. The default recommendation card shows its reasons directly below the
location and above the price/rating row, so keyboard and touch users can read
them without an additional interaction. Full-height flex cards and an
auto-margin footer keep price rows aligned; long recommendation locations
truncate visually without changing the actual text, and no image/card width is
changed. All recommendation cards reserve equal chip space at each breakpoint,
including zero-match cards, which show no labels or empty accessible list.
Ordinary cards do not reserve that area. Visual values are defined in
DESIGN.md §11.

## Preview interaction and positioning

The card's navigation and favorite remain sibling HeroUI controls, never nested
interactive elements; native keyboard activation and touch navigate normally.
There is no eye/preview button. Match lists are visible on default cards and
named for screen readers. The supplementary desktop hover preview keeps its
existing delay and fade/zoom, without duplicate chips. Escape, Close and outside
presses dismiss it without hijacking adjacent controls. It never steals focus
when it opens, and it is not required to read matches or open apartment details.

Preview intent originates on the card's existing navigation button, never the
containing card: the sibling Favorite hit area cannot start a hover timer.
Favorite entry, keyboard focus and activation cancel pending/open previews
through the existing shared hook. Returning to normal card content starts its
usual hover intent again. The preview's local mouse-move handler checks stacked
hit targets so it dismisses when the pointer reaches a source/neighboring card
heart underneath it. No new global listener, delay or duplicate hover state is
introduced. Favorite clicks still stop propagation and only toggle favorites.

The panel portals to the document to escape row/frame overflow clipping. Its
width is at most 320px and shrinks within the intersection of the browsing
region's horizontal bounds and viewport. Actual, untransformed rendered height
is measured before paint and with ResizeObserver, including wrapped text.
It is vertically clamped to the viewport with an 8px margin; short windows scroll
inside the panel rather than clipping actions. That internal scroll does not
dismiss it. Page/row scroll and resize dismiss stale anchors. Existing z-50 is
retained, no sidebar z-index workaround or card-layout expansion is used.

## Search

`applyBrowseFilters` already searches `name`, `city` and `barangay` using a
case-insensitive OR. The placeholder now names those three fields, with an
accessible input label. Search matching, explicit filters, commit-on-Enter,
recent searches and the shared Maps search/navigation contract are unchanged.

## Regression commands

```powershell
pnpm --filter web test
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web build
pnpm --filter mobile exec jest hooks/search/useSearchSections.test.tsx --runInBand
```

The focused pure suites are `apps/web/lib/recommendation-eligibility.test.mjs`
(Stage 1 rules, candidate query filters, statuses), `recommendations.test.mjs`
(strict budget, smoking, ranking compatibility) and
`recommendation-transparency.test.mjs` (reasons, empty/invalid/error
separation, generic context isolation, preview geometry). Existing scoring
tests cover smoking-rule regression and optional ranking semantics.

Browser fixtures use production cards, section/grid renderers, preview hooks,
reason builder and SearchContainer, with synthetic listings and stubbed
navigation/favorite transports only. See
`apps/web/tests/recommendations/README.md`. They verify interaction and geometry,
not hosted database behavior or native iOS/Android rendering.
