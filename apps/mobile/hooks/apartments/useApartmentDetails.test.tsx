import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { useApartmentDetails } from "./useApartmentDetails";
import { createMobileQueryClient } from "@/utils/queryClient";

const APARTMENT_ID = "apartment-1";
const mockFetchApartmentDetails = jest.fn();
const mockFetchReviewsPreview = jest.fn();

jest.mock("@/service/apartmentDetailsService", () => ({
  fetchApartmentDetails: (...args: unknown[]) => mockFetchApartmentDetails(...args),
  fetchApartmentReviewsPreview: (...args: unknown[]) => mockFetchReviewsPreview(...args),
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
  mockFetchApartmentDetails.mockResolvedValue({ id: APARTMENT_ID, name: "APT Homes" });
  mockFetchReviewsPreview.mockResolvedValue([{ id: "review-1", rating: 5 }]);
});

describe("useApartmentDetails", () => {
  it("fetches apartment details with the keyed query and default review preview", async () => {
    const { QueryWrapper } = createWrapper();

    const { result, unmount } = renderHook(() => useApartmentDetails(APARTMENT_ID), {
      wrapper: QueryWrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetchApartmentDetails).toHaveBeenCalledWith(APARTMENT_ID);
    expect(mockFetchReviewsPreview).toHaveBeenCalledWith(APARTMENT_ID);
    expect(result.current.apartment?.name).toBe("APT Homes");
    expect(result.current.reviews).toHaveLength(1);

    unmount();
  });

  it("skips the review preview when includeReviews is false (m5)", async () => {
    const { QueryWrapper } = createWrapper();

    const { result, unmount } = renderHook(
      () => useApartmentDetails(APARTMENT_ID, { includeReviews: false }),
      { wrapper: QueryWrapper },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetchReviewsPreview).not.toHaveBeenCalled();
    expect(result.current.reviews).toEqual([]);

    unmount();
  });

  it("does not fetch before an apartment id exists", async () => {
    const { QueryWrapper } = createWrapper();

    const { result, unmount } = renderHook(() => useApartmentDetails(""), {
      wrapper: QueryWrapper,
    });

    expect(mockFetchApartmentDetails).not.toHaveBeenCalled();

    unmount();
  });

  it("surfaces apartment errors without a full-screen failure", async () => {
    mockFetchApartmentDetails.mockRejectedValue(new Error("RLS blocked"));
    const { QueryWrapper } = createWrapper();

    const { result, unmount } = renderHook(() => useApartmentDetails(APARTMENT_ID), {
      wrapper: QueryWrapper,
    });

    await waitFor(() => expect(result.current.error).toBe("RLS blocked"));
    expect(result.current.apartment).toBeNull();

    unmount();
  });
});
