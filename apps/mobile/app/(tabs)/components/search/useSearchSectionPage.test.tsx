import React from "react";
import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SECTION_PAGE_SIZE, useSearchSectionPage } from "./useSearchSectionPage";

const mockRpc = jest.fn();

jest.mock("@repo/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

const rows = (count: number, start = 0) =>
  Array.from({ length: count }, (_, i) => ({
    id: `a${start + i}`,
    name: `Apt ${start + i}`,
    barangay: "Brgy 1",
    city: "Caloocan",
    average_rating: 4,
    monthly_rent: 8000,
    apartment_images: [],
  }));

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe("useSearchSectionPage", () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it("requests the next page using an offset and stops on a short page", async () => {
    mockRpc
      .mockReturnValueOnce({ abortSignal: () => Promise.resolve({ data: rows(SECTION_PAGE_SIZE), error: null }) })
      .mockReturnValueOnce({ abortSignal: () => Promise.resolve({ data: rows(3, SECTION_PAGE_SIZE), error: null }) });

    const { result } = renderHook(
      () => useSearchSectionPage({ sectionId: "verified", selectedCity: "CAMANAVA", committedSearch: "" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(1));
    expect(result.current.hasNextPage).toBe(true);
    expect(mockRpc).toHaveBeenLastCalledWith(
      "get_search_section_page",
      expect.objectContaining({ p_section_id: "verified", p_offset: 0, p_limit: SECTION_PAGE_SIZE }),
    );

    await result.current.fetchNextPage();

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(mockRpc).toHaveBeenLastCalledWith(
      "get_search_section_page",
      expect.objectContaining({ p_offset: SECTION_PAGE_SIZE }),
    );
    expect(result.current.data?.pages.flat()).toHaveLength(SECTION_PAGE_SIZE + 3);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("does not fetch when disabled", () => {
    renderHook(
      () => useSearchSectionPage({ sectionId: "for_you", selectedCity: "CAMANAVA", committedSearch: "", enabled: false }),
      { wrapper: createWrapper() },
    );
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
