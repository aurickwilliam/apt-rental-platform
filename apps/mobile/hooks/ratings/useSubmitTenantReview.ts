import { useMutation, useQueryClient } from '@tanstack/react-query'

import { submitTenantReview } from '@/service/ratings/tenantReviewService'
import { getTenantReviewsQueryKey } from './useTenantReviews'

type SubmitTenantReviewParams = {
  tenantId: string
  tenancyId: string
  rating: number
  comment: string
}

export function useSubmitTenantReview() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ tenancyId, rating, comment }: SubmitTenantReviewParams) =>
      submitTenantReview({ tenancyId, rating, comment }),
    onSuccess: (_result, { tenantId }) => {
      void queryClient.invalidateQueries({
        queryKey: getTenantReviewsQueryKey(tenantId),
        exact: true,
      })
    },
  })

  return {
    submitTenantReview: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
  }
}
