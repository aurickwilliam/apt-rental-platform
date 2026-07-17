import { useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { supabase } from '@repo/supabase'
import { formatDate } from '@repo/utils'

import { useReviewEligibility } from './useReviewEligibility'

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

type ReviewRow = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  image_paths: string[] | null
  users: {
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  } | null
  tenancy: {
    lease_start: string
    lease_end: string | null
  } | null
}

function formatLeaseDuration(
  tenancy: ReviewRow['tenancy']
): string | undefined {
  if (!tenancy?.lease_start) return undefined
  const start = formatDate(tenancy.lease_start, 'medium')
  const end = tenancy.lease_end ? formatDate(tenancy.lease_end, 'medium') : 'Present'
  return `${start} - ${end}`
}

export function useApartmentReviews(apartmentId?: string): UseApartmentReviewsResult {
  const [rawReviews, setRawReviews] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<ReviewSortOption>('Most Recent')

  const {
    canReview,
    checkingEligibility,
    reviewableTenancyId
  } = useReviewEligibility(apartmentId);

  const fetchReviews = useCallback(
    async (isRefresh = false) => {
      if (!apartmentId) return

      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select(
          `
          id,
          rating,
          comment,
          created_at,
          image_paths,
          users!reviews_tenant_id_fkey (
            first_name,
            last_name,
            avatar_url
          ),
          tenancy:tenancy_id (
            lease_start,
            lease_end
          )
        `
        )
        .eq('apartment_id', apartmentId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError(fetchError.message)
        setRawReviews([])
      } else {
        setRawReviews((data ?? []) as unknown as ReviewRow[])
      }

      if (isRefresh) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    },
    [apartmentId]
  )

  // Refetch whenever the screen regains focus
  useFocusEffect(useCallback(() => { fetchReviews() }, [fetchReviews]))

  function getReviewImageUrls(paths: string[] | null): string[] | undefined {
    if (!paths || paths.length === 0) return undefined
    const urls = paths.map(
      (path) => supabase.storage.from('review-images').getPublicUrl(path).data.publicUrl
    )
    return urls
  }

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
    loading,
    refreshing,
    error,
    overallRating,
    totalReviews,
    ratingsCount,
    reviews,
    sortBy,
    setSortBy,
    canReview,
    checkingEligibility,
    reviewableTenancyId,
    refetch: () => fetchReviews(true),
  }
}
