import { useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'

import {
  LANDLORD_REVIEWS_PAGE_SIZE,
  fetchLandlordReviewsPage,
} from '@/service/ratings/reviewsService'

import type {
  LandlordReview,
  LandlordReviewSort,
} from '@/service/ratings/reviewsService'

export type {
  LandlordReview,
  LandlordReviewSort,
} from '@/service/ratings/reviewsService'

export const getLandlordReviewsPageQueryKey = (
  landlordId: string | undefined,
  sort: LandlordReviewSort
) => ['landlord-reviews', landlordId, 'list', sort] as const

function getErrorMessage(error: unknown): string | null {
  if (!error) return null
  if (error instanceof Error) return error.message
  if (
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message
  }
  return 'Failed to load reviews.'
}

export function useLandlordReviewsPage(
  landlordId?: string,
  sort: LandlordReviewSort = 'Most Recent'
) {
  const reviewsQuery = useInfiniteQuery({
    queryKey: getLandlordReviewsPageQueryKey(landlordId, sort),
    queryFn: ({ pageParam }) =>
      fetchLandlordReviewsPage(landlordId as string, {
        offset: pageParam,
        limit: LANDLORD_REVIEWS_PAGE_SIZE,
        sort,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // A short/empty page means the end, even if the count is stale.
      if (lastPage.reviews.length === 0) return undefined
      const nextOffset = allPages.length * LANDLORD_REVIEWS_PAGE_SIZE
      return nextOffset < lastPage.totalCount ? nextOffset : undefined
    },
    enabled: landlordId !== undefined,
  })

  const fetchMore = useCallback(() => {
    if (reviewsQuery.hasNextPage && !reviewsQuery.isFetchingNextPage) {
      void reviewsQuery.fetchNextPage()
    }
  }, [
    reviewsQuery.hasNextPage,
    reviewsQuery.isFetchingNextPage,
    reviewsQuery.fetchNextPage,
  ])

  const refetch = useCallback(async () => {
    await reviewsQuery.refetch()
  }, [reviewsQuery.refetch])

  const reviews: LandlordReview[] =
    reviewsQuery.data?.pages.flatMap((page) => page.reviews) ?? []

  return {
    reviews,
    totalReviews: reviewsQuery.data?.pages[0]?.totalCount ?? 0,
    loading: reviewsQuery.isLoading,
    refreshing: reviewsQuery.isRefetching && !reviewsQuery.isFetchingNextPage,
    loadingMore: reviewsQuery.isFetchingNextPage,
    error: getErrorMessage(reviewsQuery.error),
    hasMore: reviewsQuery.hasNextPage,
    fetchMore,
    refetch,
  }
}
