import assert from "node:assert/strict";
import test from "node:test";
import { compile } from "./test-support/hook-runtime.mjs";
import * as preferences from "./tenant-preferences.ts";
import { createListingQueryFixture } from "../tests/browse-cards/listing-query-fixture.mjs";
import { navotasRankingRows } from "../tests/browse-cards/navotas-ranking-data.mjs";

const shared = compile("../../packages/utils/src/browseRows.ts", {});
const ranking = compile("app/browse/lib/recommendation-ranking.ts", { "@repo/utils": shared });
const mapper = compile("app/browse/lib/browse-apartment.ts", {});
const query = compile("app/browse/lib/browse-query.ts", {});
const drawer = compile("app/browse/lib/browse-row-drawer.ts", { "@repo/utils": shared, "./browse-query": query }, { URLSearchParams });
const personalized = compile("app/browse/lib/fetch-personalized-sections.ts", {
  "@repo/supabase/server": {}, "@repo/utils": shared, "./browse-apartment": mapper,
  "./browse-query": query, "./browse-row-drawer": drawer,
  "./recommended-section": compile("app/browse/lib/recommended-section.ts", {}), "./recommendation-ranking": ranking,
});
const matching = compile("lib/card-preference-matches.ts", { "@repo/utils": shared, "./tenant-preferences": preferences });
const saved = { ...preferences.DEFAULT_TENANT_PREFERENCES, selectedCities: ["Navotas"], budgetMin: 15000, budgetMax: 29999, bedroomCount: "1-2 Bedrooms", hasParking: true };
const row = (id, rent, overrides = {}) => ({ ...navotasRankingRows[1], id, name: id, monthly_rent: rent, ...overrides });
const plain = value => JSON.parse(JSON.stringify(value));
const run = async (rows, prefs = saved) => {
  const client = createListingQueryFixture(() => rows);
  const sections = await personalized.fetchPersonalizedSections(client, prefs);
  return { client, recommended: sections.find(section => section.id === "for_you")?.apartments ?? [] };
};

test("the observed public data explains the old order: rating breaks a three-way score tie; Bagumbayan lacks parking", async () => {
  const old = shared.rankCandidates(navotasRankingRows, saved);
  assert.deepEqual(plain(old.map(({ candidate, score }) => [candidate.id, score])), [["tangos", 9], ["lower-bicutan", 9], ["san-roque", 9], ["bagumbayan", 8]]);
  const { recommended } = await run(navotasRankingRows);
  assert.deepEqual(plain(recommended.map(apt => [apt.name, apt.price])), [
    ["Lower Bicutan Affordable 2BR", 15000], ["San Roque Garden View 1BR", 18000],
    ["Tangos Cozy 2BR", 22000], ["Bagumbayan Norte Sea View Studio", 16000],
  ]);
});

test("equivalent preference scores sort by ascending rent, not rating or proximity to the budget minimum", async () => {
  const equal = navotasRankingRows.map(candidate => ({ ...candidate, amenities: ["parking"] }));
  const { recommended } = await run(equal);
  assert.deepEqual(plain(recommended.map(apt => apt.price)), [15000, 16000, 18000, 22000]);
  assert.ok(equal.every(candidate => shared.scoreListing(candidate, saved) === 9));
});

test("clearly stronger bedroom/parking/amenity matches outrank cheaper weaker listings", async () => {
  const candidates = [row("cheap-no-parking", 15000, { amenities: [] }), row("strong", 22000), row("cheap-three-bedrooms", 16000, { no_bedrooms: 3 })];
  const { recommended } = await run(candidates);
  assert.equal(recommended[0].id, "strong");
  const petPreferences = { ...saved, hasPets: true, kindOfPets: ["Cat"] };
  const petRows = [row("cheap-no-pets", 15000), row("strong-pets", 22000, { amenities: ["parking", "petfriendly"] })];
  assert.equal((await run(petRows, petPreferences)).recommended[0].id, "strong-pets");
});

test("existing inclusive budget range and preferred city constraints run before ranking", async () => {
  const candidates = [14999, 15000, 16000, 18000, 22000, 29999, 30000].map(rent => row(`rent-${rent}`, rent));
  candidates.push(row("wrong-city", 15000, { city: "Caloocan" }));
  const { recommended } = await run(candidates);
  assert.deepEqual(plain(recommended.map(apt => apt.price)), [15000, 16000, 18000, 22000, 29999]);
  assert.ok(recommended.every(apt => apt.city === "Navotas"));
  for (const apt of recommended) assert.ok(matching.cardPreferenceMatches(apt, matching.cardPreferenceRules(saved)).includes("Within budget"));
});

test("missing/invalid prices cannot masquerade as affordable; missing details never earn match chips", async () => {
  const invalid = [null, undefined, NaN, Infinity, -1, 0].map((price, index) => row(`missing-${index}`, price));
  const ranked = ranking.rankRecommendationCandidates([...invalid, row("known", 18000)], saved);
  assert.deepEqual(plain(ranked.map(entry => entry.candidate.id)), ["known"]);
  const { recommended } = await run([row("missing-details", 15000, { no_bedrooms: null, amenities: null }), row("known", 22000)]);
  assert.deepEqual(plain(recommended.map(apt => apt.id)), ["known", "missing-details"]);
  const labels = plain(matching.cardPreferenceMatches(recommended[1], matching.cardPreferenceRules(saved)));
  assert.deepEqual(labels, ["Preferred city", "Within budget"]);
});

test("price then rating then ID makes repeated fetches stable for equal relevance", async () => {
  const candidates = [row("b", 18000, { average_rating: 5 }), row("a", 18000, { average_rating: 5 }), row("unrated", 18000), row("cheap", 15000), row("lower-rated", 18000, { average_rating: 3 })];
  for (const input of [candidates, [...candidates].reverse(), [...candidates.slice(2), ...candidates.slice(0, 2)]]) {
    assert.deepEqual(plain((await run(input)).recommended.map(apt => apt.id)), ["cheap", "a", "b", "lower-rated", "unrated"]);
  }
});

test("affordability is considered before the row limit, not as a client-side sort of fifteen rating-selected winners", async () => {
  const candidates = Array.from({ length: 16 }, (_, index) => row(`a-${String(index).padStart(2, "0")}`, 22000, { average_rating: 5 }));
  candidates.push(row("z-cheap", 15000));
  assert.ok(!shared.rankCandidates(candidates, saved).some(entry => entry.candidate.id === "z-cheap"));
  const { recommended, client } = await run(candidates);
  assert.equal(recommended.length, 15);
  assert.equal(recommended[0].id, "z-cheap");
  const winners = client.calls.find(call => call.ops.some(([method, column]) => method === "in" && column === "id"));
  const winnerIds = winners.ops.find(([method, column]) => method === "in" && column === "id")[2];
  assert.equal(winnerIds[0], "z-cheap");
  assert.equal(winnerIds.length, 15);
});

test("saved preference changes and smaller eligible pools keep truthful server-produced ordering", async () => {
  const reloaded = preferences.parseTenantPreferences(JSON.parse(JSON.stringify({ ...saved, budgetMin: 18000, budgetMax: 29999 })));
  assert.deepEqual(plain((await run(navotasRankingRows, reloaded)).recommended.map(apt => apt.price)), [18000, 22000]);
  assert.equal((await run(navotasRankingRows, { ...saved, selectedCities: ["Caloocan"] })).recommended.length, 0);
  assert.equal((await run([row("over", 30000)])).recommended.length, 0);
  assert.equal((await run([], saved)).recommended.length, 0);
});
