import { cardRow, createSupabaseRecorder, FAIL, poolRow, POOL_SELECT } from "./supabaseRecorder";

const mockState: { client: ReturnType<typeof createSupabaseRecorder>["client"] | null } = { client: null };

jest.mock("@repo/supabase", () => ({
  supabase: {
    from: (table: string) => mockState.client!.from(table),
    rpc: (name: string, args: unknown) => mockState.client!.rpc(name, args),
  },
}));

import { fetchBrowseRowCards, fetchRecommendedCards } from "@/service/search/browseRowsService";

function setup(answer: Parameters<typeof createSupabaseRecorder>[0]["answer"]) {
  const recorder = createSupabaseRecorder({ answer });
  mockState.client = recorder.client;
  return recorder;
}

describe("fetchBrowseRowCards", () => {
  it("applies every criterion, the public visibility rules and one cover image per card", async () => {
    const r = setup(() => [cardRow("a")]);
    await fetchBrowseRowCards({
      sort: "rating",
      criteria: {
        cities: ["Caloocan", "Malabon"],
        priceMin: 10000,
        priceMax: 20000,
        bedroomMin: 2,
        bedroomMax: 4,
        verified: true,
        types: ["Studio"],
        sizeMin: 60,
        furnishing: "Fully Furnished",
        amenities: ["petfriendly"],
        minRating: 4.5,
      },
    });
    const [call] = r.calls;
    expect(call.table).toBe("apartments");
    expect(r.has(call, "is", "deleted_at", null)).toBe(true);
    expect(r.has(call, "eq", "is_hidden_by_admin", false)).toBe(true);
    expect(r.has(call, "in", "status", ["available", "unverified"])).toBe(true);
    expect(r.has(call, "limit", 1, { foreignTable: "apartment_images" })).toBe(true);
    expect(r.has(call, "in", "city", ["Caloocan", "Malabon"])).toBe(true);
    expect(r.has(call, "gte", "monthly_rent", 10000)).toBe(true);
    expect(r.has(call, "lte", "monthly_rent", 20000)).toBe(true);
    expect(r.has(call, "gte", "no_bedrooms", 2)).toBe(true);
    expect(r.has(call, "lte", "no_bedrooms", 4)).toBe(true);
    expect(r.has(call, "eq", "is_verified", true)).toBe(true);
    expect(r.has(call, "in", "type", ["Studio"])).toBe(true);
    expect(r.has(call, "gte", "area_sqm", 60)).toBe(true);
    expect(r.has(call, "eq", "furnished_type", "Fully Furnished")).toBe(true);
    expect(r.has(call, "contains", "amenities", ["petfriendly"])).toBe(true);
    expect(r.has(call, "gte", "average_rating", 4.5)).toBe(true);
  });

  it("keeps an open price max open and skips unset criteria", async () => {
    const r = setup(() => []);
    await fetchBrowseRowCards({ sort: "newest", criteria: { priceMin: 30000 } });
    const [call] = r.calls;
    expect(r.has(call, "gte", "monthly_rent", 30000)).toBe(true);
    expect(call.ops.some((op) => op[0] === "lte")).toBe(false);
    expect(call.ops.some((op) => op[0] === "in" && op[1] === "city")).toBe(false);
  });

  it("pages by offset, capped at 15 by default, and orders with an id tiebreak", async () => {
    const r = setup(() => []);
    await fetchBrowseRowCards({ sort: "rating", criteria: {} });
    await fetchBrowseRowCards({ sort: "price_asc", criteria: {} }, { limit: 10, offset: 20 });
    expect(r.has(r.calls[0], "range", 0, 14)).toBe(true);
    expect(r.has(r.calls[0], "order", "average_rating", { ascending: false, nullsFirst: false })).toBe(true);
    expect(r.has(r.calls[1], "range", 20, 29)).toBe(true);
    expect(r.has(r.calls[1], "order", "monthly_rent", { ascending: true })).toBe(true);
    for (const call of r.calls) expect(r.has(call, "order", "id", { ascending: true })).toBe(true);
  });

  it("maps rows to cards and throws when the query fails", async () => {
    setup(() => [cardRow("a", { monthly_rent: 12000 })]);
    const cards = await fetchBrowseRowCards({ sort: "rating", criteria: {} });
    expect(cards).toHaveLength(1);
    expect(cards[0]).toEqual(expect.objectContaining({ id: "a", monthlyRent: 12000 }));
    setup(() => FAIL);
    await expect(fetchBrowseRowCards({ sort: "rating", criteria: {} })).rejects.toThrow("boom");
  });
});

describe("fetchRecommendedCards", () => {
  const prefs = {
    selectedCities: ["Caloocan"],
    budgetMin: 5000,
    budgetMax: 20000,
    bedroomCount: null,
    householdSize: null,
    hasPets: false,
    hasParking: false,
    hasSmoker: false,
    hasDisability: false,
  };

  it("scores light rows, then fetches only the winners with photos in ranked order", async () => {
    const pool = [
      poolRow("low", { monthly_rent: 90000, no_bedrooms: 1, is_verified: false, average_rating: 1 }),
      poolRow("best", { is_verified: true, average_rating: 5 }),
      poolRow("mid", { is_verified: false, average_rating: 3 }),
    ];
    const r = setup((call) => {
      if (call.select === POOL_SELECT) return pool;
      return ["mid", "best", "low"].map((id) => cardRow(id)); // wrong order on purpose
    });
    const cards = await fetchRecommendedCards(prefs);
    expect(cards.map((card) => card.id)).toEqual(["best", "mid", "low"]);
    const poolCall = r.calls.find((call) => call.select === POOL_SELECT)!;
    expect(r.has(poolCall, "in", "city", ["Caloocan"])).toBe(true);
    expect(r.has(poolCall, "limit", 1000)).toBe(true);
    expect(poolCall.select).not.toContain("apartment_images");
    const winners = r.calls.find((call) => call !== poolCall)!;
    expect(r.has(winners, "in", "id", ["best", "mid", "low"])).toBe(true);
  });

  it("returns nothing, without a second read, when no listing scores", async () => {
    const r = setup(() => [poolRow("far", { city: "Malabon" })]);
    expect(await fetchRecommendedCards(prefs)).toEqual([]);
    expect(r.calls).toHaveLength(1);
  });

  it("counts the wheelchair amenity for a tenant who needs accessibility", async () => {
    const pool = [
      poolRow("plain", { average_rating: 5 }),
      poolRow("ramp", { amenities: ["wheelchair"], average_rating: 1 }),
    ];
    setup((call) => (call.select === POOL_SELECT ? pool : ["ramp", "plain"].map((id) => cardRow(id))));
    const cards = await fetchRecommendedCards({ ...prefs, selectedCities: [], hasDisability: true });
    expect(cards.map((card) => card.id)).toEqual(["ramp", "plain"]);
  });

  it("caps the winners at the requested limit and throws when a read fails", async () => {
    const pool = Array.from({ length: 30 }, (_, i) => poolRow(`p${String(i).padStart(2, "0")}`));
    const r = setup((call) => (call.select === POOL_SELECT ? pool : []));
    await fetchRecommendedCards(prefs, 5);
    const winners = r.calls.find((call) => call.select !== POOL_SELECT)!;
    expect((winners.ops.find((op) => op[0] === "in" && op[1] === "id")![2] as string[]).length).toBe(5);
    setup(() => FAIL);
    await expect(fetchRecommendedCards(prefs)).rejects.toThrow("boom");
  });
});
