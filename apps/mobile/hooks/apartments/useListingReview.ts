import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchListingReviewState, requestListingReview } from "@/service/apartments/listingReviewService";

export const getListingReviewQueryKey = (apartmentId: string | null) =>
  ["listing-review", apartmentId] as const;

/** Whether an admin hid this listing, why, and the state of the landlord's review request. */
export function useListingReview(apartmentId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = getListingReviewQueryKey(apartmentId);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchListingReviewState(apartmentId as string),
    enabled: apartmentId !== null,
  });

  const request = useMutation({
    mutationFn: (note: string) => requestListingReview(apartmentId as string, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { state: query.data ?? null, request };
}
