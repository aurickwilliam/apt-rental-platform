import React from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SECTION_DEFS, scorePreferences, useSearchSections } from "./useSearchSections";
import { toFilterState, type TenantPreferences } from "@/hooks/preferences/useUserPreferences";
import type { RecommendationListing, RecommendationPreferences } from "@repo/utils/recommendations";

const mockRpc = jest.fn();
const mockFetchCandidates = jest.fn();

jest.mock("@repo/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));
jest.mock("@/service/search/recommendations", () => ({
  fetchPersonalizedCandidates: (...args: unknown[]) => mockFetchCandidates(...args),
}));

const savedPreferences = (values: Partial<TenantPreferences> = {}): TenantPreferences => ({
  selectedCities: [], budgetMin: 5000, budgetMax: 15000, bedroomCount: null,
  householdSize: null, hasPets: false, kindOfPets: [], noOfPets: 1, nameOfPets: null,
  hasParking: false, noOfParkingSpots: 1, listOfVehicles: [], hasSmoker: false,
  hasDisability: false, ...values,
});

const recommendationPrefs = (
  values: Partial<RecommendationPreferences> = {},
): RecommendationPreferences => ({
  selectedCities: [], budgetMin: 5000, budgetMax: 15000, ...values,
});

const apartment = (id: string, city = "Caloocan"): RecommendationListing => ({
  id,
  name: `Apt ${id}`,
  barangay: "Brgy 1",
  city,
  average_rating: 4.5,
  monthly_rent: 9000,
  no_bedrooms: 1,
  no_bathrooms: 1,
  area_sqm: 30,
  is_verified: true,
  apartment_images: [],
});

const sectionsPayload = {
  sections: SECTION_DEFS.map((def, i) => ({
    id: def.id,
    title: def.title,
    apartments: [apartment(`a${i}`)],
  })),
};

const clients: QueryClient[] = [];
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
});

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

function rpcResult(value: unknown) {
  return { abortSignal: () => Promise.resolve(value) };
}

describe("useSearchSections", () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockFetchCandidates.mockReset();
    mockRpc.mockReturnValue(rpcResult({ data: sectionsPayload, error: null }));
    mockFetchCandidates.mockResolvedValue([]);
  });

  it("only boosts explicitly smoking-allowed listings for a smoking household", () => {
    const preferences = savedPreferences({ hasSmoker: true });
    const base = scorePreferences(apartment("a"), preferences);
    expect(scorePreferences({ ...apartment("a"), amenities: ["nonsmoking"] }, preferences)).toBe(0);
    expect(scorePreferences({ ...apartment("a"), amenities: ["smoking"] }, preferences)).toBe(base + 1);
    expect(scorePreferences({ ...apartment("a"), amenities: ["smoking", "nonsmoking"] }, preferences)).toBe(0);
    expect(toFilterState(preferences).amenities).toEqual(["smoking"]);
    expect(toFilterState(savedPreferences()).amenities).toEqual([]);
  });

  it("fetches all six generic sections in a single RPC call", async () => {
    const { result } = renderHook(
      () => useSearchSections({ selectedCity: "CAMANAVA", committedSearch: "" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.sections).toHaveLength(6));
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockFetchCandidates).not.toHaveBeenCalled();
    expect(mockRpc).toHaveBeenCalledWith(
      "get_search_sections",
      expect.objectContaining({ p_city: "CAMANAVA", p_limit: 8 }),
    );
  });

  it("refetches generic sections when the city changes", async () => {
    const { result, rerender } = renderHook(
      (props: { city: string }) =>
        useSearchSections({ selectedCity: props.city, committedSearch: "" }),
      { wrapper: createWrapper(), initialProps: { city: "CAMANAVA" } },
    );

    await waitFor(() => expect(result.current.sections).toHaveLength(6));
    await act(async () => { rerender({ city: "Caloocan" }); });

    await waitFor(() => expect(mockRpc).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(mockRpc).toHaveBeenLastCalledWith(
      "get_search_sections",
      expect.objectContaining({ p_city: "Caloocan" }),
    );
  });

  it("fetches and re-filters personalized candidates without rereading generic sections", async () => {
    mockFetchCandidates.mockResolvedValue([
      apartment("caloocan", "Caloocan"),
      apartment("malabon", "Malabon"),
    ]);

    const { result, rerender } = renderHook(
      ({ preferences }: { preferences: RecommendationPreferences }) =>
        useSearchSections({
          selectedCity: "CAMANAVA",
          committedSearch: "",
          preferences,
          accountId: "user-1",
        }),
      {
        wrapper: createWrapper(),
        initialProps: { preferences: recommendationPrefs({ selectedCities: ["Caloocan"] }) },
      },
    );

    await waitFor(() => expect(result.current.sections[0]?.recommendationStatus).toBe("ready"));
    expect(result.current.sections[0].apartments.map((item) => item.id)).toEqual(["caloocan"]);
    expect(mockRpc).toHaveBeenCalledTimes(1);

    await act(async () => {
      rerender({ preferences: recommendationPrefs({ selectedCities: ["Malabon"] }) });
    });

    await waitFor(() =>
      expect(result.current.sections[0].apartments.map((item) => item.id)).toEqual(["malabon"]),
    );
    expect(mockFetchCandidates).toHaveBeenCalledTimes(2);
    expect(mockFetchCandidates).toHaveBeenLastCalledWith(
      expect.objectContaining({ selectedCities: ["Malabon"] }),
      expect.anything(),
    );
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it("shows an empty recommendation state instead of generic fallback listings", async () => {
    mockFetchCandidates.mockResolvedValue([]);
    const { result } = renderHook(
      () =>
        useSearchSections({
          selectedCity: "CAMANAVA",
          committedSearch: "",
          preferences: recommendationPrefs({ selectedCities: ["Navotas"], budgetMin: 5000, budgetMax: 14999 }),
          accountId: "user-1",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.sections[0]?.recommendationStatus).toBe("empty"));
    expect(result.current.sections[0].apartments).toHaveLength(0);
    expect(result.current.sections).toHaveLength(7);
  });

  it("distinguishes a failed personalized read from an empty result", async () => {
    mockFetchCandidates.mockRejectedValue(new Error("network"));
    const { result } = renderHook(
      () =>
        useSearchSections({
          selectedCity: "CAMANAVA",
          committedSearch: "",
          preferences: recommendationPrefs({ selectedCities: ["Navotas"] }),
          accountId: "user-1",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.sections[0]?.recommendationStatus).toBe("error"));
    expect(result.current.sections[0].apartments).toHaveLength(0);
    expect(result.current.sections).toHaveLength(7);
  });

  it("does not add a personalized section without saved preferences", async () => {
    const { result } = renderHook(
      () =>
        useSearchSections({
          selectedCity: "CAMANAVA",
          committedSearch: "",
          preferences: recommendationPrefs({ budgetMin: 5000, budgetMax: 100000 }),
          accountId: "user-1",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.sections).toHaveLength(6));
    expect(result.current.sections.some((section) => section.id === "for_you")).toBe(false);
    expect(mockFetchCandidates).not.toHaveBeenCalled();
  });

  it("exposes the error message when the generic RPC fails", async () => {
    mockRpc.mockReturnValue(rpcResult({ data: null, error: new Error("rpc failed") }));

    const { result } = renderHook(
      () => useSearchSections({ selectedCity: "CAMANAVA", committedSearch: "" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.error).toBe("rpc failed"));
    expect(result.current.sections).toEqual([]);
  });
});
