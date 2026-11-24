import React from "react";
import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { cardRow, createSupabaseRecorder, poolRow, POOL_SELECT } from "@/tests/search/supabaseRecorder";
import { SECTION_DEFS, useSearchSections } from "./useSearchSections";

const mockState: { client: ReturnType<typeof createSupabaseRecorder>["client"] | null } = { client: null };

jest.mock("@repo/supabase", () => ({
  supabase: {
    from: (table: string) => mockState.client!.from(table),
    rpc: (name: string, args: unknown) => mockState.client!.rpc(name, args),
  },
}));

const apartment = (id: string, city = "Caloocan") => cardRow(id, { city });

const sectionsPayload = SECTION_DEFS.map((def, i) => ({
  id: def.id,
  title: def.title,
  apartments: [apartment(`a${i}`)],
}));

let rowCounter = 0;

function useRecorder(options: Partial<Parameters<typeof createSupabaseRecorder>[0]> = {}) {
  const recorder = createSupabaseRecorder({
    answer: () => [cardRow(`row-${rowCounter++}`)],
    rpcSections: sectionsPayload,
    ...options,
  });
  mockState.client = recorder.client;
  return recorder;
}

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe("useSearchSections", () => {
  it("loads the six fixed rows in one RPC and pads the page to nine", async () => {
    const r = useRecorder();
    const { result } = await renderHook(
      () => useSearchSections({ selectedCity: "CAMANAVA", committedSearch: "" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.sections).toHaveLength(9));
    expect(r.rpcCalls).toHaveLength(1);
    expect(r.rpcCalls[0]).toEqual(["get_search_sections", expect.objectContaining({ p_city: "CAMANAVA", p_limit: 15 })]);
    expect(result.current.sections.slice(0, 6).map((section) => section.id)).toEqual(SECTION_DEFS.map((def) => def.id));
  });

  it("refetches when the city changes, showing only the fixed rows for a city", async () => {
    const r = useRecorder();
    const { result, rerender } = await renderHook(
      (props: { city: string }) =>
        useSearchSections({ selectedCity: props.city, committedSearch: "" }),
      { wrapper: createWrapper(), initialProps: { city: "CAMANAVA" } },
    );

    await waitFor(() => expect(result.current.sections).toHaveLength(9));
    await rerender({ city: "Caloocan" });

    await waitFor(() => expect(r.rpcCalls).toHaveLength(2));
    expect(r.rpcCalls[1]).toEqual(["get_search_sections", expect.objectContaining({ p_city: "Caloocan" })]);
    await waitFor(() => expect(result.current.sections).toHaveLength(6));
  });

  it("builds the rows from saved preferences and reloads when they change", async () => {
    const r = useRecorder({
      answer: (call) => {
        const byId = call.ops.find((op) => op[0] === "in" && op[1] === "id");
        if (byId) return (byId[2] as string[]).map((id) => cardRow(id));
        if (call.select === POOL_SELECT) return [poolRow("p1")];
        return [cardRow(`row-${rowCounter++}`)];
      },
    });
    const preferences = {
      selectedCities: ["Caloocan"], budgetMin: 5000, budgetMax: 100000, bedroomCount: null,
      householdSize: null, hasPets: false, hasParking: false, hasSmoker: false, hasDisability: false,
    } as never;
    const { result, rerender } = await renderHook(
      (props: { prefs: never }) =>
        useSearchSections({ selectedCity: "CAMANAVA", committedSearch: "", preferences: props.prefs }),
      { wrapper: createWrapper(), initialProps: { prefs: preferences } },
    );

    await waitFor(() => expect(result.current.sections).toHaveLength(9));
    expect(result.current.sections.slice(0, 2).map((section) => section.id)).toEqual(["for_you", "city:Caloocan"]);
    expect(r.rpcCalls).toHaveLength(0);

    await rerender({ prefs: { ...(preferences as object), hasPets: true } as never });
    await waitFor(() => expect(result.current.sections.some((section) => section.id === "pets")).toBe(true));
  });

  it("exposes the error message when the RPC fails", async () => {
    useRecorder({ rpcError: new Error("rpc failed") });

    const { result } = await renderHook(
      () => useSearchSections({ selectedCity: "CAMANAVA", committedSearch: "" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.error).toBe("rpc failed"));
    expect(result.current.sections).toEqual([]);
  });
});
