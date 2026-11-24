import assert from "node:assert/strict";
import test from "node:test";
import { compile } from "./test-support/hook-runtime.mjs";

const plain = (value) => JSON.parse(JSON.stringify(value));
const globals = { URLSearchParams };

const shared = compile("../../packages/utils/src/browseRows.ts", {});
const browseApartment = compile("app/browse/lib/browse-apartment.ts", {});
const browseQuery = compile("app/browse/lib/browse-query.ts", {});
const drawer = compile("app/browse/lib/browse-row-drawer.ts", { "@repo/utils": shared, "./browse-query": browseQuery }, globals);
const sections = compile("app/browse/lib/fetch-browse-sections.ts", {
  "@repo/supabase/server": {},
  "@repo/utils": shared,
  "./browse-apartment": browseApartment,
});
const personalized = compile("app/browse/lib/fetch-personalized-sections.ts", {
  "@repo/supabase/server": {},
  "@repo/utils": shared,
  "./browse-apartment": browseApartment,
  "./browse-query": browseQuery,
  "./browse-row-drawer": drawer,
});
const discovery = compile("app/browse/lib/fetch-browse-discovery.ts", {
  "@repo/supabase/server": {},
  "@repo/utils": shared,
  "./fetch-browse-sections": sections,
  "./fetch-personalized-sections": personalized,
});

const defaults = {
  selectedCities: [],
  budgetMin: 5000,
  budgetMax: 100000,
  bedroomCount: null,
  householdSize: null,
  hasPets: false,
  hasParking: false,
  hasSmoker: false,
  hasDisability: false,
};
const prefs = (overrides = {}) => ({ ...defaults, ...overrides });

const POOL_COLUMNS = "id, city, monthly_rent, no_bedrooms, max_occupants, amenities, is_verified, average_rating";

function card(id) {
  return {
    id,
    name: id,
    barangay: "B",
    city: "Caloocan",
    monthly_rent: 9000,
    average_rating: 4,
    no_bedrooms: 2,
    no_bathrooms: 1,
    area_sqm: 30,
    is_verified: true,
    apartment_images: [],
  };
}

/**
 * Records every apartments query as a list of [method, ...args] and answers
 * with `answer(call)`. The builder is thenable, like PostgREST's.
 */
function mockClient({ answer, rpcSections = [] }) {
  const calls = [];
  const rpcCalls = [];
  const has = (call, method, ...args) =>
    call.ops.some((op) => op[0] === method && JSON.stringify(op.slice(1)) === JSON.stringify(args));
  return {
    calls,
    rpcCalls,
    has,
    rpc: async (name, args) => {
      rpcCalls.push([name, args]);
      return { data: { sections: rpcSections }, error: null };
    },
    from(table) {
      const call = { table, select: null, ops: [] };
      calls.push(call);
      const builder = new Proxy(
        {},
        {
          get(_, method) {
            if (method === "then") {
              return (resolve, reject) => {
                const result = answer(call);
                const settled = result === FAIL ? { data: null, error: { message: "boom" } } : { data: result, error: null };
                return Promise.resolve(settled).then(resolve, reject);
              };
            }
            if (method === "select") {
              return (columns) => {
                call.select = columns;
                return builder;
              };
            }
            return (...args) => {
              call.ops.push([method, ...args]);
              return builder;
            };
          },
        },
      );
      return builder;
    },
  };
}

const FAIL = Symbol("fail");

let counter = 0;
const oneRowPerQuery = () => [card(`row-${counter++}`)];

const poolRow = (id, overrides = {}) => ({
  id,
  city: "Caloocan",
  monthly_rent: 20000,
  no_bedrooms: 2,
  amenities: [],
  is_verified: true,
  average_rating: 4,
  ...overrides,
});

// The Recommended pool, its winners-by-id read, and one row per other query.
const answerLikeDatabase = (call) => {
  const byId = call.ops.find((op) => op[0] === "in" && op[1] === "id");
  if (byId) return byId[2].map(card);
  if (call.select === POOL_COLUMNS) return [poolRow("p1"), poolRow("p2", { average_rating: 3 })];
  return oneRowPerQuery();
};

const fixedRpcSections = ["verified", "budget_low", "studio", "top_rated", "near_you", "spacious"].map((id) => ({
  id,
  title: id,
  apartments: [card(`fixed-${id}`)],
}));

test("every row query is capped at 15 apartments and ordered with a tiebreak", async () => {
  const client = mockClient({ answer: oneRowPerQuery });
  await personalized.fetchFillerSections(client, shared.buildFillerRowSpecs(null, { includeCore: true }));
  assert.equal(client.calls.length, 11);
  for (const call of client.calls) {
    assert.ok(client.has(call, "limit", 15), "row limit is 15");
    assert.ok(client.has(call, "limit", 1, { foreignTable: "apartment_images" }), "one cover image per card");
    assert.ok(client.has(call, "order", "id", { ascending: true }), "id breaks ties");
  }
});

test("a saved budget row applies its exact bounds even above the drawer's cap", async () => {
  const client = mockClient({ answer: () => [] });
  await personalized.fetchPersonalizedSections(client, prefs({ budgetMin: 30000, budgetMax: 59999 }));
  const budget = client.calls.find((call) => client.has(call, "gte", "monthly_rent", 30000));
  assert.ok(budget, "the budget row ran");
  assert.ok(client.has(budget, "lte", "monthly_rent", 59999), "the 59,999 upper bound is applied");
});

test("filler rows apply rating, bedroom and city rules the drawer cannot express", async () => {
  const client = mockClient({ answer: oneRowPerQuery });
  await personalized.fetchFillerSections(
    client,
    shared.buildFillerRowSpecs(prefs({ selectedCities: ["Caloocan", "Malabon"] }), { includeCore: true }),
  );
  const topRated = client.calls.find((call) => client.has(call, "gte", "average_rating", 4.5));
  assert.ok(topRated && client.has(topRated, "in", "city", ["Caloocan", "Malabon"]));
  const family = client.calls.find((call) => client.has(call, "gte", "no_bedrooms", 3));
  assert.ok(family && !family.ops.some((op) => op[0] === "lte" && op[1] === "no_bedrooms"));
});

test("Recommended scores light columns, then fetches only the winners with photos, in ranked order", async () => {
  const pool = [
    { id: "low", city: "Caloocan", monthly_rent: 90000, no_bedrooms: 1, amenities: [], is_verified: false, average_rating: 1 },
    { id: "best", city: "Caloocan", monthly_rent: 10000, no_bedrooms: 2, amenities: [], is_verified: true, average_rating: 5 },
    { id: "mid", city: "Caloocan", monthly_rent: 10000, no_bedrooms: 2, amenities: [], is_verified: false, average_rating: 3 },
  ];
  const client = mockClient({
    answer: (call) => {
      if (call.select === POOL_COLUMNS) return pool;
      // The card read has no order, so answer in the wrong order on purpose.
      return ["mid", "best", "low"].map(card);
    },
  });
  const result = await personalized.fetchPersonalizedSections(
    client,
    prefs({ selectedCities: ["Caloocan"], budgetMin: 5000, budgetMax: 20000 }),
  );
  const forYou = result.find((section) => section.id === "for_you");
  // "low" rents far above the chosen budget, so it is not recommended at all.
  assert.deepEqual(plain(forYou.apartments.map((apt) => apt.id)), ["best", "mid"]);
  const poolCall = client.calls.find((call) => call.select === POOL_COLUMNS);
  assert.ok(client.has(poolCall, "in", "city", ["Caloocan"]), "the pool is limited to chosen cities");
  assert.ok(client.has(poolCall, "limit", 1000), "the pool is bounded");
  assert.ok(!poolCall.select.includes("apartment_images"), "the pool reads no photos");
  const winners = client.calls.find((call) => call.select !== POOL_COLUMNS && call.ops.some((op) => op[0] === "in" && op[1] === "id"));
  assert.ok(winners, "the winners are fetched by id");
  assert.deepEqual(plain(winners.ops.find((op) => op[0] === "in" && op[1] === "id")[2]), ["best", "mid"]);
});

test("a failed row is dropped without hiding the others", async () => {
  const client = mockClient({
    answer: (call) => (client.has(call, "gte", "average_rating", 4.5) ? FAIL : oneRowPerQuery()),
  });
  const rows = await personalized.fetchFillerSections(client, shared.buildFillerRowSpecs(null, { includeCore: true }));
  assert.equal(rows.length, 10);
  assert.ok(!rows.some((row) => row.id === "top_rated"));
});

test("skipped preferences: the fixed rows come first and untouched, padded to 9 from one parallel batch", async () => {
  const client = mockClient({ answer: oneRowPerQuery, rpcSections: fixedRpcSections });
  const rows = await discovery.loadDiscoverySections(client, null, "/browse");
  assert.equal(rows.length, 9);
  assert.deepEqual(plain(rows.slice(0, 6).map((row) => row.id)), ["verified", "budget_low", "studio", "top_rated", "near_you", "spacious"]);
  assert.equal(client.rpcCalls.length, 1);
  assert.deepEqual(plain(client.rpcCalls[0][1]), { p_city: "CAMANAVA", p_limit: 15 });
  assert.equal(client.calls.length, 5, "one query per extra row, run beside the RPC");
});

test("an RPC with nothing returns no rows, so the page falls back to the grid", async () => {
  const client = mockClient({ answer: () => [], rpcSections: [] });
  assert.deepEqual(plain(await discovery.loadDiscoverySections(client, null)), []);
});

test("saved preferences: personalized rows first, padded from a first batch sized to the shortfall", async () => {
  const client = mockClient({ answer: answerLikeDatabase, rpcSections: fixedRpcSections });
  const rows = await discovery.loadDiscoverySections(
    client,
    prefs({ selectedCities: ["Caloocan", "Valenzuela"], hasPets: true }),
    "/tenant/browse",
  );
  assert.equal(rows.length, 9);
  assert.deepEqual(plain(rows.slice(0, 4).map((row) => row.id)), ["for_you", "city:Caloocan", "city:Valenzuela", "pets"]);
  assert.equal(client.rpcCalls.length, 0, "the fixed rows are not read when preferences produce rows");
  // 4 personal rows expected -> 5 needed + 2 spare = 7 filler queries, no second batch.
  const personalQueries = 1 + 1 + 3; // pool, winners, two cities and pets
  assert.equal(client.calls.length, personalQueries + 7);
});

test("a short first batch triggers a top-up batch; base rows are never trimmed", async () => {
  // Everything answered: expected rows reach 9, so no filler is fetched up front.
  const client = mockClient({
    answer: (call) => (client.has(call, "contains", "amenities", ["petfriendly"]) ? [] : answerLikeDatabase(call)),
  });
  const answered = prefs({
    selectedCities: ["Caloocan", "Malabon", "Navotas", "Valenzuela"],
    budgetMin: 15000,
    budgetMax: 29999,
    bedroomCount: "2-4 Bedrooms",
    hasPets: true,
    hasParking: true,
  });
  const rows = await discovery.loadDiscoverySections(client, answered, "/tenant/browse");
  // The pets row came back empty, leaving 8 rows: the top-up batch fills the ninth.
  assert.equal(rows.length, 9);
  assert.ok(!rows.slice(0, 8).some((row) => row.id === "pets"));
  assert.equal(rows[0].id, "for_you");
  assert.ok(client.calls.length > 9 + 1, "a second batch of filler queries ran");
});

test("preferences that match nothing fall back to the fixed rows", async () => {
  const client = mockClient({ answer: () => [], rpcSections: fixedRpcSections });
  const rows = await discovery.loadDiscoverySections(client, prefs({ selectedCities: ["Caloocan"] }));
  assert.deepEqual(plain(rows.map((row) => row.id)), ["verified", "budget_low", "studio", "top_rated", "near_you", "spacious"]);
  assert.equal(client.rpcCalls.length, 1);
});
