# Property Listings Audit — 2026-10-31

**Status: audit complete; the approved safe changes (§C) were applied on 2026-10-31.** Everything else in this report is a finding or a proposal that was not changed. The applied script is [`property-listings-proposed-changes-2026-10-31.sql`](./property-listings-proposed-changes-2026-10-31.sql). Findings in §B describe the state *before* the changes.

## 0. Scope and target

| Item | Value |
|---|---|
| Database | Hosted Supabase project `APT` (`ezxirkpgfpripjydcqnt`), the one the apps' public URL points to. The only other project, `apt-test`, is `INACTIVE`. **Treated as production.** |
| Listings | **68** rows in `public.apartments` (63 live, 5 soft-deleted, 1 live listing hidden by an admin) |
| Images | 220 rows in `public.apartment_images` (168 Unsplash stock photos, 52 files in the `apartment-images` bucket) |
| Tenancies | 34 (8 active, 26 ended) |
| Landlords | 23 |

Data model facts that shaped the audit (there is no separate table for these):

- **Amenities** are a `text[]` column on `apartments`, not a table. All stored IDs exist in the app's catalog (`perks.ts`).
- **Lease agreements** are not a table. There are two different things:
  - `apartments.lease_agreement_url`: a per-listing **template** file in the private `lease-agreements` bucket.
  - `tenancies.signed_lease_path`: the one **signed** contract per tenancy (private `signed-leases` bucket). One column per tenancy, so "two agreements for one tenancy" is structurally impossible.
- Location rules: `validate_camanava_location()` tests a pin against PostGIS city polygons in `private.camanava_city_boundaries` (areas look right: Caloocan 52.6 km², Valenzuela 46.0, Malabon 15.0, Navotas 10.4, but the polygons are simplified at 30–116 points, so **near-border results need a human check**). Canonical barangays come from `packages/constants` (PSGC); ZIP blocks from `METRO_MANILA_ZIP_RANGES`.

## A. Summary

| Measure | Count |
|---|---|
| Total properties found | **68** |
| Total audited | **68** (all of them, individually; see §H) |
| Properties cleaned | **55** (54 descriptions rewritten, which includes the 3 barangay-spelling fixes; plus Cozy Cove's name; see §C) |
| No issues detected | **1** — Villa Quintin Apartment (`2cf80bd9`) |
| Only trivially fixable issues | 1 — Cozy Cove Apartment (trailing space in name; retired "furniture" amenity is left as the app's rules say) |
| Live listings needing manual review or a decision | **61** |
| Soft-deleted (excluded from the live count) | 5 — junk or test data, see §D |

## B. Issue breakdown

### B1. Incorrect or inconsistent information
- **Descriptions contradict addresses (54 listings).** 54 of the 56 seeded listings (the ones with Unsplash photos) have descriptions that put the unit in another city or district, for example Catmon Premium Studio Condo is in Malabon but is described as "in Bonifacio Global City"; Acacia Family 3BR (Malabon) as "in residential Manggahan… Ortigas access". This is the most serious content problem: it is false advertising to tenants.
- **Landlord-written descriptions that contradict their own record (2 live):** Charle's Apartment says "1-bedroom" but the record has 2 bedrooms; Irene's Housing describes a "45-square-meter studio… on the 12th floor" while the record is an Apartment, 40 sqm, 1 bedroom / 2 bathrooms, floor "2nd-5th Floor", Unfurnished. Not changed (landlord-authored).
- **Pricing outside the shared rule** (`deposit` ∈ {0, 1×, 2×} rent, `advance` ∈ {0, 1×}; older off-rule values are allowed to stay until pricing is edited): Charle's Apartment (deposit 3,000 / advance 3,000 on 10,000), Harvey's Villa (3,000 / 15,000 on 45,000), Irene's Housing (5,000 / 20,000 on 15,000). All 56 seeded listings follow the rule.
- **Field inconsistencies:** Harvey's Villa is type Studio with 2 bedrooms and lease duration "Monthly"; the test listing has "3 Months". Both values sit outside the 6 Months / 1 Year / 2 Years set the seeded listings use (check the current form's options before treating as an error).
- **Cosmetic:** "Cozy Cove Apartment " has a trailing space. Seeded listings are internally consistent: no rent below the ₱1,000 minimum, bathrooms never exceed bedrooms + 1, occupancy ≥ bedrooms.
- **Verified flag without a record (58 listings, 57 live):** `is_verified = true` but no approved row in `apartment_verifications`. (Only 5 approvals exist in total.) Visitors see a Verified listing that was never verified. Not changed: needs a business decision.

### B2. Location issues
- **18 of 63 live pins fail the database's own city check** (21 of 68 overall). Examples: Deparo Budget Studio / Kaunlaran Affordable Studio / Moonwalk Family 3BR are stated as Caloocan but their pins fall in Valenzuela; Sangandaan ×2, Concepcion Quiet 1BR and Tangos-area Navotas listings fall in Malabon; Tala Riverside, Muzon Foodie and Bagong Silang Adjacent fall in no CAMANAVA polygon.
- **29 live listings have a pin or barangay problem.** 11 more have a barangay that is not a canonical barangay: Caloocan only has "Barangay 1…188", so district names such as Camarin, Deparo, Bagong Barrio, Grace Park, Kaunlaran, Maypajo, Sangandaan, Tala and University Hills are not valid values. Others: "Polo", "Ibayo-Tipas" (not a CAMANAVA barangay), "Tangos"/"Tangos 2" (canonical: Tangos North/South), "Bagumbayan Norte/Sur" (canonical: North/South), "Tanong" (canonical: Tañong).
- **Names that point elsewhere:** "Lower Bicutan Affordable 2BR" (Tangos, Navotas), "Pio del Pilar Studio" (Camarin, Caloocan), "Concepcion Quiet 1BR" (stated Caloocan; Concepcion is a Malabon barangay and the pin is in Malabon).
- **ZIP:** all live ZIPs are inside their city's PHLPost block. Only deleted *Dadwadaw* (1408 for Navotas) and *Bengbangan* (420) fail.
- Charle's Apartment: pin is in Malabon, stated Valenzuela (Dalandanan).

### B3. Duplicate and broken images
- **Every one of the 56 seeded listings uses 3 Unsplash stock photos** drawn from only **28 distinct URLs**. The most reused photo appears on 14 listings. These are not photos of the properties. Same URL twice inside one listing: Acacia Family 3BR, Punturin Family 3BR.
- **Exact duplicate files (storage ETags):** deleted *Bengbangan* has 4 identical files; deleted *Uprise* has 2. **Across listings:** live *Sheldon & Leonard's Apartment* shares 4 identical files with deleted *Dadwadaw* (different landlords); deleted *Uprise* and *Shibal's Home* share 3.
- **Broken or missing:** none. All 28 Unsplash URLs return HTTP 200; all 52 Supabase image rows resolve to existing storage objects; no listing lacks images; every listing has exactly one cover.
- **Not done:** perceptual (near-duplicate) comparison of Supabase originals. Many are 2–7 MB and `AGENTS.md` flags image egress as metered, so I used exact content hashes only. Near-duplicate checking of the 52 real photos is a possible follow-up.
- Storage hygiene: `apartment-images` holds 138 objects, **75 unreferenced** by any image row (leftovers from replaced or deleted uploads). Not deleted; needs approval and a reference check.
- 209 of 220 rows have no `url_thumb` (all Unsplash plus older uploads).

### B4. Descriptions
- 54 false-location descriptions (above). The two seeded listings that do not name outside places are Bignay Budget Dormitory and Lingunan 2BR, but they are short generic text.
- 5 soft-deleted listings have junk descriptions ("Assad", "awdaddadadad", a joke sentence, nonsense text, "Automated test listing").
- "[Messaging Test] Shaq Time" (live but admin-hidden) is test content.

### B5. Amenities
- No duplicate entries within any listing. No amenity ID missing from the catalog.
- **Conflicts:** the hidden test listing has Smoking + Non-Smoking and No Cooking with Kitchen/Stove (same on deleted Bengbangan and Uprise); Irene's Housing is Unfurnished but lists Bed Included and Furnished.
- The retired `furniture` amenity is still on 4 listings (Cozy Cove, Harvey's Villa, Irene's, deleted Bengbangan); the app's policy is to leave existing listings alone, so I did not touch them.
- I did not add any amenity: nothing in the records explicitly supports an addition.

### B6. Lease agreements
- **No duplicate or conflicting signed agreements.** 0 of 34 tenancies have a `signed_lease_path`. No tenancy has more than one active row, no duplicate (apartment, tenant, start) rows, no end-before-start dates, no active/occupied status mismatches.
- **One orphan signed-lease file:** `signed-leases/933f49ee-3a45-4208-ab8d-e9b4549409d5/1792121602116.jpg` (110 KB, created 2026-10-16). No tenancy has that ID. This is a legal document, so it was **not touched**; it needs a human to identify which tenancy it belonged to.
- **Template files (`lease-agreements`):** 71 objects, only 8 distinct contents. Most listings carry the same default template file, which is expected and not a duplicate-agreement problem. Three docx variants differ by a few bytes (37,723 / 37,725 / 37,734 B).
- **Dead reference:** Polo Budget Studio (`c639a90e`) points to a full public URL in a bucket named `lease_agreements` (underscore) that does not exist; the real bucket is `lease-agreements`, and no object exists for that listing. Needs the landlord to upload a template.
- **Orphan template files** whose listing ID is not in `apartments`: `00ead974…/lease-agreement.docx`, `25dbb8ca…/…pdf`, `f2c00714…/…pdf` (and an older superseded `d0d34072…/….docx`). Not deleted.

### B7. Relationship and data integrity
- **Clean:** no orphaned images, tenancies, applications, reviews, favorites, visit requests or verifications; every listing has a valid landlord holding the landlord role; rating and favorites counters match their source rows; no live listing belongs to a non-verified landlord.
- **Needs a human:** tenancy `0c8cd326…` (Harvey's Villa) has `landlord_id` 6e06ac91 while the apartment's landlord is ec07acef (likely an ownership transfer; not altered).
- 2 ended tenancies reference the soft-deleted Shibal's Home (legitimate history; preserved).

## C. Changes made

Applied in one transaction after a rolled-back dry run, with compare-and-set updates and two in-transaction abort checks (expected row counts; no price, location, amenity, landlord, status or verified-flag change).

| Change | Rows | Properties | Reason |
|---|---|---|---|
| `apartments.description` replaced with text built only from stored fields | 54 | the 54 seeded listings whose old text named places outside their address (all listings in §H marked `D1`) | B1/B4: false location claims |
| `apartments.name` trimmed | 1 | Cozy Cove Apartment (`64f7181f`) | trailing space |
| `apartments.barangay` set to canonical PSGC spelling | 3 | `07e36e58` Bagumbayan Norte→North, `81ad4faf` Bagumbayan Sur→South, `ad6045ba` Tanong→Tañong | same barangay, canonical name |
| New table `private.listing_audit_backup_20261031` (audit trail, 57 rows) | 1 table | the 57 rows above | holds the pre-change values; restore SQL is at the bottom of the `.sql` file |

Distinct properties touched: **55**. The three barangay fixes are on listings that are also among the 54 description rewrites; Cozy Cove is the extra one. The backup table holds 57 rows because it also covers the two seeded listings that were backed up but not edited (Bignay Budget Dormitory, Lingunan 2BR).

Post-change check (re-read from the database): 54 new descriptions, 0 untrimmed names, the 3 barangays read back as written, 0 differences in price/location/amenity/landlord/status/verified fields against the backup, totals unchanged (68 apartments, 220 images, 34 tenancies), all 63 live listings still have a cover image, and the 18 live pins that fail the city check are exactly as before.

Not changed: prices, coordinates, cities, amenities, landlords, verification flags, images, lease files, tenancies.

## D. Manual review report (what cannot be resolved without a person)

| Issue | Listings | Why it cannot be auto-fixed | What to verify |
|---|---|---|---|
| Pin outside stated city | 18 live (`L1` below) | A pin is not proof of an address; the polygons are simplified; the address could be right and the pin wrong, or the reverse | Real street address and city; re-place the pin with the landlord |
| Non-canonical barangay | 11 more live | District names do not map to one barangay number | Ask the landlord for the official barangay (Caloocan: Barangay N) |
| Stock photos instead of property photos | 56 live | No source of real photos exists | Landlord uploads real photos; or decide these are demo placeholders |
| Verified flag without a verification record | 57 live | Changing it alters public trust signals | Decide: backfill approvals, or clear the flag |
| Pricing off-rule / field contradictions | Charle's, Harvey's Villa, Irene's | Material terms set by the landlord | Landlord confirms deposit, advance, bedrooms, area, floor |
| Description vs record contradictions | Charle's, Irene's | Either the text or the record is wrong | Landlord confirms which |
| Tenancy/apartment landlord mismatch | tenancy `0c8cd326…` | Ownership evidence needed | Confirm whether the unit changed hands |
| Dead lease template reference | Polo Budget Studio | No file to point at | Landlord uploads a template |
| Orphan signed-lease file | `933f49ee…` | Legal document | Identify the tenancy |
| Orphan storage objects | 75 images, 4 lease templates | Deleting needs approval | Confirm unused, then approve cleanup |
| Hidden test listing | `90cd6eee` | Conflicting amenities are the landlord's | Delete or fix the test data |

Soft-deleted listings (junk, kept as-is): `c1ca44b5` Bengbangan (invalid city "Bagoong", province "Mountain Province", lat/lng 123/123, ₱180 rent), `6c63754a` Uprise ("adawdaw…", province Basilan), `eb87a013` Dadwadaw (Angeles address under Navotas, ZIP 1408, 400 sqm / 5 beds at ₱1,400), `d0d34072` Shibal's Home, `be57575e` CLAUDE TEST. They are already hidden; a purge needs separate approval.

## E. Prevention recommendations

Database (each is a reviewed migration, not applied):
1. **Verified flag guard:** a trigger so `apartments.is_verified` can only become true when an approved `apartment_verifications` row exists (and a one-time decision on the 58 existing rows).
2. **Barangay validity:** server-side check against the canonical list for CAMANAVA listings, mirroring `guard_camanava_apartment_location`, which already checks the pin. Add a recurring audit query for rows that bypassed triggers (the 18 failing pins clearly entered via a seed or service-role path).
3. **Images:** restrict `apartment_images.url` to the project's bucket (or a reviewed allow-list) so stock hotlinks cannot ship as listing photos; add a stored `content_hash` with a unique `(apartment_id, content_hash)` index, computed at upload.
4. **Amenities:** a `CHECK` that every element is in the catalog and the array has no duplicates (today there are none, so it is safe to add), plus the existing conflict rules enforced in the database.
5. **Description:** a `NOT VALID` check for a minimum meaningful length alongside the existing 2,000 cap.
6. **Leases:** a check that `signed_lease_path` starts with the tenancy's own ID; a periodic job that reports storage objects with no referencing row (reported, never auto-deleted).

Application:
- Compute and compare a SHA-256 of each image before upload (web `apartment-image-upload.ts`, mobile equivalent) and warn on a duplicate within the listing.
- Block Continue on the add-listing form when the typed barangay is not in `getBarangaysByCity`, and make Caloocan's picker offer "Barangay N" values.
- Show the generated "facts" summary beside the free-text description so a landlord sees contradictions (bedrooms, area, floor) before publishing.

## F. Verification results

- All post-audit claims above come from queries run against the live project; none depends on a change, because no change was made.
- No application code, tests or schema were modified, so `pnpm --filter web lint|typecheck|test` and `pnpm --filter mobile lint|test` were **not run**: there is nothing for them to verify. They should run after any approved code safeguard.
- Post-cleanup validation (Stage D): done after applying, results in §C.

## G. Proposed changes (need approval)

Ranked by safety; all use compare-and-set updates inside a transaction and are reversible from the backup table. See the `.sql` file.

| # | Change | Rows | Risk |
|---|---|---|---|
| 1 | Back up affected rows to a private audit table | all touched | Creates one table (drop to undo) |
| 2 | Replace the 54 mismatched seeded descriptions with text generated **only from stored fields** (type, beds/baths, area, furnishing, floor, amenities, rent, deposit, advance, lease duration; no landmarks, no invented claims) | 54 | Low. Caveat: the text repeats the stated barangay, which 27 of those 54 listings have flagged as wrong or non-canonical; either fix locations first or accept |
| 3 | Remove the trailing space from "Cozy Cove Apartment " | 1 | Trivial |
| 4 | Canonical spellings: Bagumbayan Norte→North, Bagumbayan Sur→South, Tanong→Tañong (deterministic aliases of the same barangays) | 3 | Low |

I recommend **not** auto-changing anything else.

## H. Per-listing audit matrix (all 68)

IDs are the first 8 characters (unique across the 68); `ll` is the first 8 characters of `landlord_id`. Full IDs are reproduced by the query at the end of the SQL file.

Codes: **L1** pin outside stated city (in X) · **L2** barangay not canonical · **L3** ZIP outside city block · **L4** invalid city/province · **D1** description names places outside the address · **D2** junk/test description · **D3** description contradicts record · **I1** shared stock photos · **I2** same photo twice in listing · **I3** identical file shared with another listing · **I4** identical files inside listing · **V1** verified without record · **P1** deposit/advance off rule · **P2** rent below ₱1,000 · **P3** missing deposit/advance · **F1** field inconsistency · **A1** amenity conflict · **A2** retired "furniture" · **N1** name issue · **T1** dead lease template ref · **R1** relationship mismatch.
Severity: Critical = invalid data, already soft-deleted · High = false or contradictory public information · Medium = misleading or unverifiable but not false · Low = cosmetic.
Auto = fixable by the approved changes in §G; everything else is manual.

| ID | Title | ll | Issues | Sev | Auto |
|---|---|---|---|---|---|
| 811f227d | Bagong Silang Adjacent 1BR | 16189b5c | L1 (in none), L2 Bagong Silang, D1, I1, V1 | High | D1 |
| 00082342 | Concepcion Quiet 1BR | ec07acef | L1 (in Malabon), L2 Maypajo, D1, I1, V1 | High | D1 |
| 683516f0 | Deparo Budget Studio | bad2f65d | L1 (in Valenzuela), L2 Deparo, D1, I1, V1 | High | D1 |
| 04e00c46 | Kaunlaran Affordable Studio | 16189b5c | L1 (in Valenzuela), L2 Kaunlaran, D1, I1, V1 | High | D1 |
| 26b4596c | Kaunlaran Village Quiet 2BR | bad2f65d | L1 (in Valenzuela), L2 Kaunlaran Village, D1, I1, V1 | High | D1 |
| a44fb598 | Moonwalk Family 3BR | 39d239dc | L1 (in Valenzuela), L2 Camarin, D1, I1, V1 | High | D1 |
| c639a90e | Polo Budget Studio | bad2f65d | L2 Polo, D1, I1, V1, T1 | High | D1 |
| dfddbfce | Sangandaan Corner Townhouse | ec07acef | L1 (in Malabon), L2 Sangandaan, D1, I1, V1 | High | D1 |
| 99280c24 | Sangandaan Townhouse 3BR | 16189b5c | L1 (in Malabon), L2 Sangandaan, D1, I1, V1 | High | D1 |
| 656e9476 | Tala Riverside 2BR | 0d8274a6 | L1 (in none), L2 Tala, D1, I1, V1 | High | D1 |
| dc34082f | Tangos Cozy 2BR | 0d8274a6 | L1 (in Malabon), L2 Tangos, D1, I1, V1 | High | D1 |
| 366d9baa | University Hills Studio Condo | 0d8274a6 | L1 (in Valenzuela), L2 University Hills, D1, I1, V1 | High | D1 |
| 7acf07f3 | Bangculasi Townhouse 3BR | bad2f65d | L1 (in Malabon), D1, I1, V1 | High | D1 |
| cbc1b46d | Daanghari Family 2BR | 0d8274a6 | L1 (in Malabon), D1, I1, V1 | High | D1 |
| baa2f408 | San Roque Garden View 1BR | 39d239dc | L1 (in Malabon), D1, I1, V1 | High | D1 |
| c97cb0c6 | Ususan Budget Studio | 39d239dc | L1 (in Malabon), D1, I1, V1 | High | D1 |
| c4e2371b | Muzon Foodie 1BR | bad2f65d | L1 (in none), D1, I1, V1 | High | D1 |
| 839f6d5b | Pio del Pilar Studio | 16189b5c | L1 (in Valenzuela), L2 Camarin, D1 (names Pio del Pilar), I1, V1 | High | D1 |
| b7e6f9a6 | Charle's Apartment | ec07acef | L1 (in Malabon), P1, D3 (1-bed vs 2 beds) | High | – |
| 4d61f1ed | Harvey's Villa | ec07acef | P1, F1 (Studio with 2 beds; "Monthly"), A2, R1 (tenancy `0c8cd326` landlord) | High | – |
| 56510e01 | Irene's Housing | 39d239dc | D3 (45 sqm studio, 12th floor vs record), P1, A1 (Unfurnished with Bed/Furnished), A2 | High | – |
| 60b316cc | Acacia Family 3BR | 0d8274a6 | D1, I1, I2, V1 | High | D1 |
| 400461c0 | Bagong Barrio Garden 2BR | 0d8274a6 | L2 Bagong Barrio, D1, I1, V1 | High | D1 |
| 5122863c | Bagong Barrio Heritage Studio | bad2f65d | L2 Bagong Barrio, D1, I1, V1 | High | D1 |
| 07e36e58 | Bagumbayan Norte Sea View Studio | 16189b5c | L2 Bagumbayan Norte (spelling), D1, I1, V1 | High | D1, L2 |
| 81ad4faf | Bagumbayan Sur Studio | 39d239dc | L2 Bagumbayan Sur (spelling), D1, I1, V1 | High | D1, L2 |
| 97bc9289 | Grace Park 1BR | 16189b5c | L2 Grace Park, D1, I1, V1 | High | D1 |
| e7747a2e | Ibayo Central Room | 39d239dc | L2 Ibayo-Tipas, D1, I1, V1 | High | D1 |
| 200bcdc0 | Lower Bicutan Affordable 2BR | 16189b5c | L2 Tangos, D1, I1, V1 (name points to Taguig) | High | D1 |
| a39ebe6b | Punturin Family 3BR | bad2f65d | D1, I1, I2, V1 | High | D1 |
| ad6045ba | Tanong Industrial 2BR | bad2f65d | L2 Tanong (spelling), D1, I1, V1 | High | D1, L2 |
| 15475a5f | San Antonio Village 2BR | ec07acef | L2 Grace Park, D1 (names "San Antonio Village"), I1, V1 | High | D1 |
| 766333ab | Arkong Bato 1BR | ec07acef | D1, I1, V1 | High | D1 |
| 3600a7f9 | Bagbaguin Premium 2BR | ec07acef | D1, I1, V1 | High | D1 |
| 57e4521c | Canumay East Executive 1BR | 0d8274a6 | D1, I1, V1 | High | D1 |
| 15e83b83 | Catmon Premium Studio Condo | 16189b5c | D1, I1, V1 | High | D1 |
| d9f870c7 | Coloong Loft Studio | 0d8274a6 | D1, I1, V1 | High | D1 |
| 7c6bda16 | Concepcion Artist Studio | 16189b5c | D1, I1, V1 | High | D1 |
| ca71feba | Hulong Duhat Budget Studio | 0d8274a6 | D1, I1, V1 | High | D1 |
| 2351165d | Lawang Bato View Condo | ec07acef | D1, I1, V1 | High | D1 |
| 1982f59c | Longos Budget Room | ec07acef | D1, I1, V1 | High | D1 |
| 9b1e26d5 | Malinta Corner Studio | 16189b5c | D1, I1, V1 | High | D1 |
| fa6f4be2 | Maysan Artist Loft | 0d8274a6 | D1, I1, V1 | High | D1 |
| 4db88f0f | Navotas West City Center 1BR | bad2f65d | D1, I1, V1 | High | D1 |
| 38007bbd | North Bay Luxury 3BR | bad2f65d | D1, I1, V1 | High | D1 |
| 51826b5b | Panghulo Business Studio | 0d8274a6 | D1, I1, V1 | High | D1 |
| 72b55952 | Parada 3BR | 39d239dc | D1, I1, V1 | High | D1 |
| 1999525d | Potrero Urban Loft Studio | 16189b5c | D1, I1, V1 | High | D1 |
| a6e11085 | San Jose Compact Room | bad2f65d | D1, I1, V1 | High | D1 |
| 113a80a9 | San Jose Corner Suite 2BR | ec07acef | D1, I1, V1 | High | D1 |
| 71b9a742 | Santolan Heritage 1BR | 0d8274a6 | D1, I1, V1 | High | D1 |
| 21a03d94 | Sipac-Almacen High-Rise 1BR | ec07acef | D1, I1, V1 | High | D1 |
| 9ddfb436 | Sipac-Almacen Sunshine Studio | 39d239dc | D1, I1, V1 | High | D1 |
| b25c2d3c | Tinajeros Studio Condo | 39d239dc | D1, I1, V1 | High | D1 |
| 0647a961 | Tonsuya Family Flat 2BR | ec07acef | D1, I1, V1 | High | D1 |
| d0da5701 | Tugatog Riverside 2BR | 39d239dc | D1, I1, V1 | High | D1 |
| ba219685 | Ugong 2BR | bad2f65d | D1, I1, V1 | High | D1 |
| 8ef5c491 | Bignay Budget Dormitory | 39d239dc | I1, V1 (description is short but not false) | Medium | – |
| f253a347 | Lingunan 2BR | 0d8274a6 | I1, V1 (description is short but not false) | Medium | – |
| 0a87932f | Sheldon & Leonard's Apartment | 39d239dc | I3 (4 files shared with deleted Dadwadaw), V1 | Medium | – |
| 90cd6eee | [Messaging Test] Shaq Time (hidden by admin) | 16189b5c | L2 Tangos 2, F1 (3 Months), N1 (test), A1 (smoking + non-smoking; no cooking with kitchen/stove) | Medium | – |
| 64f7181f | Cozy Cove Apartment | bad2f65d | N1 (trailing space), A2 | Low | N1 |
| 2cf80bd9 | Villa Quintin Apartment | 5eed3a7a | none detected | – | – |
| c1ca44b5 | Bengbangan House for Rent *(deleted)* | 16189b5c | L4 (city "Bagoong", Mountain Province, lat/lng 123/123), D2, I4, P1, P2, F1, A1, A2 | Critical | purge decision |
| 6c63754a | Uprise Apartment *(deleted)* | ec07acef | L4 (garbage address, Basilan), D2, I3, I4, P1, F1, A1 | Critical | purge decision |
| eb87a013 | Dadwadaw *(deleted)* | ec07acef | L1 (in Malabon), L3 (1408), D2, I3, P3, F1 | High | purge decision |
| d0d34072 | Shibal's Home *(deleted)* | 39d239dc | D2, I3, V1, F1 | Low | purge decision |
| be57575e | CLAUDE TEST *(deleted)* | 0d8274a6 | D2, N1 | Low | purge decision |

Seeded listings that follow the pricing rule, have 1 cover, working image links and a valid template reference carry no other issue; listings not shown with a code have no finding for it.

## I. Follow-up: the 18 live pins outside their stated city (read-only analysis, no change made)

Distance is how far the pin sits outside the stated city's polygon (PostGIS, `private.camanava_city_boundaries`). The polygons are simplified, so a small distance can be the border, not the pin.

**Tier 1 — within about 300 m of the stated border (8). Probably fine; a human should glance at the map.**
`dc34082f` Tangos Cozy 2BR (48 m, pin in Malabon, stated Navotas) · `7acf07f3` Bangculasi Townhouse 3BR (53 m) · `cbc1b46d` Daanghari Family 2BR (66 m) · `c4e2371b` Muzon Foodie 1BR (66 m, in no polygon) · `dfddbfce` Sangandaan Corner Townhouse (184 m, in Malabon, stated Caloocan) · `baa2f408` San Roque Garden View 1BR (193 m) · `c97cb0c6` Ususan Budget Studio (270 m) · `99280c24` Sangandaan Townhouse 3BR (305 m)

**Tier 2 — roughly 0.8–0.9 km outside (2). Ambiguous.**
`b7e6f9a6` Charle's Apartment (793 m; stated Valenzuela/Dalandanan, pin in Malabon) · `00082342` Concepcion Quiet 1BR (910 m; stated Caloocan/Maypajo, pin in Malabon)

**Tier 3 — 2–3.8 km outside (8). The pin is wrong or the city is wrong.**
`04e00c46` Kaunlaran Affordable Studio (2.0 km, in Valenzuela) · `26b4596c` Kaunlaran Village Quiet 2BR (2.1 km, in Valenzuela) · `656e9476` Tala Riverside 2BR (2.9 km, in no polygon) · `839f6d5b` Pio del Pilar Studio (3.0 km, in Valenzuela) · `a44fb598` Moonwalk Family 3BR (3.2 km, in Valenzuela) · `811f227d` Bagong Silang Adjacent 1BR (3.2 km, in no polygon) · `366d9baa` University Hills Studio Condo (3.6 km, in Valenzuela) · `683516f0` Deparo Budget Studio (3.8 km, in Valenzuela)

Why nothing was changed: the stated city, barangay and ZIP of each Tier 3 listing agree with each other, so the pin is the likely error, but the street addresses look synthetic and the barangay names for Caloocan are district names (not official barangays), so no pin can be set to a verified location from the data we have. A barangay centroid would be an approximation presented as a location.

### I.1 Outcome of the "demo placeholders" decision (preview only, still no change)

The 56 stock-photo listings were confirmed as demo placeholders, and no seed script for them exists in the repo or git history, so a fix can only be a data change. Charle's Apartment (`b7e6f9a6`) is a real landlord's listing, not a placeholder, so it stays manual.

Rule previewed for the other 17: move the pin to the nearest point inside the stated city, with a 150 m margin from the border.

- **Tier 1, 8 listings: safe.** Moves of 198–455 m, every result passes `validate_camanava_location`, no two pins coincide (the closest pair, Sangandaan ×2, are about 95 m apart). Preview: `dc34082f` 198 m · `7acf07f3` 203 m · `cbc1b46d` 216 m · `c4e2371b` 216 m · `dfddbfce` 334 m · `baa2f408` 343 m · `c97cb0c6` 420 m · `99280c24` 455 m. Pre-change coordinates are in `private.listing_audit_backup_20261031`.
- **Concepcion Quiet 1BR and tier 3, 9 listings: rule rejected.** The nearest valid point is on the city edge, 1.2–4.0 km away, and four listings (`839f6d5b`, `a44fb598`, `366d9baa`, `683516f0`) would collapse onto the identical coordinate `14.71517, 121.00172`. These need barangay-level coordinates from a geocoder or a hand-picked point per listing.

### I.2 Applied: 8 near-border demo pins moved inward (2026-10-31)

Applied in one transaction with compare-and-set on the backed-up coordinates and abort checks (exactly 8 rows, every result valid, no move over 500 m, no non-coordinate field changed). Only `latitude` and `longitude` were written.

`dc34082f` Tangos Cozy 2BR 198 m · `7acf07f3` Bangculasi Townhouse 3BR 203 m · `cbc1b46d` Daanghari Family 2BR 216 m · `c4e2371b` Muzon Foodie 1BR 216 m · `dfddbfce` Sangandaan Corner Townhouse 334 m · `baa2f408` San Roque Garden View 1BR 343 m · `c97cb0c6` Ususan Budget Studio 420 m · `99280c24` Sangandaan Townhouse 3BR 455 m.

Read back: all 8 pass `validate_camanava_location`; live pins failing the city check went from 18 to 10; no two live listings share a coordinate; totals unchanged (68 apartments, 220 images, 34 tenancies); the 54 new descriptions are intact. The earlier coordinates are in `private.listing_audit_backup_20261031` (restore: update `latitude`, `longitude` from that table by `id`).

Still open: 10 live pins: Concepcion Quiet 1BR and the 8 pins 2–3.8 km off (need barangay-level coordinates) and Charle's Apartment (real listing, landlord must confirm).

### I.3 Proposed (not applied): district-level coordinates for 8 of the 9 remaining demo pins

Source: OpenStreetMap Nominatim, queried with district names only ("Camarin, Caloocan"), no street addresses or personal data. These are **district centroids**, not street addresses, which is acceptable for demo data and must not be read as exact.

| ID | Listing | Stated barangay | Anchor used | New lat, lng | Moves |
|---|---|---|---|---|---|
| 00082342 | Concepcion Quiet 1BR | Maypajo | Maypajo | 14.6379145, 120.9755491 | 3.7 km |
| 04e00c46 | Kaunlaran Affordable Studio | Kaunlaran | Kaunlaran | 14.6446254, 120.9747210 | 4.4 km |
| 366d9baa | University Hills Studio Condo | University Hills | University Hills | 14.6594687, 120.9795934 | 4.6 km |
| 26b4596c | Kaunlaran Village Quiet 2BR | Kaunlaran Village | Kaunlaran Village | 14.6474253, 120.9710798 | 4.8 km |
| 683516f0 | Deparo Budget Studio | Deparo | Deparo | 14.7396955, 121.0191688 | 7.0 km |
| 811f227d | Bagong Silang Adjacent 1BR | Bagong Silang | Bagong Silang | 14.7752480, 121.0449222 | 8.7 km |
| 839f6d5b | Pio del Pilar Studio | Camarin | Camarin | 14.7560394, 121.0492887 | 9.7 km |
| a44fb598 | Moonwalk Family 3BR | Camarin | Barangay 174 (a real barangay in Camarin, so it does not stack on the line above) | 14.7614944, 121.0495192 | 10.2 km |

All 8 pass `validate_camanava_location` as Caloocan and no two share a coordinate. The size of the moves shows how far off the seed pins were.

**Tala Riverside 2BR (`656e9476`) is left manual.** Tala's real location (Tala Estate, about 14.773, 121.071) is rejected by the app's simplified Caloocan polygon, so any pin the guard accepts would be an arbitrary point. Fixing the polygon is a separate piece of work.

### I.4 Applied: 8 district-level demo pins (2026-10-31)

The eight moves proposed in I.3 were applied in one transaction (compare-and-set on the backed-up coordinates; aborts on: non-unique or colliding coordinates, any invalid result, a count other than 8, or any non-coordinate field changing). Only `latitude` and `longitude` were written. Distances moved match the proposal (3.7–10.2 km).

Read back: all 16 pins moved in this audit (I.2 and I.4) pass `validate_camanava_location`; no two live listings share a coordinate; totals unchanged (68 apartments, 220 images, 34 tenancies); the 54 new descriptions are intact. Live pins failing the city check: **18 → 2**.

Remaining 2: `656e9476` Tala Riverside 2BR (the app's Caloocan polygon rejects Tala's real location; fix the boundary data first) and `b7e6f9a6` Charle's Apartment (real listing; landlord must confirm the address). The pre-change coordinates are in `private.listing_audit_backup_20261031` (Charle's and Tala were never moved).

Caveat: the 8 district pins are centroids, so a listing's pin is no longer on its (synthetic) street address. Real addresses must come from landlords.

## J. Follow-up: "Verified" flag without a verification record (analysis only, no change made)

**State:** 61 live listings have `is_verified = true`; 4 of them have an approved `apartment_verifications` row (Irene's Housing, Harvey's Villa, Cozy Cove Apartment, Villa Quintin Apartment). The other **57** have none: the 56 demo listings plus Sheldon & Leonard's Apartment (`0a87932f`, not a stock-photo listing).

**How it got there:** `authenticated` and `anon` hold only SELECT/REFERENCES on `apartments.is_verified` (no INSERT/UPDATE), and `guard_new_apartment_listing` forces `false` on client inserts. So the flag can only be set by a privileged path (seed script or operator), never by an app flow. The database already prevents the problem from being created by users.

**What depends on the flag:** the homepage "Featured" section (`FeaturedApartments.tsx` filters `is_verified = true`), the browse "verified only" filter, the Verified section of `get_search_sections`, recommendation scoring and the Verified chips. Clearing it on the 56 demo listings would leave Featured showing only the 4 genuinely verified ones.

**Options**
1. **Keep the demo flags as a deliberate, documented choice; clear Sheldon & Leonard's only.** Sheldon's is not demo data. Clearing it is honest, and it also unblocks the landlord, because `reject_verified_apartment_resubmission` refuses a verification submission while the flag is true.
2. **Clear all 57.** Most honest to visitors, but empties Featured and the verified filter for demo purposes.
3. **Backfill approved rows for the 57.** Rejected: it would invent review history (a reviewer and a decision that never happened).

If the site is shown to real visitors, option 2 (or a demo marker column) is the honest long-term answer; option 1 is a reasonable interim for a demo environment.

### J.1 Decision and applied change (2026-10-31)

Decision: the 56 demo listings keep `is_verified = true` as a deliberate, documented demo choice (they are placeholders, not verified properties); Sheldon & Leonard's Apartment (`0a87932f`) is not demo data, so its flag was cleared.

Applied in one transaction: its row was added to `private.listing_audit_backup_20261031` first, then `is_verified` was set to `false` only because it was still true with no approved verification, and the transaction aborts if any other field changes. Only `is_verified` was written. The landlord can now submit the listing for real verification.

Read back: Sheldon & Leonard's is now unverified (was true); live listings flagged Verified went 61 → 60: 4 with an approved record, 56 demo listings kept by decision; none other lacks a record. Totals unchanged (68 apartments, 220 images, 34 tenancies). Restore: `update apartments set is_verified = true where id = '<0a87932f… full id>'` from the backup table.

Note for anyone reading the data later: the 56 verified demo listings are intentionally unreviewed. Recommended follow-up is a demo marker column, or clearing the flag, before real visitors see the site.

## K. Safeguards written as a migration (not applied)

File: `supabase/migrations/20261031120000_listing_data_guards.sql`, plus `apps/web/lib/amenity-catalog-sync.test.mjs`. Nothing was applied to the database. Every guard fires only when its column is written, so no existing row is rewritten, validated or rejected.

| Safeguard | What it does | Notes |
|---|---|---|
| `guard_apartment_amenities` | Rejects unknown amenity ids, null entries and duplicates on insert or when `amenities` changes | The list is the **mobile** catalog (83 ids), which is a superset of web's 50. A list built from web alone would have rejected valid mobile listings. Conflicting pairs stay a picker rule: old rows hold both. |
| `guard_apartment_verified_flag` | Blocks `is_verified` going true without a pending/approved verification row | The admin approval flow sets the flag while the row is still `pending`, so it is accepted. Operators opt in per transaction with `set local app.allow_unreviewed_verified = 'on'` (needed to re-seed demo listings). The 56 demo flags stay as they are. |
| `guard_apartment_image_url` | Client-added photos must be URLs in the `apartment-images` bucket | Operators and service role are not restricted. Existing stock-photo rows untouched. |
| `private.listing_data_quality` | Read-only view of live-listing findings: pins outside city, verified without review, off-rule pricing, short descriptions, photos outside the bucket, no cover, name whitespace | Operators only (no grants to client roles). |

**Validated before writing this up:** the exact migration text was run against the real database inside a block that always rolls back, with behavior assertions. Results: duplicate, unknown and null amenities rejected; a valid set (including the mobile-only `wheelchair`) accepted; no existing listing has an unknown amenity; verifying with no review row rejected; verifying with a pending row (the admin flow), with the opt-in setting, and a no-op on an already verified row accepted; clearing the flag accepted; a foreign photo URL rejected for a client role, a bucket URL passed this guard (a later row-security rule stopped the dummy insert, as expected); operator inserts unrestricted; the view returned `photo_outside_bucket=168`, `pin_outside_stated_city=2`, `pricing_off_rule=3` and `verified_without_review` as expected. Afterwards the database showed no new trigger, function or view. `pnpm --filter web test`: 1058 pass, 0 fail (5 new). The sync test was mutation-checked: removing one id from the migration made it fail.

**Not tested here:** the real admin approval click-through (an admin session with the second step) and a real client upload. Both should be tried once after applying.

**Deliberately not written**
- Minimum description length: needs the matching client-side message first (`getDescriptionError` in `@repo/constants`), otherwise landlords would see a raw database error.
- Barangay validity trigger: needs a canonical barangay table in the database and a picker change; today the lists live only in TypeScript.
- Image content hash with a unique index: needs client-side hashing at upload on web and mobile.
- Signed-lease path check: `set_tenancy_signed_lease` already requires the path to start with the tenancy id.
- Amenity conflict pairs: older rows hold both sides.

**To roll back after applying:** `drop trigger` the three triggers, `drop function` the three functions and `drop view private.listing_data_quality`.

**After applying:** add a short bullet to `AGENTS.md` (Supabase Conventions) naming these guards and the `app.allow_unreviewed_verified` opt-in, as the repo rules require.

### K.1 Applied (2026-10-31)

The migration was applied to production through the migration tool and is recorded as `20261031143939 listing_data_guards`. Read back afterwards: the three triggers are enabled (`apartments.guard_apartment_amenities`, `apartments.guard_apartment_verified_flag`, `apartment_images.guard_apartment_image_url`); `private.listing_data_quality` returns `photo_outside_bucket=168, pin_outside_stated_city=2, pricing_off_rule=3, verified_without_review=56`; no client role holds any privilege on the view or the guard functions; row counts and data are unchanged (68 apartments, 220 images, 34 tenancies, 60 live verified, 54 new descriptions). `AGENTS.md` now documents the guards and the `app.allow_unreviewed_verified` opt-in.

Still to try by hand once: an admin approving a pending listing verification, and a landlord adding a photo from web and from mobile.

## L. Follow-up: repeated cover thumbnails on the demo listings (applied 2026-10-31)

**Cause:** the 56 demo listings each own 3 stock photos drawn from a pool of 28, but their cover photos used only 8 of the 28 (one cover on 14 listings, another on 13), so neighboring cards in a browse row repeated the same room.

**Change:** only `apartment_images.is_cover` was rebalanced, among each listing's own three existing photos; no photo was added, removed or edited. Deterministic greedy rebalance (least-used photo first, keep the current cover on ties), simulated first inside a rolled-back block, then applied in one transaction that backed up the 168 affected rows to `private.listing_audit_backup_images_20261031` and aborted on any deviation (28 distinct covers, 42 changed, exactly one cover per listing, nothing but `is_cover` different).

**Result:** distinct covers 8 → 28; the most-shared cover 14 → 3 listings; 42 of 56 listings changed cover; every listing still has exactly one cover; totals unchanged.

**Limit:** 28 photos for 56 listings means each photo still appears on 2–3 listings, so two neighbors in a row can occasionally match. Fully unique thumbnails need more distinct photos. Restore: `update apartment_images i set is_cover = b.is_cover from private.listing_audit_backup_images_20261031 b where i.id = b.id;`

## M. Irene's Housing description corrected (applied 2026-10-31)

The audit (B1, D3) flagged that Irene's Housing's landlord-written description contradicted its own record. On the owner's confirmation that the text was wrong, only the contradicting sentence was corrected: "45-square-meter studio unit. Located on the 12th floor," became "40-square-meter 1-bedroom apartment. Located on the 2nd to 5th floor," (record: Apartment, 1 bedroom, 40 sqm, floor "2nd-5th Floor"). The rest of the landlord's text, including the balcony that the amenities list supports, is unchanged. The row was added to `private.listing_audit_backup_20261031` first; only `description` was written. Restore: `update apartments set description = b.description from private.listing_audit_backup_20261031 b where apartments.id = b.id and b.id = (select id from apartments where name = 'Irene''s Housing');`

Still open for this listing: deposit ₱5,000 and advance ₱20,000 against rent ₱15,000 (outside the 0/1×/2× rule), and Unfurnished with the Bed and Furnished amenities. Both are the landlord's terms to confirm.

## N. Follow-up: demo pins were inside their city but not at their barangay (applied 2026-10-31)

**Found from a user report** (Acacia Family 3BR drawn beside Tonsuya Barangay Hall): the audit checked each pin against its **city** only. A barangay-level scan (OpenStreetMap Nominatim centres, district names only) showed 45 of 62 live pins more than 1 km from their stated barangay, typically 1–5 km, up to 10 km. The demo pins had been set to arbitrary points inside the city.

**Change:** 35 demo listings (stock-photo listings only) moved to their barangay's geocoded centre. Where two listings share a barangay, each sits on a 160 m ring around the centre so no pins stack (closest pair is at least 50 m apart; zero identical coordinates). Applied in one transaction that aborted on: a count other than 35, any pin failing `validate_camanava_location`, identical pins, pins closer than 50 m, or any non-coordinate field differing from a snapshot taken inside the transaction. Previous coordinates: `private.listing_audit_backup_pins_20261031`. Restore: `update apartments a set latitude = k.latitude, longitude = k.longitude from private.listing_audit_backup_pins_20261031 k where a.id = k.id;`

**Left alone**
- 4 demo listings whose real barangay location the app's simplified city polygon rejects: Tinajeros Studio Condo, Potrero Urban Loft Studio, Bagbaguin Premium 2BR, Tanong Industrial 2BR (plus Tala Riverside 2BR, same cause). Fixing needs better boundary data.
- Polo Budget Studio (not a canonical barangay), Ibayo Central Room (Ibayo-Tipas is not a CAMANAVA barangay) and Santolan Heritage 1BR (no geocode).
- All real landlord listings: Charle's, Irene's, Harvey's Villa, Sheldon & Leonard's, Cozy Cove, Villa Quintin. Their landlords must confirm real addresses.

**Caveat:** the new pins are barangay centres, not street addresses. A first-time visitor will see a pin at the centre of the stated barangay, which is accurate to the barangay and no better.

## O. Follow-up: consistent cover thumbnails (applied 2026-10-31)

**Problem:** the cover rebalance in section L spread covers evenly but ignored what kind of photo became the cover, so browse rows and detail pages mixed building exteriors, kitchens, a bare sofa close-up and two photos with people in them.

**Classification of the 28 stock photos** (by looking at them): 17 interiors (living rooms and one bedroom), 5 exteriors (buildings, pool patio), 2 kitchens, 4 unsuitable as covers (bare sofa close-up, bunk bed, a person cooking, a man with a tool).

**Change:** only `apartment_images.is_cover`, among each listing's own three photos. 52 of the 56 demo listings now have an interior as the cover (17 distinct photos, most-shared cover on 5 listings); the 4 listings with no interior of their own get the least-bad option from their own photos (kitchen for Daanghari Family 2BR and Lingunan 2BR, house exterior for Bagong Barrio Garden 2BR, pool-patio exterior kept for Tala Riverside 2BR). No cover shows people. 25 listings changed cover. Simulated first in a rolled-back block, then applied in one transaction that backed up 168 rows to `private.listing_audit_backup_images2_20261031` (state before this change) and aborted on any deviation. Restore: `update apartment_images i set is_cover = b.is_cover from private.listing_audit_backup_images2_20261031 b where i.id = b.id;` (the original pre-rebalance state is in `private.listing_audit_backup_images_20261031`).

**Trade-off:** consistency costs variety. Section L reached 28 distinct covers; this reaches 21, because only 17 of the 28 photos make good covers. The only fix for both is more distinct interior photos. Two of the unsuitable photos (people cooking, man with a tool) still appear inside some listings' galleries as non-cover photos; hiding them would be a further change.

**Untouched:** real landlord listings keep their own photos (for example Villa Quintin Apartment's exterior shot).

### O.1 Gallery photos with people removed (applied 2026-10-31)

Two stock photos show people (a person cooking, a man with a tool) and looked wrong in listing galleries. The database has no per-photo hidden flag, so the 8 gallery rows using them were removed from the 8 demo listings that carried them (3 of the cooking photo, 5 of the other). None was a cover, and no listing was left with fewer than 2 photos. The photos are external stock URLs, so no storage object was touched. The 8 exact rows are in `private.listing_audit_backup_hidden_images_20261031`; the transaction aborted on any count other than 8, on any listing left with under 2 photos or not exactly one cover.

Restore: `insert into apartment_images (id, apartment_id, url, is_cover, created_at, url_thumb) select id, apartment_id, url, is_cover, created_at, url_thumb from private.listing_audit_backup_hidden_images_20261031;`
