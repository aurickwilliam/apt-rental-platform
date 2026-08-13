import { renderHook, waitFor } from "@testing-library/react-native";

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
      range: jest.Mock;
      order: jest.Mock;
    };
    query = {
      select: jest.fn(() => query),
      is: jest.fn(() => query),
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
});
