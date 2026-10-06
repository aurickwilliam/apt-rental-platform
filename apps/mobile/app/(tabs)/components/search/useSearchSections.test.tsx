import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SECTION_DEFS, useSearchSections } from "./useSearchSections";

const mockRpc = jest.fn();

jest.mock("@repo/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

const apartment = (id: string, city = "Caloocan") => ({
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

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
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
    mockRpc.mockReturnValue(rpcResult({ data: sectionsPayload, error: null }));
  });

  it("fetches all six sections in a single RPC call", async () => {
    const { result } = renderHook(
      () => useSearchSections({ selectedCity: "CAMANAVA", committedSearch: "" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.sections).toHaveLength(6));
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith(
      "get_search_sections",
      expect.objectContaining({ p_city: "CAMANAVA", p_limit: 8 }),
    );
  });

  it("renders only the first two sections until others become viewable", async () => {
    const { result } = renderHook(
      () => useSearchSections({ selectedCity: "CAMANAVA", committedSearch: "" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.sections).toHaveLength(6));
    expect(result.current.visibleSections.map((s) => s.id)).toEqual([
      SECTION_DEFS[0].id,
      SECTION_DEFS[1].id,
    ]);

    act(() => {
      result.current.onViewableItemsChanged({
        viewableItems: [{ item: result.current.sections[3] }],
      });
    });

    expect(result.current.visibleSections.map((s) => s.id)).toContain(SECTION_DEFS[3].id);
  });

  it("refetches when the city changes", async () => {
    const { result, rerender } = renderHook(
      (props: { city: string }) =>
        useSearchSections({ selectedCity: props.city, committedSearch: "" }),
      { wrapper: createWrapper(), initialProps: { city: "CAMANAVA" } },
    );

    await waitFor(() => expect(result.current.sections).toHaveLength(6));
    rerender({ city: "Caloocan" });

    await waitFor(() => expect(mockRpc).toHaveBeenCalledTimes(2));
    expect(mockRpc).toHaveBeenLastCalledWith(
      "get_search_sections",
      expect.objectContaining({ p_city: "Caloocan" }),
    );
  });

  it("exposes the error message when the RPC fails", async () => {
    mockRpc.mockReturnValue(rpcResult({ data: null, error: new Error("rpc failed") }));

    const { result } = renderHook(
      () => useSearchSections({ selectedCity: "CAMANAVA", committedSearch: "" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.error).toBe("rpc failed"));
    expect(result.current.sections).toEqual([]);
  });
});
