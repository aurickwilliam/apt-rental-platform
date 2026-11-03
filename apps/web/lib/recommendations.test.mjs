import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  buildFillerRowSpecs,
  buildPersonalizedRowSpecs,
  MIN_BROWSE_ROWS,
  selectBrowseRows,
  hasMeaningfulPreferences,
  rankCandidates,
  RECOMMENDATION_DEFAULT_BUDGET_MAX,
  RECOMMENDATION_DEFAULT_BUDGET_MIN,
  RECOMMENDATION_LIMIT,
  scoreListing,
} from "./recommendations.ts";
import {
  DEFAULT_TENANT_PREFERENCES,
  PREFERENCE_BUDGET_MAX,
  PREFERENCE_BUDGET_MIN,
  parseTenantPreferences,
} from "./tenant-preferences.ts";

test("every Browse row holds 15 apartments, fixed rows included", () => {
  assert.equal(RECOMMENDATION_LIMIT, 15);
  const fixed = readFileSync(new URL("../app/browse/lib/fetch-browse-sections.ts", import.meta.url), "utf8");
  assert.match(fixed, /const SECTION_LIMIT = 15;/);
});

test("default budget constants match the shared preferences contract", () => {
  assert.equal(RECOMMENDATION_DEFAULT_BUDGET_MIN, PREFERENCE_BUDGET_MIN);
  assert.equal(RECOMMENDATION_DEFAULT_BUDGET_MAX, PREFERENCE_BUDGET_MAX);
});

function prefs(overrides = {}) {
  return { ...DEFAULT_TENANT_PREFERENCES, ...overrides };
}

function listing(overrides = {}) {
  return {
    id: "apt-1",
    city: "Caloocan",
    monthly_rent: 10000,
    no_bedrooms: 2,
    amenities: [],
    is_verified: false,
    average_rating: 4.0,
    ...overrides,
  };
}

test("exact budget match outranks out-of-range, near miss gets partial", () => {
  const p = prefs({ selectedCities: [], budgetMin: 5000, budgetMax: 14999 });
  const inside = scoreListing(listing({ monthly_rent: 10000 }), p);
  const near = scoreListing(listing({ monthly_rent: 17000 }), p);
  const far = scoreListing(listing({ monthly_rent: 40000 }), p);
  assert.ok(inside > near, `inside (${inside}) should beat near (${near})`);
  assert.ok(near > far, `near (${near}) should beat far (${far})`);
});

test("near-miss boundary is strict (<5000)", () => {
  const p = prefs({ selectedCities: [], budgetMin: 5000, budgetMax: 14999 });
  const justInside = scoreListing(listing({ monthly_rent: 19998 }), p);
  const exactly5000Away = scoreListing(listing({ monthly_rent: 19999 }), p);
  assert.ok(justInside > exactly5000Away);
});

test("selected-city mismatch excludes, multiple cities supported", () => {
  const p = prefs({ selectedCities: ["Caloocan"] });
  assert.equal(scoreListing(listing({ city: "Malabon" }), p), 0);
  assert.ok(scoreListing(listing({ city: "Caloocan" }), p) > 0);
  const multi = prefs({ selectedCities: ["Caloocan", "Malabon"] });
  assert.ok(scoreListing(listing({ city: "Malabon" }), multi) > 0);
  assert.equal(scoreListing(listing({ city: "Navotas" }), multi), 0);
});

test("no selected cities gives the mild baseline instead of exclusion", () => {
  const p = prefs({ selectedCities: [] });
  assert.ok(scoreListing(listing({ city: "Navotas" }), p) > 0);
});

test("bedroom scoring mirrors mobile", () => {
  const oneTwo = prefs({ selectedCities: [], bedroomCount: "1-2 Bedrooms" });
  assert.ok(
    scoreListing(listing({ no_bedrooms: 2 }), oneTwo) >
      scoreListing(listing({ no_bedrooms: 3 }), oneTwo),
  );
  assert.ok(
    scoreListing(listing({ no_bedrooms: 3 }), oneTwo) >
      scoreListing(listing({ no_bedrooms: 5 }), oneTwo),
  );
  const fourPlus = prefs({ selectedCities: [], bedroomCount: "4+ Bedrooms" });
  assert.ok(
    scoreListing(listing({ no_bedrooms: 4 }), fourPlus) >
      scoreListing(listing({ no_bedrooms: 3 }), fourPlus),
  );
  const none = prefs({ selectedCities: [], bedroomCount: null });
  assert.equal(
    scoreListing(listing({ no_bedrooms: 1 }), none),
    scoreListing(listing({ no_bedrooms: 5 }), none),
  );
});

test("supported amenity identifiers score; wheelchair is ignored", () => {
  const pets = prefs({ selectedCities: [], hasPets: true });
  assert.ok(
    scoreListing(listing({ amenities: ["petfriendly"] }), pets) >
      scoreListing(listing({ amenities: [] }), pets),
  );
  // penalty path: pet want with no pet-friendly amenity
  assert.ok(scoreListing(listing({ amenities: [] }), pets) < scoreListing(listing({ amenities: [] }), prefs({ selectedCities: [] })));

  const parking = prefs({ selectedCities: [], hasParking: true });
  assert.ok(
    scoreListing(listing({ amenities: ["parking"] }), parking) >
      scoreListing(listing({ amenities: [] }), parking),
  );

  const smoker = prefs({ selectedCities: [], hasSmoker: true });
  assert.ok(
    scoreListing(listing({ amenities: ["nonsmoking"] }), smoker) >
      scoreListing(listing({ amenities: [] }), smoker),
  );

  // No web wheelchair identifier: disability preference must not change score.
  const access = prefs({ selectedCities: [], hasDisability: true });
  const base = prefs({ selectedCities: [] });
  assert.equal(
    scoreListing(listing({ amenities: ["wheelchair"] }), access),
    scoreListing(listing({ amenities: ["wheelchair"] }), base),
  );
  assert.equal(
    scoreListing(listing({ amenities: [] }), access),
    scoreListing(listing({ amenities: [] }), base),
  );
});

test("verified apartments rank higher, all else equal", () => {
  const p = prefs({ selectedCities: [] });
  assert.ok(
    scoreListing(listing({ is_verified: true }), p) >
      scoreListing(listing({ is_verified: false }), p),
  );
});

test("missing listing attributes do not throw", () => {
  const p = prefs({ selectedCities: ["Caloocan"], bedroomCount: "1-2 Bedrooms", hasPets: true });
  assert.doesNotThrow(() =>
    scoreListing({ id: "bare" }, p),
  );
  assert.doesNotThrow(() =>
    scoreListing({ id: "nulls", city: null, monthly_rent: null, no_bedrooms: null, amenities: null, is_verified: null, average_rating: null }, p),
  );
});

test("default/empty preferences are not meaningful", () => {
  assert.equal(hasMeaningfulPreferences(null), false);
  assert.equal(hasMeaningfulPreferences(undefined), false);
  assert.equal(hasMeaningfulPreferences({ ...DEFAULT_TENANT_PREFERENCES }), false);
  assert.equal(hasMeaningfulPreferences(prefs({ budgetMin: 5000, budgetMax: 20000 })), true);
  assert.equal(hasMeaningfulPreferences(prefs({ selectedCities: ["Caloocan"] })), true);
  assert.equal(hasMeaningfulPreferences(prefs({ bedroomCount: "1-2 Bedrooms" })), true);
  assert.equal(hasMeaningfulPreferences(prefs({ hasPets: true, kindOfPets: ["Dog"] })), true);
});

test("mobile-saved preferences parse and score on web", () => {
  const parsed = parseTenantPreferences({
    selectedCities: ["Caloocan"],
    budgetMin: 5000,
    budgetMax: 14999,
    bedroomCount: "1-2 Bedrooms",
    householdSize: "Family of 2",
    hasPets: false,
    kindOfPets: [],
    noOfPets: 1,
    nameOfPets: null,
    hasParking: false,
    noOfParkingSpots: 1,
    listOfVehicles: [],
    hasSmoker: false,
    hasDisability: false,
  });
  assert.ok(parsed);
  assert.equal(hasMeaningfulPreferences(parsed), true);
  assert.ok(
    scoreListing(listing({ city: "Caloocan", monthly_rent: 10000, no_bedrooms: 2 }), parsed) >
      scoreListing(listing({ city: "Malabon", monthly_rent: 10000, no_bedrooms: 2 }), parsed),
  );
});

test("ranking is score desc, rating desc, id asc; bounded and deduped", () => {
  const p = prefs({ selectedCities: [] });
  const a = listing({ id: "b", average_rating: 4.0 });
  const b = listing({ id: "a", average_rating: 4.0 });
  const [first, second] = rankCandidates([a, b], p, 8);
  assert.equal(first.candidate.id, "a");
  assert.equal(second.candidate.id, "b");

  const highRated = listing({ id: "hi", average_rating: 5.0, is_verified: true });
  const lowRated = listing({ id: "lo", average_rating: 1.0 });
  const ranked = rankCandidates([lowRated, highRated], p, 8);
  assert.equal(ranked[0].candidate.id, "hi");

  const many = Array.from({ length: 20 }, (_, i) =>
    listing({ id: `apt-${String(i).padStart(2, "0")}` }),
  );
  assert.equal(rankCandidates(many, p, 8).length, 8);
  assert.equal(rankCandidates(many, p).length, RECOMMENDATION_LIMIT);

  const dupes = [listing({ id: "x" }), listing({ id: "x" })];
  assert.equal(rankCandidates(dupes, p, 8).length, 1);

  const excluded = rankCandidates([listing({ id: "y", city: "Malabon" })], prefs({ selectedCities: ["Caloocan"] }), 8);
  assert.equal(excluded.length, 0);
});

test("skipped or empty preferences build no personalized rows", () => {
  assert.deepEqual(buildPersonalizedRowSpecs(null), []);
  assert.deepEqual(buildPersonalizedRowSpecs(undefined), []);
  assert.deepEqual(buildPersonalizedRowSpecs({ ...DEFAULT_TENANT_PREFERENCES }), []);
});

test("one row per answered preference, in display order", () => {
  const rows = buildPersonalizedRowSpecs(
    prefs({
      selectedCities: ["Caloocan", "Malabon"],
      budgetMin: 15000,
      budgetMax: 29999,
      bedroomCount: "2-4 Bedrooms",
      hasPets: true,
      hasParking: true,
    }),
  );
  assert.deepEqual(
    rows.map((row) => row.id),
    ["city:Caloocan", "city:Malabon", "budget", "bedrooms", "pets", "parking"],
  );
  assert.equal(rows[0].title, "Apartments in Caloocan");
  assert.deepEqual(rows[0].params, { locations: "Caloocan" });
});

test("chosen cities gate every non-city row; no cities leaves them open", () => {
  const gated = buildPersonalizedRowSpecs(
    prefs({ selectedCities: ["Caloocan", "Malabon"], hasPets: true, bedroomCount: "4+ Bedrooms" }),
  );
  for (const id of ["pets", "bedrooms"]) {
    const row = gated.find((r) => r.id === id);
    assert.equal(row.params.locations, "Caloocan,Malabon");
    assert.match(row.seeAllQuery ?? "locations=Caloocan%2CMalabon", /locations=Caloocan%2CMalabon/);
  }
  const open = buildPersonalizedRowSpecs(prefs({ hasParking: true }));
  assert.deepEqual(open.map((row) => row.id), ["parking"]);
  assert.deepEqual(open[0].params, { amenities: "parking" });
});

test("a default budget builds no budget row; a chosen one reuses the filter-drawer params", () => {
  const none = buildPersonalizedRowSpecs(prefs({ selectedCities: ["Caloocan"] }));
  assert.ok(!none.some((row) => row.id === "budget"));
  const [budget] = buildPersonalizedRowSpecs(prefs({ budgetMin: 15000, budgetMax: 29999 }));
  assert.equal(budget.id, "budget");
  assert.deepEqual(budget.params, { price_min: "15000", price_max: "29999" });
  assert.equal(budget.seeAllQuery, "price_min=15000&price_max=29999");
  assert.equal(budget.subtitle, "₱15,000 – ₱29,999 a month.");
});

test("bedroom rows keep the saved range; only 4+ has a See All twin", () => {
  const range = (bedroomCount) =>
    buildPersonalizedRowSpecs(prefs({ bedroomCount })).find((row) => row.id === "bedrooms");
  assert.deepEqual(range("1-2 Bedrooms").bedroomRange, { min: 1, max: 2 });
  assert.deepEqual(range("2-4 Bedrooms").bedroomRange, { min: 2, max: 4 });
  assert.deepEqual(range("4+ Bedrooms").bedroomRange, { min: 4, max: null });
  assert.equal(range("1-2 Bedrooms").seeAllQuery, null);
  assert.equal(range("4+ Bedrooms").seeAllQuery, "bedrooms=4%2B");
  assert.equal(range("1-2 Bedrooms").title, "1-2 Bedrooms");
});

test("an unknown saved bedroom option builds no bedroom row", () => {
  const rows = buildPersonalizedRowSpecs(prefs({ bedroomCount: "Penthouse", hasPets: true }));
  assert.ok(!rows.some((row) => row.id === "bedrooms"));
});

test("pet and parking rows use the web amenity identifiers", () => {
  const rows = buildPersonalizedRowSpecs(prefs({ hasPets: true, hasParking: true }));
  assert.equal(rows.find((row) => row.id === "pets").params.amenities, "petfriendly");
  assert.equal(rows.find((row) => row.id === "parking").params.amenities, "parking");
});

test("Browse tries personalized rows first and falls back to the fixed rows", () => {
  const source = readFileSync(new URL("../app/browse/components/BrowseDiscoveryContent.tsx", import.meta.url), "utf8");
  const personalized = source.indexOf("await fetchPersonalizedSections(supabase, preferences, basePath)");
  const fixed = source.indexOf("await fetchDiscoverySections(supabase, basePath)");
  assert.ok(personalized > -1 && fixed > personalized);
  assert.match(source, /isPersonalized\s*\?\s*personalized/);
  assert.match(source, /fillBrowseSections\(supabase, base, isPersonalized \? preferences : null/);
});

test("the default page holds at least 9 rows", () => {
  assert.equal(MIN_BROWSE_ROWS, 9);
});

const ids = (rows) => rows.map((row) => row.id);

test("filler gives enough distinct rows to reach the minimum from one personal row", () => {
  const filler = buildFillerRowSpecs(prefs({ hasDisability: true }), { includeCore: true });
  assert.equal(new Set(ids(filler)).size, filler.length, "filler ids are unique");
  assert.ok(1 + filler.length >= MIN_BROWSE_ROWS);
});

test("without core rows the filler is the extras the fixed rows lack", () => {
  const extras = buildFillerRowSpecs(null, { includeCore: false });
  assert.deepEqual(ids(extras), ["family", "furnished", "pets", "parking", "mid_range"]);
  assert.equal(6 + 3 <= 6 + extras.length, true, "six fixed rows plus extras reach 9");
});

test("chosen cities gate every filler row; no cities leaves them open", () => {
  const gated = buildFillerRowSpecs(prefs({ selectedCities: ["Caloocan", "Valenzuela"] }), { includeCore: true });
  for (const row of gated) assert.equal(row.params.locations, "Caloocan,Valenzuela", row.id);
  const open = buildFillerRowSpecs(null, { includeCore: true });
  for (const row of open) assert.equal(row.params.locations, undefined, row.id);
});

test("a See All link never points at the bare default page", () => {
  for (const row of buildFillerRowSpecs(null, { includeCore: true })) {
    assert.notEqual(row.seeAllQuery, "", row.id);
  }
  const newest = buildFillerRowSpecs(null, { includeCore: true }).find((row) => row.id === "newest");
  assert.equal(newest.seeAllQuery, null);
  const gated = buildFillerRowSpecs(prefs({ selectedCities: ["Caloocan"] }), { includeCore: true });
  assert.equal(gated.find((row) => row.id === "newest").seeAllQuery, "locations=Caloocan");
});

test("filler rows keep the filter-drawer vocabulary", () => {
  const rows = Object.fromEntries(buildFillerRowSpecs(null, { includeCore: true }).map((row) => [row.id, row]));
  assert.equal(rows.top_rated.minRating, 4.5);
  assert.deepEqual(rows.verified.params, { verified: "1" });
  assert.deepEqual(rows.under_10k.params, { price_max: "10000" });
  assert.deepEqual(rows.studio.params, { apt_types: "Studio" });
  assert.deepEqual(rows.spacious.params, { size_min: "60" });
  assert.deepEqual(rows.furnished.params, { furnishing: "Fully Furnished" });
  assert.deepEqual(rows.family.bedroomRange, { min: 3, max: null });
});

test("selectBrowseRows keeps every base row, skips duplicates and stops at the minimum", () => {
  const row = (id) => ({ id });
  const base = [row("for_you"), row("pets")];
  const filler = ["top_rated", "pets", "verified", "newest", "under_10k", "studio", "spacious", "family", "furnished", "parking"].map(row);
  const result = selectBrowseRows(base, filler);
  assert.equal(result.length, 9);
  assert.deepEqual(ids(result).slice(0, 2), ["for_you", "pets"]);
  assert.equal(new Set(ids(result)).size, 9);

  const many = Array.from({ length: 12 }, (_, i) => row(`personal-${i}`));
  assert.equal(selectBrowseRows(many, filler).length, 12, "base rows are never trimmed");
  assert.deepEqual(ids(selectBrowseRows([], [row("a")])), ["a"], "fewer rows than the minimum when nothing more exists");
});

test("both Browse pages pad their rows to the minimum", () => {
  const tenant = readFileSync(new URL("../app/browse/components/BrowseDiscoveryContent.tsx", import.meta.url), "utf8");
  const publicPage = readFileSync(new URL("../app/browse/page.tsx", import.meta.url), "utf8");
  assert.match(tenant, /fillBrowseSections\(/);
  assert.match(publicPage, /fillBrowseSections\(supabase, fixedSections, null, \{ includeCore: false \}\)/);
});
