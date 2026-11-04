import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as scoring from "./recommendations.ts";
import * as preferences from "./tenant-preferences.ts";
import { browsePreviewPosition } from "./browse-preview-position.ts";
import { applyBrowseFilters } from "../app/browse/lib/browse-query.ts";

const prefs = (values = {}) => ({ ...preferences.DEFAULT_TENANT_PREFERENCES, budgetMin: 8000, budgetMax: 12000, ...values });
const listing = (values = {}) => ({ id: "one", city: "Caloocan", monthly_rent: 10000, no_bedrooms: 2, amenities: [], ...values });
const reasons = (row, values) => scoring.recommendationReasons(listing(row), prefs(values));

test("explanations use inclusive saved budget bounds, never near-miss scoring or missing/default-filled values", () => {
  for (const rent of [8000, 10000, 12000]) assert.ok(reasons({ monthly_rent: rent }).includes("Within budget"));
  for (const rent of [7999, 12001, 16000, null, undefined, NaN, Infinity, 0, -1]) assert.ok(!reasons({ monthly_rent: rent }).includes("Within budget"));
  for (const saved of [null, {}, { budgetMin: 8000 }, { budgetMax: 12000 }, { budgetMin: 15000, budgetMax: 5000 }, { budgetMin: NaN, budgetMax: Infinity }]) {
    assert.deepEqual(scoring.recommendationReasons(listing(), saved), []);
  }
});

test("city matches normalize case and spacing, require whole names, and support multiple preferred cities", () => {
  const saved = { selectedCities: [" Malabon ", " caloocan "] };
  assert.ok(reasons({ city: "CALOOCAN" }, saved).includes("Preferred city"));
  assert.ok(reasons({ city: "Malabon" }, saved).includes("Preferred city"));
  for (const city of [null, undefined, "", " ", "Navotas", "Caloocan Heights"]) {
    assert.ok(!reasons({ city }, saved).includes("Preferred city"));
    assert.equal(scoring.scoreListing(listing({ city }), prefs(saved)), 0);
  }
  assert.ok(scoring.scoreListing(listing({ city: "CALOOCAN " }), prefs(saved)) > 0);
});

test("bedroom explanations require an exact integer in the preferred range, not partial ranking credit", () => {
  for (const [preference, accepted] of [["1-2 Bedrooms", [1, 2]], ["2-4 Bedrooms", [2, 3, 4]], ["4+ Bedrooms", [4, 5, 6]]]) {
    for (const count of [null, undefined, 0, 1, 2, 3, 4, 5, 6, 2.5, NaN]) {
      assert.equal(reasons({ monthly_rent: null, no_bedrooms: count }, { bedroomCount: preference }).includes("Bedroom match"), accepted.includes(count));
    }
  }
  assert.deepEqual(reasons({ monthly_rent: null }, { bedroomCount: "Any" }), []);
});

test("parking and pet reasons need both explicit preferences and confirmed amenity IDs", () => {
  const wanted = { hasParking: true, hasPets: true };
  assert.deepEqual(reasons({ monthly_rent: null, amenities: ["parking", "petfriendly"] }, wanted), ["Pet-friendly", "Parking available"]);
  for (const amenities of [null, undefined, [], ["parkroad"], ["motorbikeparking"], ["covered_parking"], ["pet-friendly"], ["smoking"]]) {
    assert.deepEqual(reasons({ monthly_rent: null, amenities }, wanted), []);
  }
  assert.deepEqual(reasons({ monthly_rent: null, amenities: ["parking", "petfriendly"] }), []);
  assert.deepEqual(scoring.recommendationReasons({ id: "missing" }, prefs(wanted)), []);
});

test("at most two unique reasons, stable city/budget/bedroom/pets/parking priority; no implication of full suitability", () => {
  const row = listing({ amenities: ["petfriendly", "parking", "parking"] });
  const saved = prefs({ selectedCities: ["Caloocan"], bedroomCount: "1-2 Bedrooms", hasPets: true, hasParking: true });
  for (let i = 0; i < 5; i++) assert.deepEqual(scoring.recommendationReasons(row, saved), ["Preferred city", "Within budget"]);
  assert.deepEqual(scoring.recommendationReasons({ ...row, monthly_rent: 13000 }, saved), ["Preferred city", "Bedroom match"]);
  assert.deepEqual(scoring.recommendationReasons({ ...row, no_bedrooms: 4 }, saved), ["Preferred city", "Within budget"]);
});

function buildSection() {
  const code = ts.transpileModule(readFileSync(new URL("../app/browse/lib/fetch-recommended.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, console, require: (name) => {
    if (name === "@/lib/recommendations") return scoring;
    if (name === "@/lib/tenant-preferences") return preferences;
    throw new Error(`Unexpected runtime dependency ${name}`);
  } };
  vm.runInNewContext(code, context);
  return context.exports.buildRecommendedSection;
}

test("recommendations carry reasons separately from generic cards; updates recompute ranking and reasons with no stale cache", () => {
  const build = buildSection();
  const apartment = { id: "one", name: "One", city: "Caloocan", price: 10000, bedrooms: 4, amenities: [], rating: 4 };
  const first = build([apartment], prefs({ selectedCities: ["Caloocan"], bedroomCount: "1-2 Bedrooms" }));
  assert.deepEqual(Array.from(first.recommendationReasons.one), ["Preferred city", "Within budget"]);
  assert.equal(first.recommendationStatus, "ready");
  assert.equal(apartment.recommendationReasons, undefined);

  const outsideCity = build([apartment], prefs({ selectedCities: ["Malabon"] }));
  assert.equal(outsideCity.apartments.length, 0);
  assert.equal(outsideCity.recommendationStatus, "empty", "out-of-city listings are not replacements");

  const overBudget = build([apartment], prefs({ budgetMax: 9000, bedroomCount: "4+ Bedrooms" }));
  assert.equal(overBudget.apartments.length, 0);
  assert.equal(overBudget.recommendationStatus, "empty", "over-budget listings are not replacements");

  // An eligible bedroom mismatch still appears, ranked lower, with no chip.
  const mismatch = build([apartment], prefs({ bedroomCount: "1-2 Bedrooms" }));
  assert.equal(mismatch.recommendationStatus, "ready");
  assert.deepEqual(Array.from(mismatch.recommendationReasons.one), ["Within budget"]);

  const next = build([apartment], prefs({ bedroomCount: "4+ Bedrooms" }));
  assert.deepEqual(Array.from(next.recommendationReasons.one), ["Within budget", "Bedroom match"]);
  const bedroomOnly = build([apartment], { selectedCities: [], bedroomCount: "4+ Bedrooms" });
  assert.deepEqual(Array.from(bedroomOnly.recommendationReasons.one), ["Bedroom match"]);

  assert.equal(build([apartment], null), null);
  assert.equal(build([apartment], {}), null);
  assert.equal(build([apartment], preferences.DEFAULT_TENANT_PREFERENCES), null);
  const incomplete = build([apartment], { selectedCities: ["Caloocan"] });
  assert.deepEqual(Array.from(incomplete.recommendationReasons.one), ["Preferred city"], "parser's default budget is not evidence of a saved budget");
  const malformed = build([apartment], { selectedCities: [], hasPets: "false", hasParking: "true" });
  assert.equal(malformed, null, "truthy malformed values are not affirmative preferences");

  const empty = build([], prefs());
  assert.equal(empty.recommendationStatus, "empty");
  assert.equal(empty.apartments.length, 0);
});

test("preview geometry respects sidebar/content bounds, both viewport edges and measured height, including short/narrow screens", () => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 500 }, { width: 390, height: 844 }, { width: 320, height: 240 }]) {
    const bounds = { left: viewport.width > 700 ? 280 : 16, right: viewport.width - 16 };
    for (const left of [bounds.left, viewport.width - 180]) {
      for (const top of [0, viewport.height - 60]) {
        for (const height of [310, 450, 900]) {
          const result = browsePreviewPosition({ left, top, width: 176, height: 300, bounds }, viewport, height);
          assert.ok(result.left >= bounds.left);
          assert.ok(result.left + result.width <= bounds.right);
          assert.ok(result.top >= 8);
          assert.ok(result.top + Math.min(height, result.maxHeight) <= viewport.height - 8);
          assert.ok(result.width <= 320);
        }
      }
    }
  }
});

test("search genuinely includes apartment name, city and barangay without replacing other filters", () => {
  const calls = [];
  const query = { or(value) { calls.push(value); return this; }, in() { return this; } };
  assert.equal(applyBrowseFilters(query, { search: "Malabon", locations: "Caloocan" }), query);
  assert.equal(calls[0], "name.ilike.%Malabon%,city.ilike.%Malabon%,barangay.ilike.%Malabon%");
  const source = readFileSync(new URL("../app/browse/components/SearchContainer.tsx", import.meta.url), "utf8");
  assert.match(source, /placeholder="Search by apartment name, city, or barangay\.\.\."/);
});
