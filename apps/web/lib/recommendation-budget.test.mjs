import assert from "node:assert/strict";
import test from "node:test";
import { compile, hookRuntime } from "./test-support/hook-runtime.mjs";
import * as preferences from "./tenant-preferences.ts";
import { createListingQueryFixture } from "../tests/browse-cards/listing-query-fixture.mjs";

const shared = compile("../../packages/utils/src/browseRows.ts", {});
const mapper = compile("app/browse/lib/browse-apartment.ts", {});
const query = compile("app/browse/lib/browse-query.ts", {});
const drawer = compile("app/browse/lib/browse-row-drawer.ts", { "@repo/utils": shared, "./browse-query": query }, { URLSearchParams });
const metadata = compile("app/browse/lib/recommended-section.ts", {});
const personalized = compile("app/browse/lib/fetch-personalized-sections.ts", {
  "@repo/supabase/server": {}, "@repo/utils": shared, "./browse-apartment": mapper,
  "./browse-query": query, "./browse-row-drawer": drawer, "./recommended-section": metadata,
  "./recommendation-ranking": compile("app/browse/lib/recommendation-ranking.ts", { "@repo/utils": shared }),
});
const fixed = compile("app/browse/lib/fetch-browse-sections.ts", { "@repo/supabase/server": {}, "@repo/utils": shared, "./browse-apartment": mapper });
const discovery = compile("app/browse/lib/fetch-browse-discovery.ts", {
  "@repo/supabase/server": {}, "@repo/utils": shared, "./fetch-browse-sections": fixed, "./fetch-personalized-sections": personalized,
});
const matching = compile("lib/card-preference-matches.ts", { "@repo/utils": shared, "./tenant-preferences": preferences });
const saved = { ...preferences.DEFAULT_TENANT_PREFERENCES, selectedCities: ["Navotas"], budgetMax: 14999, bedroomCount: "1-2 Bedrooms", hasParking: true };
const listing = (id, rent, overrides = {}) => ({
  id, name: id, city: "Navotas", barangay: "San Jose", monthly_rent: rent,
  no_bedrooms: 2, no_bathrooms: 1, area_sqm: 30, amenities: ["parking"],
  is_verified: true, average_rating: 4, deleted_at: null, is_hidden_by_admin: false,
  status: "available", apartment_images: [], ...overrides,
});
const forYou = rows => rows.find(row => row.id === metadata.RECOMMENDED_SECTION_ID);
const ids = row => row?.apartments.map(apt => apt.id) ?? [];
const plain = value => JSON.parse(JSON.stringify(value));

test("the reported Navotas case is reproduced by soft shared ranking, but the web pool enforces exact inclusive budget boundaries", async () => {
  const rows = [4999, 5000, 7500, 14999, 15000, 22000, 45000, 65000].map(rent => listing(`rent-${rent}`, rent));
  assert.ok(shared.scoreListing(rows.at(-1), saved) > 0, "existing shared behavior alone admits the severe mismatch");
  const client = createListingQueryFixture(() => rows);
  const result = forYou(await personalized.fetchPersonalizedSections(client, saved));
  assert.deepEqual(plain(ids(result)).sort(), ["rent-14999", "rent-5000", "rent-7500"]);
  const pool = client.calls.find(call => !call.columns.includes("apartment_images"));
  const winners = client.calls.find(call => call.ops.some(([method, column]) => method === "in" && column === "id"));
  for (const call of [pool, winners]) {
    assert.ok(call.ops.some(op => JSON.stringify(op) === JSON.stringify(["gte", "monthly_rent", 5000])));
    assert.ok(call.ops.some(op => JSON.stringify(op) === JSON.stringify(["lte", "monthly_rent", 14999])));
    assert.ok(call.ops.some(op => JSON.stringify(op) === JSON.stringify(["in", "city", ["Navotas"]])));
  }
  assert.ok(pool.ops.findIndex(([method]) => method === "gte") < pool.ops.findIndex(([method]) => method === "limit"));
  assert.ok(pool.ops.some(op => op[0] === "limit" && op[1] === 1000));
});

test("cheap listings in other cities and unavailable, hidden or deleted listings cannot enter Recommended", async () => {
  const rows = [
    listing("eligible", 7500), listing("other-city", 7500, { city: "Caloocan" }),
    listing("case-mismatch", 7500, { city: "navotas" }), listing("unknown-city", 7500, { city: null }),
    listing("occupied", 7500, { status: "occupied" }), listing("maintenance", 7500, { status: "under_maintenance" }),
    listing("hidden", 7500, { is_hidden_by_admin: true }), listing("deleted", 7500, { deleted_at: "2026-11-06" }),
    listing("unknown-rent", null),
  ];
  const result = forYou(await personalized.fetchPersonalizedSections(createListingQueryFixture(() => rows), saved));
  assert.deepEqual(plain(ids(result)), ["eligible"]);
});

test("existing bedroom/parking ranking and score/rating/id tiebreaks apply only inside the eligible pool", async () => {
  const rows = [
    listing("severe", 65000, { average_rating: 5 }),
    listing("a", 7500), listing("b", 7500), listing("higher-rated", 7500, { average_rating: 5 }),
    listing("no-parking", 7500, { amenities: [] }), listing("near-bedroom", 7500, { no_bedrooms: 3 }),
  ];
  const expected = ["higher-rated", "a", "b", "near-bedroom", "no-parking"];
  for (const input of [rows, [...rows].reverse()]) {
    const recommended = forYou(await personalized.fetchPersonalizedSections(createListingQueryFixture(() => input), saved));
    assert.deepEqual(plain(ids(recommended)), expected);
    for (const apt of recommended.apartments) {
      const labels = plain(matching.cardPreferenceMatches(apt, matching.cardPreferenceRules(saved)));
      assert.ok(labels.includes("Within budget"));
      assert.equal(labels.includes("Preferred bedrooms"), apt.bedrooms >= 1 && apt.bedrooms <= 2);
      assert.equal(labels.includes("Matches amenities"), apt.amenities.includes("parking"));
    }
  }
});

test("too few eligible listings stay few; no near-budget or severe fallback is relabeled Recommended", async () => {
  const rows = [listing("one", 7500), listing("one-peso-over", 15000), listing("severe", 65000)];
  const client = createListingQueryFixture(() => rows);
  const result = await discovery.loadDiscoverySections(client, saved);
  assert.deepEqual(plain(ids(forYou(result))), ["one"]);
  assert.ok(result.filter(row => row.id !== metadata.RECOMMENDED_SECTION_ID).some(row => row.apartments.some(apt => apt.id === "severe")), "ordinary city/filler rows may remain broad, never Recommended");
  const none = await discovery.loadDiscoverySections(createListingQueryFixture(() => rows.slice(1)), saved);
  assert.equal(forYou(none), undefined);
});

test("pet and parking amenities rank within budget and partial amenity chips never claim a complete match", async () => {
  const prefs = { ...saved, hasPets: true, kindOfPets: ["Cat"] };
  const rows = [
    listing("all-amenities", 7500, { amenities: ["petfriendly", "parking"] }),
    listing("pets-only", 7500, { amenities: ["petfriendly"] }),
    listing("parking-only", 7500),
    listing("none", 7500, { amenities: [] }),
    listing("expensive-perfect", 65000, { amenities: ["petfriendly", "parking"], average_rating: 5 }),
  ];
  const recommended = forYou(await personalized.fetchPersonalizedSections(createListingQueryFixture(() => rows), prefs));
  assert.deepEqual(plain(ids(recommended)), ["all-amenities", "pets-only", "parking-only", "none"]);
  const rules = matching.cardPreferenceRules(prefs);
  const labels = id => plain(matching.cardPreferenceMatches(recommended.apartments.find(apt => apt.id === id), rules));
  assert.ok(labels("all-amenities").includes("Matches amenities"));
  assert.ok(labels("pets-only").includes("Pet-friendly"));
  assert.ok(labels("parking-only").includes("Parking available"));
  assert.ok(!labels("pets-only").includes("Matches amenities"));
  assert.ok(!labels("parking-only").includes("Matches amenities"));
});

test("empty recommendation pools keep the fixed Browse fallback separate; absent/default preferences do not trigger personalized reads", async () => {
  const sections = [{ id: "verified", title: "Verified", apartments: [listing("generic", 65000)] }];
  const client = createListingQueryFixture(() => [], { fixedSections: sections });
  const result = await discovery.loadDiscoverySections(client, saved);
  assert.equal(forYou(result), undefined);
  assert.equal(result[0].id, "verified");
  assert.equal(client.rpcCalls.length, 1);
  for (const prefs of [null, preferences.DEFAULT_TENANT_PREFERENCES]) {
    const skipped = createListingQueryFixture(() => []);
    assert.equal((await personalized.fetchPersonalizedSections(skipped, prefs)).length, 0);
    assert.equal(skipped.calls.length, 0);
  }
});

test("a default unanswered budget is not silently made a new hard constraint", async () => {
  const prefs = { ...saved, budgetMin: 5000, budgetMax: 100000 };
  const client = createListingQueryFixture(() => [listing("high", 120000)]);
  assert.deepEqual(plain(ids(forYou(await personalized.fetchPersonalizedSections(client, prefs)))), ["high"]);
  const pool = client.calls.find(call => !call.columns.includes("apartment_images"));
  assert.ok(!pool.ops.some(([method, column]) => ["gte", "lte"].includes(method) && column === "monthly_rent"));
  assert.deepEqual(plain(matching.cardPreferenceMatches(mapper.toBrowseApartment(listing("high", 120000)), matching.cardPreferenceRules(prefs))).includes("Within budget"), false);
});

test("eligibility is checked again when a winner's price or city changes after the pool read", async () => {
  for (const patch of [{ monthly_rent: 65000 }, { city: "Caloocan" }]) {
    const row = listing("changed", 7500);
    const client = createListingQueryFixture(() => [row], { beforeRead(call) {
      if (call.ops.some(([method, column]) => method === "in" && column === "id")) Object.assign(row, patch);
    } });
    assert.equal(forYou(await personalized.fetchPersonalizedSections(client, saved)), undefined);
  }
});

test("the candidate cap cannot be filled by expensive listings before budget filtering", async () => {
  const rows = Array.from({ length: 1001 }, (_, index) => listing(`a-${index}`, 65000));
  rows.push(listing("z-affordable", 7500));
  const result = forYou(await personalized.fetchPersonalizedSections(createListingQueryFixture(() => rows), saved));
  assert.deepEqual(plain(ids(result)), ["z-affordable"]);
});

test("Settings save payload round-trips through the caller-bound action and the normalized recommendation read", async () => {
  let persisted = { ...preferences.DEFAULT_TENANT_PREFERENCES };
  const authId = "auth-a";
  const server = {
    auth: { getUser: async () => ({ data: { user: { id: authId } } }) },
    from(table) {
      assert.equal(table, "users");
      return {
        select: () => ({ eq: (column, id) => {
          assert.equal(column, "user_id"); assert.equal(id, authId);
          return { maybeSingle: async () => ({ data: { id: "internal-a", roles: ["tenant"] } }) };
        } }),
        update: payload => ({ eq: (column, id) => {
          assert.equal(column, "user_id"); assert.equal(id, authId);
          return { select: columns => {
            assert.equal(columns, "id");
            return { maybeSingle: async () => {
              persisted = structuredClone(payload.preferences); return { data: { id: "internal-a" }, error: null };
            } };
          } };
        } }),
      };
    },
  };
  const action = compile("app/(onboarding)/tenant/personalize/actions.ts", {
    "@repo/supabase/server": { createClient: async () => server },
    "@repo/constants": { CAMANAVA_CITIES: ["Navotas", "Caloocan"], PETS: [], VEHICLE_OPTIONS: [] },
    "@/lib/tenant-preferences": preferences,
  });
  const runtime = hookRuntime();
  let notifications = 0, refreshes = 0;
  const formModule = compile("hooks/use-rental-preferences-form.ts", {
    react: runtime.react, "next/navigation": { useRouter: () => ({ refresh: () => refreshes++ }) },
    "@heroui/react": { toast: { success() {}, danger() {} } }, "@repo/utils": {},
    "@/lib/tenant-preferences": preferences,
    "@/app/(onboarding)/tenant/personalize/actions": action,
    "./use-user": { notifyPreferencesSaved: () => notifications++ },
  });
  const read = () => runtime.render(() => formModule.useRentalPreferencesForm(persisted));
  read().setCities(["Navotas"]); read().setBudgetRange(5000, 14999); read().setBedroomCount("1-2 Bedrooms"); read().setHasParking(true);
  const visible = plain(read().currentPrefs);
  assert.equal(await read().save(), true);
  assert.deepEqual(persisted, visible, "visible committed values, write payload and persisted values are identical");
  assert.equal(persisted.budgetMax, 14999, "the preset boundary is not rounded up");
  assert.equal(notifications, 1); assert.equal(refreshes, 1);
  const rows = [listing("affordable", 7500), listing("near", 15000), listing("severe", 65000)];
  const run = () => personalized.fetchPersonalizedSections(createListingQueryFixture(() => rows), preferences.parseTenantPreferences(persisted));
  assert.deepEqual(plain(ids(forYou(await run()))), ["affordable"]);
  read().setBudgetRange(15000, 29999);
  assert.equal(await read().save(), true);
  assert.equal(read().budgetMax, persisted.budgetMax);
  assert.deepEqual(plain(ids(forYou(await run()))), ["near"]);
});
