import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getLandlordTenancyQueryKey } from '@/hooks/tenancy'

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
      const paymentsKey = getLandlordPaymentsQueryKey(apartmentId)
      const tenancyKey = getLandlordTenancyQueryKey(apartmentId)

      await Promise.all([
        queryClient.cancelQueries({ queryKey: paymentsKey }),
        queryClient.cancelQueries({ queryKey: tenancyKey }),
      ])

      const previous = {
        payments: queryClient.getQueryData(paymentsKey),
        tenancy: queryClient.getQueryData(tenancyKey),
      }

      queryClient.setQueryData(paymentsKey, (rows: unknown) => {
        const list = Array.isArray(rows) ? rows : []
        return list.map((row) =>
          typeof row === 'object' && row !== null && (row as { id?: string }).id === paymentId
            ? { ...(row as object), status: 'paid' }
            : row
        )
      })

      queryClient.setQueryData(tenancyKey, (data: unknown) => {
        if (typeof data !== 'object' || data === null) return data
        const tenancy = data as { paymentHistory?: { id: string; status: string }[] }
        const paymentHistory = tenancy.paymentHistory
          ? tenancy.paymentHistory.map((payment) =>
              payment.id === paymentId ? { ...payment, status: 'paid' } : payment
            )
          : undefined
        return { ...tenancy, paymentHistory }
      })

      return { previous }
    },
    onError: (_error, _paymentId, context) => {
      if (context?.previous) {
        if (context.previous.payments !== undefined) {
          queryClient.setQueryData(getLandlordPaymentsQueryKey(apartmentId), context.previous.payments)
        }
        if (context.previous.tenancy !== undefined) {
          queryClient.setQueryData(getLandlordTenancyQueryKey(apartmentId), context.previous.tenancy)
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getLandlordPaymentsQueryKey(apartmentId),
        exact: true,
        refetchType: 'none',
      })
      queryClient.invalidateQueries({
        queryKey: getLandlordTenancyQueryKey(apartmentId),
        exact: true,
        refetchType: 'none',
      })
    },
  })
}