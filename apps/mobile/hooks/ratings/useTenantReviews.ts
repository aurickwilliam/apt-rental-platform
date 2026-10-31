import { useQuery } from '@tanstack/react-query'

import { fetchTenantReviews } from '@/service/ratings/tenantReviewService'

export type { TenantReview } from '@/service/ratings/tenantReviewService'

export const getTenantReviewsQueryKey = (tenantId: string | undefined) =>
  ['tenant-reviews', tenantId] as const

export function useTenantReviews(tenantId?: string) {
  const reviewsQuery = useQuery({
    queryKey: getTenantReviewsQueryKey(tenantId),
    queryFn: () => fetchTenantReviews(tenantId as string),
    enabled: tenantId !== undefined,
  })

  return {
    reviews: reviewsQuery.data?.reviews ?? [],
    average: reviewsQuery.data?.average ?? 0,
    count: reviewsQuery.data?.count ?? 0,
    loading: reviewsQuery.isLoading,
    isError: reviewsQuery.isError,
    refetch: reviewsQuery.refetch,
  }
}
