# Web recommendation budget audit

## Confirmed cause

`fetchRecommendedRow` previously read up to 1,000 visible candidates, filtered
only by saved cities, then passed them to shared `rankCandidates`. The shared
score treats rent as a soft bonus, not an eligibility constraint:

- A preferred city adds 3 and a different city returns 0.
- Rent inside the inclusive saved range adds 2.
- Rent outside that range but less than 5,000 pesos from either bound adds 1.
- A severe price mismatch adds 0, **not a penalty or exclusion**.
- The exact bedroom match adds 2 (or 3 for 4+); neighboring ranges can add 1.
- Parking adds 1, pets add 2 (missing pet-friendly subtracts 1), verification adds 1.
- Positive scores survive; order is score descending, rating descending, ID ascending.

With Navotas, 5,000–14,999, 1–2 bedrooms and parking, a verified listing with
matching city/bedrooms/parking scores 9 at 7,500 or 14,999, 8 at 15,000 and 7 at
22,000, 45,000 or 65,000. All were eligible. A less complete affordable listing
could rank below an expensive one. No stale preference value is needed to
reproduce this defect.

## Preference pipeline and evidence limits

1. `SettingsModal` passes the account's loaded `profile.preferences` to
   `useRentalPreferencesForm`; `RentalPreferencesTab` edits that local draft.
   The UI explicitly says changes apply after saving. Visible drafts are not
   proof of persisted values.
2. `BudgetRangeField` selects the preset's exact numeric min/max. The under-15k
   preset is 5,000–14,999, not 15,000. Its commit preserves committed presets;
   only typed custom drafts are snapped to the existing 1,000-peso step.
3. `saveTenantPreferences` validates the shape, canonical CAMANAVA city names,
   allowed pets/vehicles and tenant membership, then overwrites only
   `users.preferences`, filtered by the authenticated `user_id`. The stored data
   contract is unchanged. The subsequent Settings save/dismissal fix requests
   `id` from the same UPDATE and requires the returned caller-owned row before
   reporting success; an error-free zero-row response is not a confirmed save.
   It does not return a full preference read-back snapshot.
4. `parseTenantPreferences` preserves finite stored numeric budget values, including
   14,999. Missing numeric fields receive the existing full-range defaults.
   An absent/malformed blob or missing city-array shape produces no server-side
   personalization. All-default preferences alone are considered skipped.
5. Tenant Browse obtains preferences from the caller-owned profile read in
   `getServerIdentity` / `requirePortalViewer`, cached only for that React request.
   `BrowseDiscoveryContent` passes the parsed object into `loadDiscoverySections`.
   There is no cross-user server recommendation cache.
6. After confirmed Settings saves, `notifyPreferencesSaved` invalidates the shared
   client profile cache once; its listeners share the reload. `router.refresh`
   separately rereads server recommendation rows. The client cache is account-keyed
   with a 30-second TTL, not a recommendation result cache. The existing onboarding
   save also notifies consumers. Failed saves do not publish draft preferences.

Tests exercise the real form hook, save action with a caller-scoped in-memory
database transport, parser and recommendation loader in one round trip. They
verify that committed visible values equal the persisted payload and the budget
used by the query; a second save/reload changes the results. Profile-cache tests
separately verify invalidation, deduplication and account isolation.

**No affected hosted account was identified or inspected.** These are local code,
query and browser regressions, not proof of the screenshot account's stored row.
Its preferences could be saved, unsaved or stale; that distinction remains
unverified. No hosted data, credentials or RLS were read or changed in this audit.

## Minimal correction

Only the web Recommended query changes. It derives the answered budget criterion
from existing `buildPersonalizedRowSpecs` and applies its exact inclusive bounds
before the candidate limit. The saved city gate remains exact. The winner-card
read repeats these predicates so a price/city changed between reads cannot leak
an ineligible listing back into the row.

Shared scoring, mobile behavior, saved data and API contracts are unchanged.
The subsequent web ranking refinement changes equal-score tie-breaking to rent
ascending, rating descending, then ID ascending before selecting the row's 15
winners. See `recommendation-ranking-audit.md` for its public-data investigation.
The full 5,000–100,000 range remains the existing unanswered-budget
sentinel; it is not silently made a new mandatory limit for city-only preferences.
For a genuine 14,999 maximum, 15,000 is excluded even though it is only one peso
over. No near-budget relaxation is introduced.

## Other criteria and existing limits

- Cities are canonical strings from `CAMANAVA_CITIES`, validated at save and
  matched exactly with `IN`. Neither the query nor chips infer a preferred city
  from the current filter, a barangay, a province or a formatted location string.
- Bedrooms remain soft ranking criteria inside the eligible city/budget pool.
  Chips use only the exact shared 1–2, 2–4 or 4+ bounds, never neighboring scores.
- Parking/pets match the actual `parking` / `petfriendly` amenity identifiers.
  Vehicle kinds and requested space counts are stored but the current listing
  candidate contract has no capacity/vehicle-specific matching fields. A parking
  amenity must not be interpreted as proof of capacity for all requested vehicles.
- Household size is stored but is not a standalone scoring or match-chip dimension.
- Legacy shared scoring awards a `nonsmoking` amenity point when `hasSmoker` is true.
  This is a separate semantic concern, not the demonstrated budget cause; it is
  unchanged here and does not earn a smoking-match chip. Web scoring does not
  opt into the mobile-only wheelchair amenity bonus.
- Existing visibility excludes deleted, admin-hidden, occupied and maintenance
  listings through `applyVisibleListings`, with caller-bound RLS still authoritative.
  A verified *listing* adds a bonus, not a mandatory listing gate. Landlord account
  visibility remains a database-policy concern, not bypassed by this correction.

## Fallback and UI

Recommended may have fewer than 15 apartments or be absent. Other personalized
rows and generic filler rows retain their existing independent criteria. They
may contain more expensive listings but do not acquire the Recommended ID,
preference chips or preview summaries. If all personalized rows are empty, fixed
Browse rows are used; if those are empty, the existing grid fallback remains.
No fallback fills the Recommended row with an expensive listing.

`cardPreferenceMatches` continues to use the same exact row criteria for city,
budget, bedrooms and amenities. The server's new budget gate uses that same
budget criterion. The stable Recommended section ID gates both compact card
chips and preview summaries; partial amenities are named, not claimed complete.
Card styling, hover timing, navigation and Favorite interactions are unchanged.

## Regression coverage

- `lib/recommendation-budget.test.mjs`: the reported prices; inclusive min/max;
  wrong/missing cities, rent and visibility; bedroom/parking/pet ranking; deterministic
  score/rating/ID order; empty/few pools and fixed fallback; default/skipped budget;
  winner eligibility recheck; predicates before the 1,000-row cap; save/read-back/query
  round trips using an isolated transport.
- Existing card-matching, recommendation-context and profile-cache suites retain
  their chip, section, refresh and isolation coverage.
- `tests/browse-cards/recommendation-budget.browser.py`: real production discovery
  loader and UI with query-aware test transport; three eligible Navotas listings,
  15,000/22,000/45,000/65,000 excluded from Recommended, wider saved budget after
  reload, empty Recommended without relabeling ordinary city listings.

Build the isolated recommendation fixture with the existing fixture builder and
esbuild module path, adding `recommendations` after the output directory:

```powershell
node tests/browse-cards/build-fixture.mjs '<temporary output directory>' recommendations
```

Serve that directory locally, set `BROWSE_FIXTURE_URL`, and run
`python tests/browse-cards/recommendation-budget.browser.py`. No provider/database
calls are made. The ordinary Browse browser regression remains a separate fixture.
