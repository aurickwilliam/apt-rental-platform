import { cardRow, createSupabaseRecorder, FAIL, poolRow, POOL_SELECT } from "./supabaseRecorder";

const mockState: { client: ReturnType<typeof createSupabaseRecorder>["client"] | null } = { client: null };

jest.mock("@repo/supabase", () => ({
  supabase: {
    from: (table: string) => mockState.client!.from(table),
    rpc: (name: string, args: unknown) => mockState.client!.rpc(name, args),
  },
}));

import { loadDiscoverySections } from "@/service/search/browseDiscoveryService";

const FIXED_IDS = ["verified", "budget_low", "studio", "top_rated", "near_you", "spacious"];
const fixedRpcSections = FIXED_IDS.map((id) => ({ id, title: id, apartments: [cardRow(`fixed-${id}`)] }));

let rowCounter = 0;
const oneRowPerQuery = () => [cardRow(`row-${rowCounter++}`)];

// Answers the Recommended pool, its winners-by-id read, and one row per other query.
const answerLikeDatabase = (call: { select: string | null; ops: [string, ...unknown[]][] }) => {
  const byId = call.ops.find((op) => op[0] === "in" && op[1] === "id");
  if (byId) return (byId[2] as string[]).map((id) => cardRow(id));
  if (call.select === POOL_SELECT) return [poolRow("p1"), poolRow("p2", { average_rating: 3 })];
  return oneRowPerQuery();
};

const defaults = {
  selectedCities: [] as string[],
  budgetMin: 5000,
  budgetMax: 100000,
  bedroomCount: null as string | null,
  householdSize: null as string | null,
  hasPets: false,
  hasParking: false,
  hasSmoker: false,
  hasDisability: false,
};
const prefs = (overrides: Partial<typeof defaults> = {}) => ({ ...defaults, ...overrides });

const request = (overrides: Record<string, unknown> = {}) => ({
  selectedCity: "CAMANAVA",
  committedSearch: "",
  preferences: null,
  ...overrides,
});

function setup(options: Partial<Parameters<typeof createSupabaseRecorder>[0]> = {}) {
  const recorder = createSupabaseRecorder({ answer: oneRowPerQuery, ...options });
  mockState.client = recorder.client;
  return recorder;
}

describe("loadDiscoverySections", () => {
  let errorSpy: jest.SpyInstance;
  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => errorSpy.mockRestore());

  it("skipped preferences: the fixed rows first and untouched, padded to 9 beside one RPC", async () => {
    const r = setup({ rpcSections: fixedRpcSections });
    const rows = await loadDiscoverySections(request());
    expect(rows).toHaveLength(9);
    expect(rows.slice(0, 6).map((row) => row.id)).toEqual(FIXED_IDS);
    expect(rows.slice(6).map((row) => row.id)).toEqual(["family", "furnished", "pets"]);
    expect(r.rpcCalls).toEqual([["get_search_sections", { p_city: "CAMANAVA", p_search: undefined, p_limit: 15 }]]);
    expect(r.calls).toHaveLength(5);
  });

  it("another city or a search shows only the fixed rows, with city-specific titles", async () => {
    const r = setup({ rpcSections: fixedRpcSections });
    const rows = await loadDiscoverySections(request({ selectedCity: "Caloocan" }));
    expect(rows).toHaveLength(6);
    expect(rows[0].title).toBe("Verified in Caloocan");
    expect(rows[4].title).toBe("Near Caloocan");
    expect(r.calls).toHaveLength(0);
    await loadDiscoverySections(request({ committedSearch: "parada" }));
    expect(r.calls).toHaveLength(0);
  });

  it("throws the RPC error so the tab can show it", async () => {
    setup({ rpcError: new Error("rpc failed") });
    await expect(loadDiscoverySections(request())).rejects.toThrow("rpc failed");
  });

  it("an RPC with nothing returns no rows", async () => {
    setup({ answer: () => [], rpcSections: [] });
    expect(await loadDiscoverySections(request())).toEqual([]);
  });

  it("saved preferences: personalized rows first, padded from a first batch sized to the shortfall", async () => {
    const r = setup({ answer: answerLikeDatabase, rpcSections: fixedRpcSections });
    const rows = await loadDiscoverySections(
      request({ preferences: prefs({ selectedCities: ["Caloocan", "Valenzuela"], hasPets: true }) }),
    );
    expect(rows).toHaveLength(9);
    expect(rows.slice(0, 4).map((row) => row.id)).toEqual(["for_you", "city:Caloocan", "city:Valenzuela", "pets"]);
    expect(r.rpcCalls).toHaveLength(0);
    // pool, winners, 2 cities and pets, then 4 expected -> 5 needed + 2 spare filler queries.
    expect(r.calls).toHaveLength(5 + 7);
    expect(rows[1].spec?.criteria).toEqual({ cities: ["Caloocan"] });
    expect(rows[0].spec).toBeUndefined();
  });

  it("a short first batch triggers a top-up; base rows are never trimmed", async () => {
    const r = setup({
      answer: (call) => (r.has(call, "contains", "amenities", ["petfriendly"]) ? [] : answerLikeDatabase(call)),
    });
    const answered = prefs({
      selectedCities: ["Caloocan", "Malabon", "Navotas", "Valenzuela"],
      budgetMin: 15000,
      budgetMax: 29999,
      bedroomCount: "2-4 Bedrooms",
      hasPets: true,
      hasParking: true,
    });
    const rows = await loadDiscoverySections(request({ preferences: answered }));
    expect(rows).toHaveLength(9);
    expect(rows[0].id).toBe("for_you");
    expect(rows.slice(0, 8).some((row) => row.id === "pets")).toBe(false);
    expect(r.calls.length).toBeGreaterThan(10);
  });

  it("a failed row is dropped without hiding the others", async () => {
    const r = setup({
      answer: (call) => (r.has(call, "gte", "average_rating", 4.5) ? FAIL : answerLikeDatabase(call)),
    });
    const rows = await loadDiscoverySections(request({ preferences: prefs({ hasDisability: true }) }));
    expect(rows.some((row) => row.id === "top_rated")).toBe(false);
    expect(rows[0].id).toBe("for_you");
    expect(rows.length).toBeGreaterThanOrEqual(9);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("preferences that match nothing fall back to the fixed rows", async () => {
    const r = setup({ answer: () => [], rpcSections: fixedRpcSections });
    const rows = await loadDiscoverySections(request({ preferences: prefs({ selectedCities: ["Caloocan"] }) }));
    expect(rows.map((row) => row.id)).toEqual(FIXED_IDS);
    expect(r.rpcCalls).toHaveLength(1);
  });

  it("default preferences are skipped preferences", async () => {
    const r = setup({ rpcSections: fixedRpcSections });
    const rows = await loadDiscoverySections(request({ preferences: prefs() }));
    expect(rows.slice(0, 6).map((row) => row.id)).toEqual(FIXED_IDS);
    expect(r.rpcCalls).toHaveLength(1);
  });
});
