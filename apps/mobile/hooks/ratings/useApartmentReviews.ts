import { useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { supabase } from '@repo/supabase'

export type ReviewSortOption = 'Most Recent' | 'Highest Rating' | 'Lowest Rating'

export interface ApartmentReview {
  id: string
  name: string
  date: string
  rating: number
  review: string
  profilePictureUrl?: string
  durationOfStay?: string
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
  refetch: () => Promise<void>
}

type ReviewRow = {
  id: string
  rating: number
  comment: string | null
  stayed_date: string | null
  created_at: string
  users: {
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  } | null
}

function formatStayedDate(dateStr: string | null): string | undefined {
  if (!dateStr) return undefined
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return undefined
  return `Stayed ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
}

export function useApartmentReviews(apartmentId?: string): UseApartmentReviewsResult {
  const [rawReviews, setRawReviews] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<ReviewSortOption>('Most Recent')

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
          stayed_date,
          created_at,
          users!reviews_tenant_id_fkey (
            first_name,
            last_name,
            avatar_url
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

  // Refetch whenever the screen regains focus (e.g. returning after writing a review)
  useFocusEffect(
    useCallback(() => {
      fetchReviews()
    }, [fetchReviews])
  )

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
        durationOfStay: formatStayedDate(row.stayed_date),
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
    refetch: () => fetchReviews(true),
  }
}
