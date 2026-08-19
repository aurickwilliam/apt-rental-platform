import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  fetchLandlordPayments,
  updateLandlordPaymentStatus,
} from '@/service/landlord/landlordService'

export type {
  LandlordPaymentRecord,
} from '@/service/landlord/landlordService'

export const getLandlordPaymentsQueryKey = (apartmentId: string | undefined) =>
  ['landlord-payments', apartmentId] as const

export function useLandlordPayments(apartmentId: string | undefined) {
  return useQuery({
    queryKey: getLandlordPaymentsQueryKey(apartmentId),
    queryFn: () => fetchLandlordPayments(apartmentId as string),
    enabled: apartmentId !== undefined,
  })
}

// Landlord confirms a pending cash payment → 'paid'. Optimistic update with
// rollback; the flip settles via the notification trigger (tenant gets
// "Payment Successful"), so we only mark the cache stale — no extra refetch.
export function useLandlordPaymentConfirmation(apartmentId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (paymentId: string) => updateLandlordPaymentStatus(paymentId),
    onMutate: async (paymentId) => {
      const queryKey = getLandlordPaymentsQueryKey(apartmentId)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, (rows: unknown) => {
        const list = Array.isArray(rows) ? rows : []
        return list.map((row) =>
          typeof row === 'object' && row !== null && (row as { id?: string }).id === paymentId
            ? { ...(row as object), status: 'paid' }
            : row
        )
      })

      return { previous }
    },
    onError: (_error, _paymentId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(getLandlordPaymentsQueryKey(apartmentId), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getLandlordPaymentsQueryKey(apartmentId),
        exact: true,
        refetchType: 'none',
      })
    },
  })
}