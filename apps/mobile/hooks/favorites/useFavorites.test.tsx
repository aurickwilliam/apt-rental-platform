import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import fc from "fast-check";

import {
  getFavoriteApartmentsQueryKey,
  getFavoritesQueryKey,
  useFavoriteApartments,
  useFavorites,
} from "./useFavorites";
import { createMobileQueryClient } from "@/utils/queryClient";

const TENANT_ID = "tenant-1";
const mockUseCurrentUser = jest.fn();
const mockDeleteFavorite = jest.fn();
const mockFetchApartmentsByIds = jest.fn();
const mockFetchFavoriteApartmentIds = jest.fn();
const mockInsertFavorite = jest.fn();

jest.mock("@/hooks/auth", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

jest.mock("@/service/favoritesService", () => ({
  deleteFavorite: (...args: unknown[]) => mockDeleteFavorite(...args),
  fetchApartmentsByIds: (...args: unknown[]) => mockFetchApartmentsByIds(...args),
  fetchFavoriteApartmentIds: (...args: unknown[]) => mockFetchFavoriteApartmentIds(...args),
  insertFavorite: (...args: unknown[]) => mockInsertFavorite(...args),
}));

function createWrapper() {
  const client = createMobileQueryClient();

  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  return { client, QueryWrapper };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseCurrentUser.mockReturnValue({
    data: { id: TENANT_ID },
    isLoading: false,
    error: null,
  });
  mockFetchFavoriteApartmentIds.mockResolvedValue(["apartment-2", "apartment-1"]);
  mockFetchApartmentsByIds.mockResolvedValue([
    { id: "apartment-1", apartment_images: [] },
    { id: "apartment-2", apartment_images: [] },
  ]);
  mockInsertFavorite.mockResolvedValue({ id: "favorite-1" });
  mockDeleteFavorite.mockResolvedValue(undefined);
});

describe("favorite query hooks", () => {
  /** Validates: Requirements 2.1, 2.7 */
  it("shares one fresh favorite-id request between simultaneous consumers", async () => {
    const { client, QueryWrapper } = createWrapper();
    const first = renderHook(() => useFavorites(), { wrapper: QueryWrapper });
    const second = renderHook(() => useFavorites(), { wrapper: QueryWrapper });

    await waitFor(() => expect(first.result.current.favoriteApartmentIds.size).toBe(2));
    await waitFor(() => expect(second.result.current.favoriteApartmentIds.size).toBe(2));

    expect(mockFetchFavoriteApartmentIds).toHaveBeenCalledTimes(1);

    first.unmount();
    second.unmount();
    client.clear();
  });

  /** Validates: Requirements 2.1, 2.7 */
  it("Property 1: generated simultaneous favorite consumers coalesce to one read", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 2, max: 4 }), async (consumerCount) => {
        const { client, QueryWrapper } = createWrapper();
        mockFetchFavoriteApartmentIds.mockClear();

        const consumers = Array.from({ length: consumerCount }, () =>
          renderHook(() => useFavorites(), { wrapper: QueryWrapper }),
        );

        await Promise.all(
          consumers.map(({ result }) =>
            waitFor(() => expect(result.current.favoriteApartmentIds.size).toBe(2)),
          ),
        );

        expect(mockFetchFavoriteApartmentIds).toHaveBeenCalledTimes(1);

        consumers.forEach(({ unmount }) => unmount());
        client.clear();
      }),
      { numRuns: 10 },
    );
  });

  /** Validates: Requirements 2.7, 3.1 */
  it("optimistically updates the exact favorite key and invalidates only favorite apartments", async () => {
    const { client, QueryWrapper } = createWrapper();
    const { result, unmount } = renderHook(() => useFavorites(), { wrapper: QueryWrapper });

    await waitFor(() => expect(result.current.favoriteApartmentIds.has("apartment-1")).toBe(true));
    client.setQueryData(getFavoriteApartmentsQueryKey(TENANT_ID), [{ id: "apartment-1" }]);

    await act(async () => {
      await result.current.toggleFavorite("apartment-1");
    });

    expect(mockDeleteFavorite).toHaveBeenCalledWith(TENANT_ID, "apartment-1");
    expect(client.getQueryData(getFavoritesQueryKey(TENANT_ID))).toEqual(["apartment-2"]);
    expect(client.getQueryState(getFavoriteApartmentsQueryKey(TENANT_ID))?.isInvalidated).toBe(true);

    unmount();
    client.clear();
  });

  /** Validates: Requirements 2.7, 3.1 */
  it("preserves a later successful toggle when an earlier toggle fails", async () => {
    const { client, QueryWrapper } = createWrapper();
    const { result, unmount } = renderHook(() => useFavorites(), { wrapper: QueryWrapper });
    let rejectFirstInsert: (reason?: unknown) => void = () => undefined;

    mockInsertFavorite
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectFirstInsert = reject;
          }),
      )
      .mockResolvedValueOnce({ id: "favorite-b" });

    await waitFor(() => expect(result.current.favoriteApartmentIds.size).toBe(2));
    client.setQueryData(getFavoritesQueryKey(TENANT_ID), []);
    client.setQueryData(getFavoriteApartmentsQueryKey(TENANT_ID), []);

    let firstToggle: Promise<{ wasFavorite: boolean }> | undefined;
    await act(async () => {
      firstToggle = result.current.toggleFavorite("apartment-a");
    });
    await waitFor(() =>
      expect(client.getQueryData(getFavoritesQueryKey(TENANT_ID))).toEqual(["apartment-a"]),
    );

    await act(async () => {
      await result.current.toggleFavorite("apartment-b");
    });
    expect(client.getQueryData(getFavoritesQueryKey(TENANT_ID))).toEqual([
      "apartment-b",
      "apartment-a",
    ]);

    let firstToggleError: unknown;
    await act(async () => {
      rejectFirstInsert(new Error("Could not add apartment-a"));
      try {
        await firstToggle;
      } catch (error) {
        firstToggleError = error;
      }
    });

    expect(firstToggleError).toEqual(new Error("Could not add apartment-a"));
    expect(client.getQueryData(getFavoritesQueryKey(TENANT_ID))).toEqual(["apartment-b"]);
    expect(client.getQueryState(getFavoriteApartmentsQueryKey(TENANT_ID))?.isInvalidated).toBe(
      true,
    );

    unmount();
    client.clear();
  });

  /** Validates: Requirements 2.1, 2.7 */
  it("shares ordered favorite-apartment reads through the tenant-scoped query keys", async () => {
    const { client, QueryWrapper } = createWrapper();
    const first = renderHook(() => useFavoriteApartments(), { wrapper: QueryWrapper });
    const second = renderHook(() => useFavoriteApartments(), { wrapper: QueryWrapper });

    await waitFor(() =>
      expect(first.result.current.favoriteApartments.map((apartment) => apartment.id)).toEqual([
        "apartment-2",
        "apartment-1",
      ]),
    );
    await waitFor(() => expect(second.result.current.favoriteApartments).toHaveLength(2));

    expect(mockFetchFavoriteApartmentIds).toHaveBeenCalledTimes(1);
    expect(mockFetchApartmentsByIds).toHaveBeenCalledTimes(1);

    first.unmount();
    second.unmount();
    client.clear();
  });
});
