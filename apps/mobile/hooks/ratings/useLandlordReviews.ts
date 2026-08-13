import { useQuery } from '@tanstack/react-query'

import { fetchLandlordReviews } from '@/service/reviewsService'

export type { LandlordReview } from '@/service/reviewsService'

export const getLandlordReviewsQueryKey = (landlordId: string | undefined) =>
  ['landlord-reviews', landlordId] as const

export function useLandlordReviews(landlordId?: string) {
  const reviewsQuery = useQuery({
    queryKey: getLandlordReviewsQueryKey(landlordId),
    queryFn: () => fetchLandlordReviews(landlordId as string),
    enabled: landlordId !== undefined,
  })

  return {
    reviews: reviewsQuery.data?.reviews ?? [],
    totalReviews: reviewsQuery.data?.totalCount ?? 0,
    loading: reviewsQuery.isLoading,
    refetch: reviewsQuery.refetch,
  }
}