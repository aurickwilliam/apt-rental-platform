import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useLandlordStats } from 'hooks/landlord'
import { useLandlordReviews } from 'hooks/ratings'
import { fetchPublicLandlordProfile } from '@/service/profiles/profilesService'

export type { LandlordProfileData } from '@/service/profiles/profilesService'

export const getPublicLandlordProfileQueryKey = (landlordId: string | undefined) =>
  ['public-landlord-profile', landlordId] as const

export function usePublicLandlordProfile(landlordId?: string) {
  const { stats, refetch: refetchStats } = useLandlordStats(landlordId)
  const { reviews, totalReviews, loading: reviewsLoading, refetch: refetchReviews } = useLandlordReviews(landlordId)

  const profileQuery = useQuery({
    queryKey: getPublicLandlordProfileQueryKey(landlordId),
    queryFn: () => fetchPublicLandlordProfile(landlordId as string),
    enabled: landlordId !== undefined,
  })

  const refetch = useCallback(() => {
    void Promise.all([profileQuery.refetch(), refetchStats(), refetchReviews()])
  }, [profileQuery.refetch, refetchStats, refetchReviews])

  return {
    profile: profileQuery.data?.profile ?? null,
    listings: profileQuery.data?.listings ?? [],
    stats,
    reviews,
    totalReviews,
    loading: profileQuery.isLoading,
    reviewsLoading,
    refetch,
  }
}