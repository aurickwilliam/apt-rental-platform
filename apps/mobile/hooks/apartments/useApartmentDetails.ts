import { useQuery } from '@tanstack/react-query';

import {
  fetchApartmentDetails,
  fetchApartmentReviewsPreview,
} from '@/service/apartments/apartmentDetailsService';

export type { ApartmentDetails, ReviewWithTenant } from '@/service/apartments/apartmentDetailsService';

export const getApartmentDetailsQueryKey = (apartmentId: string | undefined) =>
  ['apartment-details', apartmentId] as const;

export const getApartmentReviewsPreviewQueryKey = (apartmentId: string | undefined) =>
  ['apartment-reviews-preview', apartmentId] as const;

type UseApartmentDetailsOptions = {
  /** Skips the review-preview fetch entirely when the screen does not render reviews. */
  includeReviews?: boolean;
};

export function useApartmentDetails(
  apartmentId: string,
  options: UseApartmentDetailsOptions = {}
) {
  const includeReviews = options.includeReviews ?? true;

  const apartmentQuery = useQuery({
    queryKey: getApartmentDetailsQueryKey(apartmentId),
    queryFn: () => fetchApartmentDetails(apartmentId as string),
    enabled: !!apartmentId,
  });

  const reviewsQuery = useQuery({
    queryKey: getApartmentReviewsPreviewQueryKey(apartmentId),
    queryFn: () => fetchApartmentReviewsPreview(apartmentId as string),
    enabled: !!apartmentId && includeReviews,
  });

  const error = apartmentQuery.error?.message ?? (includeReviews ? reviewsQuery.error?.message ?? null : null);

  return {
    apartment: apartmentQuery.data ?? null,
    reviews: includeReviews ? (reviewsQuery.data ?? []) : [],
    loading: apartmentQuery.isLoading || (includeReviews && reviewsQuery.isLoading),
    error,
    refetch: apartmentQuery.refetch,
  };
}