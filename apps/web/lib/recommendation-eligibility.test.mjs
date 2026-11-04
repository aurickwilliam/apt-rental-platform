import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as scoring from "./recommendations.ts";

const prefs = (values = {}) => ({ selectedCities: [], ...values });
const listing = (values = {}) => ({
  id: "apt-1",
  city: "Caloocan",
  monthly_rent: 10000,
  no_bedrooms: 2,
  max_occupants: null,
  amenities: [],
  status: "available",
  ...values,
});

function fakeClient({ rows = [], error = null } = {}) {
  const calls = [];
  const builder = {};
  for (const method of ["is", "eq", "in", "gt", "gte", "lte", "or"]) {
    builder[method] = (...args) => {
      calls.push([method, ...args]);
      return builder;
    };
  }
  builder.order = (column, options = {}) => {
    calls.push(["order", column, options]);
    return builder;
  };
  builder.limit = (count, options = {}) => {
    calls.push(["limit", count, options]);
    return builder;
  };
  builder.abortSignal = (signal) => {
    calls.push(["abortSignal", Boolean(signal)]);
    return builder;
  };
  builder.then = (resolve, reject) =>
    Promise.resolve({ data: rows, error }).then(resolve, reject);

  const client = {
    from(table) {
      calls.push(["from", table]);
      return {
        select(columns) {
          calls.push(["select", columns]);
          return builder;
        },
      };
    },
  };
  return { client, calls };
}

function loadRecommendationModule() {
  const code = ts.transpileModule(
    readFileSync(new URL("../app/browse/lib/fetch-recommended.ts", import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  const context = {
    exports: {},
    console,
    require: (name) => {
      if (name === "@/lib/recommendations") return scoring;
      throw new Error(`Unexpected runtime dependency ${name}`);
    },
  };
  vm.runInNewContext(code, context);
  return context.exports;
}

test("saved budget boundaries are inclusive and the default range stays unrestricted", () => {
  const p = prefs({ budgetMin: 5000, budgetMax: 14999 });
  for (const rent of [5000, 7500, 14999]) {
    assert.equal(scoring.isRecommendationEligible(listing({ monthly_rent: rent }), p), true);
  }
  for (const rent of [4999, 15000, 16000, 22000, 45000, 65000]) {
    assert.equal(scoring.isRecommendationEligible(listing({ monthly_rent: rent }), p), false);
  }

  for (const monthly_rent of [null, undefined, NaN, Infinity, 0, -1]) {
    assert.equal(scoring.isRecommendationEligible(listing({ monthly_rent }), p), false);
  }

  assert.deepEqual(scoring.recommendationBudget(prefs()), { status: "unset" });
  assert.equal(scoring.hasMeaningfulPreferences(prefs()), false);
  assert.equal(
    scoring.isRecommendationEligible(listing({ monthly_rent: 65000 }), prefs()),
    true,
    "the full default range is not an artificial cap",
  );
  assert.deepEqual(
    scoring.recommendationBudget({ budgetMin: 8000, budgetMax: 12000 }),
    { status: "configured", min: 8000, max: 12000 },
  );
});

test("partial, malformed and unknown preference data is refused instead of guessed", () => {
  for (const raw of [null, {}, [], { selectedCities: "Caloocan" }]) {
    assert.equal(scoring.parseRecommendationPreferences(raw), null);
  }
  const parsed = scoring.parseRecommendationPreferences({
    selectedCities: ["Caloocan", 42],
    budgetMin: "8000",
    budgetMax: 12000,
    hasPets: "true",
    hasParking: true,
  });
  assert.deepEqual(parsed.selectedCities, ["Caloocan"]);
  assert.equal(Number.isNaN(parsed.budgetMin), true);
  assert.equal(parsed.hasPets, false);
  assert.equal(parsed.hasParking, true);
  assert.equal(scoring.recommendationPreferenceIssue(parsed), "budget");
  assert.equal(scoring.isRecommendationEligible(listing(), parsed), false);

  assert.equal(
    scoring.recommendationPreferenceIssue(prefs({ selectedCities: ["Quezon City"] })),
    "city",
  );
  assert.equal(
    scoring.hasMeaningfulPreferences({ selectedCities: [], bedroomCount: "Any" }),
    false,
    "an unknown bedroom option is not a filter",
  );
});

test("preferred cities use whole normalized names, support multiple cities and ignore barangays", () => {
  const one = prefs({ selectedCities: ["Navotas"] });
  assert.equal(scoring.isRecommendationEligible(listing({ city: "Navotas" }), one), true);
  assert.equal(scoring.isRecommendationEligible(listing({ city: " navotas " }), one), true);
  assert.equal(scoring.isRecommendationEligible(listing({ city: "Caloocan" }), one), false);
  assert.equal(
    scoring.isRecommendationEligible(
      listing({ city: "Caloocan", barangay: "Navotas East" }),
      prefs({ selectedCities: ["Caloocan"] }),
    ),
    true,
    "a barangay name never substitutes for the city",
  );
  assert.equal(
    scoring.isRecommendationEligible(listing({ city: "Caloocan Heights" }), prefs({ selectedCities: ["Caloocan"] })),
    false,
  );

  const multiple = prefs({ selectedCities: ["Caloocan", "Navotas"] });
  assert.equal(scoring.isRecommendationEligible(listing({ city: "Caloocan" }), multiple), true);
  assert.equal(scoring.isRecommendationEligible(listing({ city: "Navotas" }), multiple), true);
  assert.equal(scoring.isRecommendationEligible(listing({ city: "Malabon" }), multiple), false);

  // No city preference means all CAMANAVA cities are eligible (documented fallback).
  assert.equal(scoring.isRecommendationEligible(listing({ city: "Malabon" }), prefs()), true);
});

test("household capacity excludes only provably too-small listings", () => {
  assert.equal(scoring.minimumHouseholdSize("Single"), 1);
  assert.equal(scoring.minimumHouseholdSize("Family of 2"), 2);
  assert.equal(scoring.minimumHouseholdSize("3 - 4 Persons"), 3);
  assert.equal(scoring.minimumHouseholdSize("5 - 6 Persons"), 5);
  assert.equal(scoring.minimumHouseholdSize("7+ Persons"), 7);
  assert.equal(scoring.minimumHouseholdSize("2"), 2);
  assert.equal(scoring.minimumHouseholdSize(null), null);

  const household = prefs({ householdSize: "3 - 4 Persons" });
  assert.equal(scoring.isRecommendationEligible(listing({ max_occupants: 3 }), household), true);
  assert.equal(scoring.isRecommendationEligible(listing({ max_occupants: 4 }), household), true);
  assert.equal(scoring.isRecommendationEligible(listing({ max_occupants: 2 }), household), false);
  assert.equal(scoring.isRecommendationEligible(listing({ max_occupants: null }), household), true);
  assert.equal(scoring.isRecommendationEligible(listing({ max_occupants: 0 }), household), true);
});

test("pet and smoking policies stay truthful with the available listing data", () => {
  const pets = prefs({ hasPets: true });
  assert.equal(scoring.isRecommendationEligible(listing({ amenities: ["petfriendly"] }), pets), true);
  assert.deepEqual(
    scoring.recommendationReasons(listing({ amenities: ["petfriendly"] }), pets),
    ["Pet-friendly"],
  );
  // No explicit pet-ban/species field exists: unknown never becomes a ban.
  assert.equal(scoring.isRecommendationEligible(listing({ amenities: [] }), pets), true);
  assert.deepEqual(scoring.recommendationReasons(listing({ amenities: [] }), pets), []);

  const smoker = prefs({ hasSmoker: true });
  assert.equal(scoring.isRecommendationEligible(listing({ amenities: ["nonsmoking"] }), smoker), false);
  assert.equal(
    scoring.isRecommendationEligible(listing({ amenities: ["smoking", "nonsmoking"] }), smoker),
    false,
  );
  assert.equal(scoring.isRecommendationEligible(listing({ amenities: ["smoking"] }), smoker), true);
  assert.equal(scoring.isRecommendationEligible(listing({ amenities: [] }), smoker), true);
  assert.equal(
    scoring.isRecommendationEligible(listing({ amenities: ["nonsmoking"] }), prefs()),
    true,
    "non-smoking listings remain eligible when no smoker is declared",
  );
});

test("ranking prefers matches but never removes an otherwise eligible optional mismatch", () => {
  const bedroom = prefs({ bedroomCount: "1-2 Bedrooms" });
  const match = listing({ id: "match", no_bedrooms: 2 });
  const mismatch = listing({ id: "mismatch", no_bedrooms: 3 });
  const ranked = scoring.rankCandidates([mismatch, match], bedroom, 8);
  assert.deepEqual(
    ranked.map(({ candidate }) => candidate.id),
    ["match", "mismatch"],
  );
  assert.deepEqual(scoring.recommendationReasons(mismatch, bedroom), []);

  const parking = prefs({ hasParking: true });
  assert.ok(
    scoring.scoreListing(listing({ amenities: ["parking"] }), parking) >
      scoring.scoreListing(listing({ amenities: [] }), parking),
  );

  const pets = prefs({ hasPets: true });
  assert.ok(
    scoring.scoreListing(listing({ amenities: ["petfriendly"] }), pets) >
      scoring.scoreListing(listing({ amenities: [] }), pets),
  );
  // A pets-only mismatch scores lower but must still be recommended.
  const petMismatch = listing({ id: "pet-mismatch", amenities: [] });
  const petMatch = listing({ id: "pet-match", amenities: ["petfriendly"] });
  assert.deepEqual(
    scoring.rankCandidates([petMismatch, petMatch], pets, 8).map(({ candidate }) => candidate.id),
    ["pet-match", "pet-mismatch"],
  );

  const p = prefs();
  const a = listing({ id: "b", average_rating: 4 });
  const b = listing({ id: "a", average_rating: 4 });
  assert.deepEqual(
    scoring.rankCandidates([a, b], p).map(({ candidate }) => candidate.id),
    ["a", "b"],
  );
  assert.equal(
    scoring.rankCandidates([listing({ id: "x" }), listing({ id: "x" })], p).length,
    1,
  );
  assert.equal(
    scoring.rankCandidates([listing({ monthly_rent: 65000 })], prefs({ budgetMin: 5000, budgetMax: 14999 })).length,
    0,
  );
});

test("candidate retrieval filters strictly before the bounded limit and never widens the budget", async () => {
  const { client, calls } = fakeClient();
  await scoring.fetchRecommendationCandidates(
    client,
    prefs({
      selectedCities: ["Navotas", "Caloocan"],
      budgetMin: 5000,
      budgetMax: 14999,
      householdSize: "3 - 4 Persons",
      hasSmoker: true,
    }),
  );

  assert.ok(calls.some(([method]) => method === "from"));
  assert.ok(calls.some(([method, column, value]) => method === "is" && column === "deleted_at" && value === null));
  assert.ok(calls.some(([method, column, value]) => method === "eq" && column === "is_hidden_by_admin" && value === false));
  assert.ok(calls.some(([method, column, values]) => method === "in" && column === "status" && values.includes("available")));
  assert.ok(calls.some(([method, column, value]) => method === "gt" && column === "monthly_rent" && value === 0));
  assert.ok(calls.some(([method, column, value]) => method === "gte" && column === "monthly_rent" && value === 5000));
  assert.ok(calls.some(([method, column, value]) => method === "lte" && column === "monthly_rent" && value === 14999));

  const cityFilter = calls.find(([method, value]) => method === "or" && String(value).includes("city.ilike"));
  assert.ok(cityFilter, "city filter is applied in the query");
  assert.match(String(cityFilter[1]), /city\.ilike\."\*navotas\*"/);
  assert.match(String(cityFilter[1]), /city\.ilike\."\*caloocan\*"/);

  const householdFilter = calls.find(([method, value]) => method === "or" && String(value).includes("max_occupants"));
  assert.ok(householdFilter, "household capacity is filtered in the query");
  assert.match(String(householdFilter[1]), /max_occupants\.is\.null/);
  assert.match(String(householdFilter[1]), /max_occupants\.gte\.3/);

  const smokingFilter = calls.find(([method, value]) => method === "or" && String(value).includes("amenities"));
  assert.ok(smokingFilter, "smoking policy is filtered in the query");
  assert.match(String(smokingFilter[1]), /amenities\.not\.cs\.\{nonsmoking\}/);

  assert.ok(calls.some(([method, count]) => method === "limit" && count === scoring.RECOMMENDATION_CANDIDATE_LIMIT));
  assert.ok(
    calls.some(([method, count, options]) =>
      method === "limit" &&
      count === 1 &&
      options.referencedTable === "apartment_images",
    ),
    "only one card photo is fetched",
  );
  assert.ok(
    calls.some(([method, column, options]) =>
      method === "order" &&
      column === "is_cover" &&
      options.referencedTable === "apartment_images",
    ),
  );
});

test("retrieval re-checks eligibility and maps provider failures to a retryable error", async () => {
  const p = prefs({ budgetMin: 5000, budgetMax: 14999 });
  const overBudget = listing({ id: "over", monthly_rent: 20000 });
  const eligible = listing({ id: "ok", monthly_rent: 10000, average_rating: 4 });
  const { client } = fakeClient({ rows: [overBudget, eligible] });
  assert.deepEqual(
    (await scoring.fetchRecommendationCandidates(client, p)).map((row) => row.id),
    ["ok"],
  );

  await assert.rejects(
    () => scoring.fetchRecommendationCandidates(fakeClient({ error: { message: "boom" } }).client, p),
    /Couldn't load recommendations/,
  );

  const { client: untouched, calls } = fakeClient();
  assert.deepEqual(await scoring.fetchRecommendationCandidates(untouched, prefs()), []);
  assert.deepEqual(await scoring.fetchRecommendationCandidates(untouched, prefs({ budgetMin: 9000 })), []);
  assert.equal(calls.length, 0, "invalid or absent preferences never hit the network");
});

test("recommendation section distinguishes no preferences, empty, ready, invalid and error", async () => {
  const { buildRecommendedSection, loadRecommendedSection } = loadRecommendationModule();
  assert.equal(typeof loadRecommendedSection, "function");
  assert.equal(typeof buildRecommendedSection, "function");

  const saved = prefs({ selectedCities: ["Caloocan"], budgetMin: 5000, budgetMax: 14999 });
  assert.equal(await loadRecommendedSection(fakeClient().client, null), null);
  assert.equal(await loadRecommendedSection(fakeClient().client, prefs()), null);

  const row = {
    id: "one",
    name: "One",
    barangay: "Brgy 1",
    city: "Caloocan",
    monthly_rent: 10000,
    no_bedrooms: 2,
    no_bathrooms: 1,
    area_sqm: 30,
    max_occupants: 4,
    amenities: ["parking"],
    is_verified: true,
    average_rating: 4.5,
    status: "available",
    apartment_images: [
      { url: "full.jpg", url_thumb: "thumb.jpg", is_cover: true },
      { url: "other.jpg", url_thumb: "other-thumb.jpg", is_cover: false },
    ],
  };
  const ready = await loadRecommendedSection(fakeClient({ rows: [row] }).client, saved);
  assert.equal(ready.recommendationStatus, "ready");
  assert.equal(ready.subtitle, "Apartments selected based on your rental preferences.");
  assert.equal(ready.apartments.length, 1);
  assert.equal(ready.apartments[0].image, "thumb.jpg");
  assert.equal(ready.apartments[0].maxOccupants, 4);
  assert.deepEqual(Array.from(ready.recommendationReasons.one), ["Preferred city", "Within budget"]);

  const empty = await loadRecommendedSection(fakeClient({ rows: [] }).client, saved);
  assert.equal(empty.recommendationStatus, "empty");
  assert.equal(empty.apartments.length, 0);

  const invalid = await loadRecommendedSection(
    fakeClient().client,
    prefs({ selectedCities: ["Quezon City"], budgetMin: 5000, budgetMax: 14999 }),
  );
  assert.equal(invalid.recommendationStatus, "invalid");

  const failed = await loadRecommendedSection(
    fakeClient({ error: { message: "network down" } }).client,
    saved,
  );
  assert.equal(failed.recommendationStatus, "error");
  assert.equal(failed.apartments.length, 0);
});
