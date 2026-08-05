import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { supabase } from '@repo/supabase'

export interface LandlordReview {
  id: string
  name: string
  date: string
  rating: number
  review: string
  profilePictureUrl?: string
  images?: string[]
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
}

function getReviewImageUrls(paths: string[] | null): string[] | undefined {
  if (!paths || paths.length === 0) return undefined
  return paths.map(
    (path) => supabase.storage.from('review-images').getPublicUrl(path).data.publicUrl
  )
}

export function useLandlordReviews(landlordId?: string) {
  const [reviews, setReviews] = useState<LandlordReview[]>([])
  const [totalReviews, setTotalReviews] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchReviews = useCallback(async () => {
    if (!landlordId) {
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase
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
          )
        `
      )
      .eq('landlord_id', landlordId)
      .order('created_at', { ascending: false })
      .limit(3)

    if (error) {
      console.error('useLandlordReviews error:', error)
    } else {
      const mapped = ((data ?? []) as unknown as ReviewRow[]).map((row) => {
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
          images: getReviewImageUrls(row.image_paths),
        }
      })

      setReviews(mapped)
    }

    const { count } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('landlord_id', landlordId)

    setTotalReviews(count ?? 0)
    setLoading(false)
  }, [landlordId])

  useFocusEffect(useCallback(() => { fetchReviews() }, [fetchReviews]))

  return { reviews, totalReviews, loading, refetch: () => fetchReviews() }
}