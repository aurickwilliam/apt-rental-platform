import { act, renderHook, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import useSearchLogic from "./useSearchLogic";

const mockFrom = jest.fn();
const mockGetUser = jest.fn();
const mockIsFavorite = jest.fn();
const mockToggleFavorite = jest.fn();

jest.mock("@repo/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
  },
}));

jest.mock("@/hooks/favorites", () => ({
  useFavorites: () => ({
    isFavorite: mockIsFavorite,
    toggleFavorite: mockToggleFavorite,
  }),
}));

describe("useSearchLogic", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  /** Validates: Requirements 2.16 */
  it("requests an exact total while preserving the first page range", async () => {
    let query: {
      select: jest.Mock;
      is: jest.Mock;
      eq: jest.Mock;
      in: jest.Mock;
      range: jest.Mock;
      order: jest.Mock;
    };
    query = {
      select: jest.fn(() => query),
      is: jest.fn(() => query),
      eq: jest.fn(() => query),
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
    expect(query.eq).toHaveBeenCalledWith("is_hidden_by_admin", false);
    expect(query.range).toHaveBeenCalledWith(0, 9);
    expect(result.current.apartments).toHaveLength(1);

    unmount();
  });

  it("only fetches with the committed search term after commitSearch is called", async () => {
    let query: {
      select: jest.Mock;
      is: jest.Mock;
      eq: jest.Mock;
      in: jest.Mock;
      or: jest.Mock;
      range: jest.Mock;
      order: jest.Mock;
    };
    let orderCallCount = 0;
    query = {
      select: jest.fn(() => query),
      is: jest.fn(() => query),
      eq: jest.fn(() => query),
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
      eq: jest.Mock;
      in: jest.Mock;
      or: jest.Mock;
      range: jest.Mock;
      order: jest.Mock;
    };
    let orderCallCount = 0;
    query = {
      select: jest.fn(() => query),
      is: jest.fn(() => query),
      eq: jest.fn(() => query),
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

  it("restores the account's saved browse inputs on mount and queries with them", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "account-a" } } });
    await AsyncStorage.setItem(
      "apt-search:account-a",
      JSON.stringify({
        city: "Caloocan",
        committedSearch: "studio",
        filters: {
          budget: [5000, 20000],
          unitTypes: ["Studio"],
          sortBy: "price_asc",
          bedrooms: "Any",
          bathrooms: "Any",
          sizeRange: [10, 300],
          furnishing: ["Semi-Furnished"],
          floorLevel: ["Low Floor (1–5F)"],
          leaseDuration: ["6 Months"],
          amenities: [],
          verifiedOnly: false,
        },
        isGridView: false,
      }),
    );

    let query: {
      select: jest.Mock;
      is: jest.Mock;
      eq: jest.Mock;
      in: jest.Mock;
      or: jest.Mock;
      range: jest.Mock;
      order: jest.Mock;
    };
    let orderCallCount = 0;
    query = {
      select: jest.fn(() => query),
      is: jest.fn(() => query),
      eq: jest.fn(() => query),
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

    await waitFor(() => expect(result.current.committedSearch).toBe("studio"));
    expect(result.current.selectedCity).toBe("Caloocan");
    expect(result.current.isGridView).toBe(false);
    expect(result.current.filters?.budget).toEqual([5000, 20000]);
    expect(result.current.filters?.sortBy).toBe("price_asc");
    await waitFor(() =>
      expect(query.or).toHaveBeenCalledWith(
        expect.stringContaining("name.ilike.%studio%"),
      ),
    );
    await waitFor(() =>
      expect(query.eq).toHaveBeenCalledWith("city", "Caloocan"),
    );

    unmount();
  });

  it("persists committed browse inputs under the account key", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "account-a" } } });
    let query: {
      select: jest.Mock;
      is: jest.Mock;
      eq: jest.Mock;
      in: jest.Mock;
      or: jest.Mock;
      range: jest.Mock;
      order: jest.Mock;
    };
    let orderCallCount = 0;
    query = {
      select: jest.fn(() => query),
      is: jest.fn(() => query),
      eq: jest.fn(() => query),
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
      result.current.commitSearch("loft");
    });

    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "apt-search:account-a",
        expect.stringContaining("loft"),
      ),
    );

    unmount();
  });

  it("falls back to defaults when the stored preference is corrupted", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "account-a" } } });
    await AsyncStorage.setItem("apt-search:account-a", "{{{not json");
    let query: {
      select: jest.Mock;
      is: jest.Mock;
      eq: jest.Mock;
      in: jest.Mock;
      range: jest.Mock;
      order: jest.Mock;
    };
    let orderCallCount = 0;
    query = {
      select: jest.fn(() => query),
      is: jest.fn(() => query),
      eq: jest.fn(() => query),
      in: jest.fn(() => query),
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
    expect(result.current.committedSearch).toBe("");
    expect(result.current.selectedCity).toBe("CAMANAVA");
    expect(result.current.filters).toBeNull();

    unmount();
  });
});
