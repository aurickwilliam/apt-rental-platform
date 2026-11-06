import assert from "node:assert/strict";
import test from "node:test";
import * as rows from "../../../packages/utils/src/browseRows.ts";
import * as preferences from "./tenant-preferences.ts";
import { compile, hookRuntime } from "./test-support/hook-runtime.mjs";

const helpers = compile("lib/card-preference-matches.ts", {
  "@repo/utils": rows,
  "./tenant-preferences": preferences,
});
const { cardPreferenceRules, cardPreferenceMatches } = helpers;
const saved = { ...preferences.DEFAULT_TENANT_PREFERENCES, selectedCities: ["Caloocan"], budgetMin: 10000, budgetMax: 18000, bedroomCount: "1-2 Bedrooms", hasPets: true, hasParking: true };
const apartment = { id: "one", city: "Caloocan", location: "Caloocan", price: 18000, bedrooms: 2, amenities: ["petfriendly", "parking"] };
const labels = (apt = apartment, prefs = saved) => [...cardPreferenceMatches(apt, cardPreferenceRules(prefs))];

test("chips explain exact city, inclusive monthly budget, bedroom and complete amenity matches", () => {
  assert.deepEqual(labels(), ["Preferred city", "Within budget", "Preferred bedrooms", "Matches amenities"]);
  assert.ok(!labels({ ...apartment, city: "Malabon" }).includes("Preferred city"));
  assert.ok(!labels({ ...apartment, city: undefined }).includes("Preferred city"), "never infer city from location/search");
  for (const price of [9999, 18001, NaN]) assert.ok(!labels({ ...apartment, price }).includes("Within budget"));
  assert.ok(labels({ ...apartment, price: 10000 }).includes("Within budget"));
  for (const bedrooms of [undefined, 0, 3]) assert.ok(!labels({ ...apartment, bedrooms }).includes("Preferred bedrooms"));
  assert.ok(labels({ ...apartment, bedrooms: 4 }, { ...saved, bedroomCount: "4+ Bedrooms" }).includes("Preferred bedrooms"));
});

test("partial amenities are named accurately; missing data and skipped/default preferences make no claims", () => {
  assert.deepEqual(labels({ ...apartment, amenities: ["parking"] }).slice(-1), ["Parking available"]);
  assert.ok(!labels({ ...apartment, amenities: ["parking"] }).includes("Matches amenities"));
  assert.ok(!labels({ ...apartment, amenities: undefined }).some(value => /amenities|Parking|Pet/.test(value)));
  for (const raw of [null, {}, preferences.DEFAULT_TENANT_PREFERENCES]) assert.deepEqual(labels(apartment, raw), []);
  assert.deepEqual(labels(apartment, { selectedCities: ["Caloocan"] }), ["Preferred city"], "default budget isn't an answered budget");
  assert.deepEqual(labels(apartment, { selectedCities: [], budgetMin: 10000, budgetMax: 18000 }), ["Within budget"]);
  assert.deepEqual(labels(apartment, { budgetMin: 10000, budgetMax: 18000 }), ["Within budget"]);
  assert.deepEqual(labels(apartment, { ...saved, budgetMin: 20000, budgetMax: 10000 }), [], "unusable preferences fail closed");
});

test("one account's saved profile supplies recommendation rules; updates and sign-out retire chip context", () => {
  const runtime = hookRuntime();
  let snapshot = { loading: false, user: { id: "a" }, profile: { roles: ["tenant"], preferences: saved } };
  const { useCardPreferenceRules } = compile("hooks/use-card-preference-rules.ts", {
    react: runtime.react, "./use-user": { useUser: () => snapshot }, "@/lib/card-preference-matches": helpers,
  });
  const read = () => runtime.render(() => useCardPreferenceRules());
  assert.equal(cardPreferenceMatches(apartment, read()).length, 4);
  snapshot = { ...snapshot, profile: { ...snapshot.profile, preferences: { selectedCities: ["Malabon"] } } };
  assert.equal(cardPreferenceMatches(apartment, read()).length, 0);
  for (const next of [
    { loading: true, user: null, profile: null },
    { loading: false, user: null, profile: null },
    { loading: false, user: { id: "b" }, profile: { roles: ["landlord"], preferences: saved } },
    { loading: false, user: { id: "b" }, profile: { roles: ["tenant"], preferences: null } },
  ]) { snapshot = next; assert.equal(read().length, 0); }
});

test("the common card mapper carries separate city and amenities without guessing missing RPC fields", () => {
  const { toBrowseApartment, BROWSE_CARD_COLUMNS } = compile("app/browse/lib/browse-apartment.ts", {});
  const card = toBrowseApartment({ id: "one", city: "Caloocan", barangay: "Village", monthly_rent: 15000, no_bedrooms: 2, amenities: ["parking"] });
  assert.equal(card.city, "Caloocan");
  assert.deepEqual([...card.amenities], ["parking"]);
  assert.match(BROWSE_CARD_COLUMNS, /amenities/);
  assert.equal(toBrowseApartment({ id: "one", monthly_rent: 15000 }).amenities, undefined);
});
