# Web Recommended ranking and affordability

## Observed cause — 2026-11-06

The active web app's public Supabase URL was used directly for read-only,
anonymous listing queries, with the same public visibility predicates as Browse.
No CLI project link, service-role credential or private user-profile read was used.
The following records were publicly visible. The fourth record's full stored name
is **Bagumbayan Norte Sea View Studio**; its bedroom field is 1. Names are not
used to guess bedroom counts or city identifiers.

For the supplied preference snapshot (Navotas; 15,000–29,999; 1–2 bedrooms; parking;
other preference flags unselected):

| Listing | Rent | Bedrooms | Parking amenity | Verified listing | Rating | Shared score |
|---|---:|---:|---|---|---:|---:|
| Tangos Cozy 2BR | 22,000 | 2 | Yes | Yes | 4.5 | 9 |
| Lower Bicutan Affordable 2BR | 15,000 | 2 | Yes | Yes | Unrated | 9 |
| San Roque Garden View 1BR | 18,000 | 1 | Yes | Yes | Unrated | 9 |
| Bagumbayan Norte Sea View Studio | 16,000 | 1 | No | Yes | Unrated | 8 |

This reproduces the reported old order. Matching city adds 3, within-budget adds
2, matching bedrooms adds 2, parking adds 1 and listing verification adds 1.
The old comparator was score descending, rating descending, ID ascending. Rent
had no tie-break role once it was inside the range. Tangos was therefore first
because of its rating, **not** because 22,000 was treated as a target rent.
The fourth listing is not an equivalent parking match.

These observations verify the public listing inputs, not the affected account's
private saved preferences or other unreported flags. The browser regression uses
the supplied saved-preference snapshot and corresponding observed public fields
through the real loader, with an isolated database/profile transport. Its test
IDs and visibility scaffolding are not copied live identifiers, and the fixture
retains only score-relevant parking markers for the first three records.

## Small web-only change

`app/browse/lib/recommendation-ranking.ts` reuses shared `rankCandidates`; it does
not reproduce or change score weights. The server recommendation read now uses:

1. Existing visibility, saved-city and answered-budget eligibility predicates.
2. Existing shared relevance score, descending.
3. Monthly rent, ascending, for equal relevance scores.
4. Rating, descending, when relevance **and price** tie.
5. ID, ascending, as a deterministic final tie-break.

The entire existing bounded candidate pool (up to 1,000) participates before
the 15-row cap. Sorting a preselected 15-item rating shortlist could miss a cheaper
equivalent candidate, so the new helper passes the pool's length to shared ranking
and applies the final cap only after its web comparator. The subsequent bounded
photo/card read preserves those winner IDs in rank order. This is not a client-only
display sort or a change to the regular paged Browse list.

Missing, non-finite, zero and negative prices cannot be considered affordable;
they are excluded rather than coerced to zero. Missing bedroom/amenity details do
not earn exact-match chips, and a stronger complete match can outrank a cheaper
incomplete one. Shared deduplication, city gating and score filtering are reused.

The existing lower and upper range constraints are retained: 15,000 and 29,999
qualify, 30,000 does not, and the established range query also excludes 14,999
for this selection. The minimum is an inclusive bound, not an optimization target;
no distance-from-minimum bonus or new budget range is introduced. The full-range
unanswered-budget sentinel remains unchanged.

## Result

For the observed public records under the supplied preferences:

1. Lower Bicutan Affordable 2BR — 15,000 (score 9).
2. San Roque Garden View 1BR — 18,000 (score 9).
3. Tangos Cozy 2BR — 22,000 (score 9).
4. Bagumbayan Norte Sea View Studio — 16,000 (score 8: no parking).

If the fourth listing were an equivalent parking match, its score would be 9 and
the price order would instead be **15,000 → 16,000 → 18,000 → 22,000**. That scenario
is tested explicitly, but the production code never fabricates the parking amenity.

## Preserved behavior and verification

No saved preference, scoring weight, chip design/context, hover behavior, Favorite
action, navigation, fallback rule, authentication or RLS is changed. The winner-card
read retains the city/budget eligibility recheck from the budget correction. Fewer
eligible candidates remain fewer; fillers are not relabeled Recommended. Mobile
and shared packages are untouched.

`lib/recommendation-ranking.test.mjs` covers the observed order, equivalent matches,
stronger relevance versus cheaper rent, exact range boundaries, other cities,
missing prices/details, rating/ID stability, affordability before the row limit,
saved-range changes and smaller/empty pools. Existing budget, persistence and
chip-context regressions continue to run through the production query path.

Build the browser fixture with the existing esbuild module setting:

```powershell
node tests/browse-cards/build-fixture.mjs '<temporary output directory>' ranking
```

Serve that directory locally, set `BROWSE_FIXTURE_URL`, then run
`python tests/browse-cards/recommendation-ranking.browser.py`. It asserts the actual
rendered title order for the observed case and an explicitly simulated equivalent-
parking case, repeat reload stability, saved-range changes and chip exclusion from
city sections. Screenshots are kept outside the repository. No database writes occur.
