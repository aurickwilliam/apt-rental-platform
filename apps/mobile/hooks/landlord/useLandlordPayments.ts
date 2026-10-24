import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getLandlordTenancyQueryKey } from '@/hooks/tenancy'

import { ALL_LANDLORD_PAYMENTS_QUERY_PREFIX } from './useAllLandlordPayments'

import {
  fetchLandlordPayments,
  updateLandlordPaymentStatus,
  type LandlordPaymentDecision,
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

// Landlord resolves a pending cash payment: 'paid' (confirm) or 'rejected' (decline,
// which lets the tenant submit another cash request). Optimistic update with rollback;
// the flip settles through the notification trigger, so we only mark the cache stale.
function useLandlordPaymentDecision(apartmentId: string | undefined, decision: LandlordPaymentDecision) {
  const queryClient = useQueryClient()

  return useMutation({
    // The service reports a refused update as { success: false } instead of throwing;
    // surface it as an error so the optimistic change rolls back and the screen shows it.
    mutationFn: async (paymentId: string) => {
      const result = await updateLandlordPaymentStatus(paymentId, decision)
      if (!result.success) throw new Error(result.error ?? 'Could not update payment status.')
      return result
    },
    onMutate: async (paymentId) => {
      const paymentsKey = getLandlordPaymentsQueryKey(apartmentId)
      const tenancyKey = getLandlordTenancyQueryKey(apartmentId)

      await Promise.all([
        queryClient.cancelQueries({ queryKey: paymentsKey }),
        queryClient.cancelQueries({ queryKey: tenancyKey }),
        queryClient.cancelQueries({ queryKey: ALL_LANDLORD_PAYMENTS_QUERY_PREFIX }),
      ])

      const previous = {
        payments: queryClient.getQueryData(paymentsKey),
        tenancy: queryClient.getQueryData(tenancyKey),
        all: queryClient.getQueriesData({ queryKey: ALL_LANDLORD_PAYMENTS_QUERY_PREFIX }),
      }

      // The all-units list shows the same payment, so it flips with it.
      queryClient.setQueriesData({ queryKey: ALL_LANDLORD_PAYMENTS_QUERY_PREFIX }, (data: unknown) => {
        if (typeof data !== 'object' || data === null) return data
        const all = data as { payments?: { id: string; status: string }[] }
        if (!all.payments) return data
        return {
          ...all,
          payments: all.payments.map((payment) =>
            payment.id === paymentId ? { ...payment, status: decision } : payment
          ),
        }
      })

      queryClient.setQueryData(paymentsKey, (rows: unknown) => {
        const list = Array.isArray(rows) ? rows : []
        return list.map((row) =>
          typeof row === 'object' && row !== null && (row as { id?: string }).id === paymentId
            ? { ...(row as object), status: decision }
            : row
        )
      })

      queryClient.setQueryData(tenancyKey, (data: unknown) => {
        if (typeof data !== 'object' || data === null) return data
        const tenancy = data as { paymentHistory?: { id: string; status: string }[] }
        const paymentHistory = tenancy.paymentHistory
          ? tenancy.paymentHistory.map((payment) =>
              payment.id === paymentId ? { ...payment, status: decision } : payment
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
        for (const [key, data] of context.previous.all) queryClient.setQueryData(key, data)
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
      queryClient.invalidateQueries({
        queryKey: ALL_LANDLORD_PAYMENTS_QUERY_PREFIX,
        refetchType: 'none',
      })
    },
  })
}

export function useLandlordPaymentConfirmation(apartmentId: string | undefined) {
  return useLandlordPaymentDecision(apartmentId, 'paid')
}

export function useLandlordPaymentDecline(apartmentId: string | undefined) {
  return useLandlordPaymentDecision(apartmentId, 'rejected')
}
