import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { cardRow, createSupabaseRecorder } from "@/tests/search/supabaseRecorder";
import { BROWSE_ROW_PAGE_SIZE, useBrowseRowPage } from "./useBrowseRowPage";

const mockState: { client: ReturnType<typeof createSupabaseRecorder>["client"] | null } = { client: null };

jest.mock("@repo/supabase", () => ({
  supabase: { from: (table: string) => mockState.client!.from(table) },
}));

const spec = {
  id: "pets",
  title: "Pet-Friendly Homes",
  subtitle: "",
  criteria: { amenities: ["petfriendly"] },
  sort: "rating" as const,
};

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

const pageOf = (count: number, start = 0) => Array.from({ length: count }, (_, i) => cardRow(`a${start + i}`));

describe("useBrowseRowPage", () => {
  it("pages the row by offset and stops at a short page", async () => {
    const recorder = createSupabaseRecorder({
      answer: (call) => {
        const range = call.ops.find((op) => op[0] === "range")!;
        const offset = range[1] as number;
        return offset === 0 ? pageOf(BROWSE_ROW_PAGE_SIZE) : pageOf(4, offset);
      },
    });
    mockState.client = recorder.client;

    const { result } = renderHook(() => useBrowseRowPage({ spec }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(1));
    expect(result.current.hasNextPage).toBe(true);
    expect(recorder.has(recorder.calls[0], "range", 0, 9)).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });
    expect(recorder.has(recorder.calls[1], "range", 10, 19)).toBe(true);
    expect(result.current.data?.pages.flat()).toHaveLength(BROWSE_ROW_PAGE_SIZE + 4);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("does not fetch without a spec or when disabled", () => {
    const recorder = createSupabaseRecorder({ answer: () => [] });
    mockState.client = recorder.client;
    renderHook(() => useBrowseRowPage({ spec: null }), { wrapper: createWrapper() });
    renderHook(() => useBrowseRowPage({ spec, enabled: false }), { wrapper: createWrapper() });
    expect(recorder.calls).toHaveLength(0);
  });
});
