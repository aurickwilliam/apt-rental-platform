import { useQuery } from '@tanstack/react-query'

import { useCurrentUser } from '@/hooks/auth'
import { fetchReviewEligibility } from '@/service/ratings/reviewsService'

export const getReviewEligibilityQueryKey = (apartmentId: string, tenantId: string) =>
  ['review-eligibility', apartmentId, tenantId] as const

interface UseReviewEligibilityResult {
  canReview: boolean
  checkingEligibility: boolean
  reviewableTenancyId: string | null
  refetch: () => Promise<unknown>
}

export function useReviewEligibility(apartmentId?: string): UseReviewEligibilityResult {
  const currentUserQuery = useCurrentUser()
  const tenantId = currentUserQuery.data?.id ?? null

  const eligibilityQuery = useQuery({
    queryKey: ['review-eligibility', apartmentId, tenantId] as const,
    queryFn: () => fetchReviewEligibility(apartmentId as string, tenantId as string),
    enabled: apartmentId !== undefined && tenantId !== null,
  })

  return {
    canReview: eligibilityQuery.data !== null && eligibilityQuery.data !== undefined,
    checkingEligibility: currentUserQuery.isLoading || eligibilityQuery.isLoading,
    reviewableTenancyId: eligibilityQuery.data ?? null,
    refetch: eligibilityQuery.refetch,
  }
}