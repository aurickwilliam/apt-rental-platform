import { act, renderHook, waitFor } from "@testing-library/react-native";

import useSearchLogic from "./useSearchLogic";

const mockFrom = jest.fn();
const mockIsFavorite = jest.fn();
const mockToggleFavorite = jest.fn();

jest.mock("@repo/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock("@/hooks/favorites", () => ({
  useFavorites: () => ({
    isFavorite: mockIsFavorite,
    toggleFavorite: mockToggleFavorite,
  }),
}));

describe("useSearchLogic", () => {
  /** Validates: Requirements 2.16 */
  it("requests an exact total while preserving the first page range", async () => {
    let query: {
      select: jest.Mock;
      is: jest.Mock;
      in: jest.Mock;
      range: jest.Mock;
      order: jest.Mock;
    };
    query = {
      select: jest.fn(() => query),
      is: jest.fn(() => query),
      in: jest.fn(() => query),
      range: jest.fn(() => query),
      order: jest.fn(),
    };
    query.order.mockReturnValueOnce(query).mockResolvedValueOnce({
      data: [
        {
          id: "apartment-1",
          name: "Apartment One",
          barangay: "Barangay One",
          city: "Caloocan",
          average_rating: 4.5,
          monthly_rent: 12000,
          no_bedrooms: 1,
          no_bathrooms: 1,
          area_sqm: 24,
          is_verified: true,
          apartment_images: [],
        },
      ],
      error: null,
      count: 1,
    });
    mockFrom.mockReturnValue(query);

    const { result, unmount } = renderHook(() => useSearchLogic());

    await waitFor(() => expect(result.current.resultCount).toBe(1));

    expect(query.select).toHaveBeenCalledWith(expect.any(String), { count: "estimated" });
    expect(query.range).toHaveBeenCalledWith(0, 9);
    expect(result.current.apartments).toHaveLength(1);

    unmount();
  });

  it("only fetches with the committed search term after commitSearch is called", async () => {
    let query: {
      select: jest.Mock;
      is: jest.Mock;
      in: jest.Mock;
      or: jest.Mock;
      range: jest.Mock;
      order: jest.Mock;
    };
    let orderCallCount = 0;
    query = {
      select: jest.fn(() => query),
      is: jest.fn(() => query),
      in: jest.fn(() => query),
      or: jest.fn(() => query),
      range: jest.fn(() => query),
      order: jest.fn(() => {
        orderCallCount += 1;
        return orderCallCount % 2 === 1
          ? query
          : Promise.resolve({ data: [], error: null, count: 0 });
      }),
    };
    mockFrom.mockReturnValue(query);

    const { result, unmount } = renderHook(() => useSearchLogic());

    await waitFor(() => expect(result.current.resultCount).toBe(0));

    act(() => {
      result.current.setSearchDraft("studio");
    });

    expect(result.current.searchDraft).toBe("studio");
    expect(result.current.committedSearch).toBe("");
    expect(query.or).not.toHaveBeenCalled();

    act(() => {
      result.current.commitSearch("studio");
    });

    await waitFor(() => expect(result.current.committedSearch).toBe("studio"));
    await waitFor(() =>
      expect(query.or).toHaveBeenCalledWith(
        expect.stringContaining("name.ilike.%studio%"),
      ),
    );

    unmount();
  });

  it("clears both the draft and the committed search, reverting to the default browse state", async () => {
    let query: {
      select: jest.Mock;
      is: jest.Mock;
      in: jest.Mock;
      or: jest.Mock;
      range: jest.Mock;
      order: jest.Mock;
    };
    let orderCallCount = 0;
    query = {
      select: jest.fn(() => query),
      is: jest.fn(() => query),
      in: jest.fn(() => query),
      or: jest.fn(() => query),
      range: jest.fn(() => query),
      order: jest.fn(() => {
        orderCallCount += 1;
        return orderCallCount % 2 === 1
          ? query
          : Promise.resolve({ data: [], error: null, count: 0 });
      }),
    };
    mockFrom.mockReturnValue(query);

    const { result, unmount } = renderHook(() => useSearchLogic());

    await waitFor(() => expect(result.current.resultCount).toBe(0));

    act(() => {
      result.current.commitSearch("studio");
    });
    await waitFor(() => expect(result.current.committedSearch).toBe("studio"));

    act(() => {
      result.current.setSearchDraft("studio apartment");
    });
    expect(result.current.searchDraft).toBe("studio apartment");

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchDraft).toBe("");
    expect(result.current.committedSearch).toBe("");

    unmount();
  });
});
