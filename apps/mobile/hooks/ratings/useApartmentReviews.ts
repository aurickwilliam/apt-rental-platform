import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatDate } from '@repo/utils'

import { useReviewEligibility } from './useReviewEligibility'
import { fetchApartmentReviews, getReviewImageUrls } from '@/service/reviewsService'

import type { ApartmentReviewRow } from '@/service/reviewsService'

export type ReviewSortOption = 'Most Recent' | 'Highest Rating' | 'Lowest Rating'

export interface ApartmentReview {
  id: string
  name: string
  date: string
  rating: number
  review: string
  profilePictureUrl?: string
  durationOfStay?: string
  images?: string[]
}

export interface RatingBarCountData {
  rating: number
  ratingCount: number
  totalCount: number
}

interface UseApartmentReviewsResult {
  loading: boolean
  refreshing: boolean
  error: string | null
  overallRating: number
  totalReviews: number
  ratingsCount: RatingBarCountData[]
  reviews: ApartmentReview[]
  sortBy: ReviewSortOption
  setSortBy: (option: ReviewSortOption) => void
  canReview: boolean
  checkingEligibility: boolean
  reviewableTenancyId: string | null
  refetch: () => Promise<void>
}

export const getApartmentReviewsQueryKey = (apartmentId: string | undefined) =>
  ['apartment-reviews', apartmentId] as const

function formatLeaseDuration(
  tenancy: ApartmentReviewRow['tenancy']
): string | undefined {
  if (!tenancy?.lease_start) return undefined
  const start = formatDate(tenancy.lease_start, 'medium')
  const end = tenancy.lease_end ? formatDate(tenancy.lease_end, 'medium') : 'Present'
  return `${start} - ${end}`
}

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

export function useApartmentReviews(apartmentId?: string): UseApartmentReviewsResult {
  const [sortBy, setSortBy] = useState<ReviewSortOption>('Most Recent')

  const {
    canReview,
    checkingEligibility,
    reviewableTenancyId
  } = useReviewEligibility(apartmentId);

  const reviewsQuery = useQuery({
    queryKey: getApartmentReviewsQueryKey(apartmentId),
    queryFn: () => fetchApartmentReviews(apartmentId as string),
    enabled: apartmentId !== undefined,
  })

  const rawReviews = reviewsQuery.data ?? []

  const reviews = useMemo<ApartmentReview[]>(() => {
    const mapped = rawReviews.map((row) => {
      const firstName = row.users?.first_name ?? ''
      const lastName = row.users?.last_name ?? ''
      const name = `${firstName} ${lastName}`.trim() || 'Anonymous Tenant'

      return {
        id: row.id,
        name,
        date: row.created_at,
        rating: Number(row.rating),
        review: row.comment ?? '',
        profilePictureUrl: row.users?.avatar_url ?? undefined,
        durationOfStay: formatLeaseDuration(row.tenancy),
        images: getReviewImageUrls(row.image_paths),
      }
    })

    const sorted = [...mapped]
    switch (sortBy) {
      case 'Highest Rating':
        sorted.sort(
          (a, b) => b.rating - a.rating || new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        break
      case 'Lowest Rating':
        sorted.sort(
          (a, b) => a.rating - b.rating || new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        break
      case 'Most Recent':
      default:
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        break
    }

    return sorted
  }, [rawReviews, sortBy])

  const totalReviews = rawReviews.length

  const overallRating = useMemo(() => {
    if (totalReviews === 0) return 0
    const sum = rawReviews.reduce((acc, row) => acc + Number(row.rating), 0)
    return Math.round((sum / totalReviews) * 10) / 10
  }, [rawReviews, totalReviews])

  const ratingsCount = useMemo<RatingBarCountData[]>(() => {
    const buckets = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      ratingCount: 0,
      totalCount: totalReviews,
    }))

    rawReviews.forEach((row) => {
      const bucketRating = Math.min(5, Math.max(1, Math.round(Number(row.rating))))
      const bucket = buckets.find((b) => b.rating === bucketRating)
      if (bucket) bucket.ratingCount += 1
    })

    return buckets
  }, [rawReviews, totalReviews])

  return {
    loading: reviewsQuery.isLoading,
    refreshing: reviewsQuery.isFetching && !reviewsQuery.isLoading,
    error: getErrorMessage(reviewsQuery.error),
    overallRating,
    totalReviews,
    ratingsCount,
    reviews,
    sortBy,
    setSortBy,
    canReview,
    checkingEligibility,
    reviewableTenancyId,
    refetch: async () => {
      await reviewsQuery.refetch();
    },
  }
}