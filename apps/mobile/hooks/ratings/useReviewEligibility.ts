import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { supabase } from '@repo/supabase'
import { useProfile } from 'hooks/auth'

interface UseReviewEligibilityResult {
  canReview: boolean
  checkingEligibility: boolean
  reviewableTenancyId: string | null
  refetch: () => Promise<void>
}

export function useReviewEligibility(apartmentId?: string): UseReviewEligibilityResult {
  const { profile, loading: profileLoading } = useProfile()
  const [canReview, setCanReview] = useState(false)
  const [reviewableTenancyId, setReviewableTenancyId] = useState<string | null>(null)
  const [checkingEligibility, setCheckingEligibility] = useState(true)

  const checkEligibility = useCallback(async () => {
    if (!apartmentId || !profile?.id) {
      setCanReview(false)
      setReviewableTenancyId(null)
      setCheckingEligibility(profileLoading)
      return
    }

    setCheckingEligibility(true)

    const { data, error } = await supabase
      .from('tenancies')
      .select('id, lease_end, reviews(id)')
      .eq('apartment_id', apartmentId)
      .eq('tenant_id', profile.id)
      .order('lease_end', { ascending: false, nullsFirst: false })

    if (error || !data) {
      setCanReview(false)
      setReviewableTenancyId(null)
      setCheckingEligibility(false)
      return
    }

    const unreviewed = data.find(
      (t) => !t.reviews || (Array.isArray(t.reviews) && t.reviews.length === 0)
    )
    setCanReview(!!unreviewed)
    setReviewableTenancyId(unreviewed?.id ?? null)
    setCheckingEligibility(false)
  }, [apartmentId, profile?.id, profileLoading])

  useFocusEffect(useCallback(() => { checkEligibility() }, [checkEligibility]))

  return {
    canReview,
    checkingEligibility,
    reviewableTenancyId,
    refetch: checkEligibility
  }
}
