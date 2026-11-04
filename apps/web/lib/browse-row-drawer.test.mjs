import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compile } from "./test-support/hook-runtime.mjs";

const shared = compile("../../packages/utils/src/browseRows.ts", {});
const browseQuery = compile("app/browse/lib/browse-query.ts", {});
const { toDrawerRow } = compile(
  "app/browse/lib/browse-row-drawer.ts",
  { "@repo/utils": shared, "./browse-query": browseQuery },
  { URLSearchParams },
);

const plain = (value) => JSON.parse(JSON.stringify(value));
const row = (id, prefs, includeCore = true) =>
  [...shared.buildPersonalizedRowSpecs(prefs ?? null), ...shared.buildFillerRowSpecs(prefs ?? null, { includeCore })].find((spec) => spec.id === id);
const prefs = (overrides = {}) => ({
  selectedCities: [],
  budgetMin: 5000,
  budgetMax: 100000,
  bedroomCount: null,
  householdSize: null,
  hasPets: false,
  hasParking: false,
  hasSmoker: false,
  hasDisability: false,
  ...overrides,
});

test("the drawer price cap mirrors browse-query.ts", () => {
  const source = readFileSync(new URL("../app/browse/lib/browse-query.ts", import.meta.url), "utf8");
  assert.match(source, /export const MAX_BUDGET = 50000;/);
  assert.equal(browseQuery.MAX_BUDGET, 50000);
});

test("cities, flags and amenities use the filter-drawer vocabulary", () => {
  const gated = prefs({ selectedCities: ["Caloocan", "Valenzuela"], hasPets: true });
  assert.deepEqual(plain(toDrawerRow(row("city:Caloocan", gated)).params), { locations: "Caloocan" });
  const pets = toDrawerRow(row("pets", gated));
  assert.deepEqual(plain(pets.params), { locations: "Caloocan,Valenzuela", amenities: "petfriendly" });
  assert.equal(pets.seeAllQuery, "locations=Caloocan%2CValenzuela&amenities=petfriendly");
  assert.deepEqual(plain(toDrawerRow(row("verified", null)).params), { verified: "1" });
  assert.deepEqual(plain(toDrawerRow(row("studio", null)).params), { apt_types: "Studio" });
  assert.deepEqual(plain(toDrawerRow(row("spacious", null)).params), { size_min: "60" });
  assert.deepEqual(plain(toDrawerRow(row("furnished", null)).params), { furnishing: "Fully Furnished" });
});

test("prices ride as exact bounds, never through params the drawer would clamp", () => {
  const budget = toDrawerRow(row("budget", prefs({ budgetMin: 15000, budgetMax: 29999 })));
  assert.deepEqual(plain(budget.params), {});
  assert.deepEqual(plain(budget.priceRange), { min: 15000, max: 29999 });
  assert.equal(budget.seeAllQuery, "price_min=15000&price_max=29999");
  const under = toDrawerRow(row("under_10k", null));
  assert.deepEqual(plain(under.priceRange), { min: 0, max: 10000 });
  assert.equal(under.seeAllQuery, "price_max=10000");
});

test("a saved budget max the drawer would drop has no See All; the top of the range does", () => {
  const budget = (budgetMin, budgetMax) => toDrawerRow(row("budget", prefs({ budgetMin, budgetMax })));
  assert.deepEqual(plain(budget(30000, 59999).priceRange), { min: 30000, max: 59999 });
  assert.equal(budget(30000, 59999).seeAllQuery, null);
  assert.equal(budget(30000, 50000).seeAllQuery, null);
  assert.ok(budget(60000, 100000).seeAllQuery);
});

test("bedroom ranges ride beside params; only 4+ has a See All twin", () => {
  const bedrooms = (bedroomCount) => toDrawerRow(row("bedrooms", prefs({ bedroomCount })));
  assert.deepEqual(plain(bedrooms("1-2 Bedrooms").bedroomRange), { min: 1, max: 2 });
  assert.equal(bedrooms("1-2 Bedrooms").seeAllQuery, null);
  assert.deepEqual(plain(bedrooms("4+ Bedrooms").bedroomRange), { min: 4, max: null });
  assert.equal(bedrooms("4+ Bedrooms").seeAllQuery, "bedrooms=4%2B");
  assert.deepEqual(plain(toDrawerRow(row("family", null)).bedroomRange), { min: 3, max: null });
  assert.equal(toDrawerRow(row("family", null)).seeAllQuery, null);
});

test("Top Rated has no See All that would not match its rows", () => {
  const topRated = toDrawerRow(row("top_rated", null));
  assert.equal(topRated.minRating, 4.5);
  assert.equal(topRated.seeAllQuery, null);
});

test("a See All link never points at the bare default page", () => {
  for (const spec of shared.buildFillerRowSpecs(null, { includeCore: true })) {
    assert.notEqual(toDrawerRow(spec).seeAllQuery, "", spec.id);
  }
  assert.equal(toDrawerRow(row("newest", null)).seeAllQuery, null);
  assert.equal(toDrawerRow(row("newest", prefs({ selectedCities: ["Caloocan"] }))).seeAllQuery, "locations=Caloocan");
});
