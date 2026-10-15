import assert from "node:assert/strict";
import { test } from "node:test";
import {
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
  assert.equal(hasMeaningfulPreferences(prefs({ hasPets: true, kindOfPets: "Dog" })), true);
});

test("mobile-saved preferences parse and score on web", () => {
  const parsed = parseTenantPreferences({
    selectedCities: ["Caloocan"],
    budgetMin: 5000,
    budgetMax: 14999,
    bedroomCount: "1-2 Bedrooms",
    householdSize: "Family of 2",
    hasPets: false,
    kindOfPets: "",
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
