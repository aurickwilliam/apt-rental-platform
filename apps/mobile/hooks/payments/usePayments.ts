import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  fetchPaymentById,
  fetchPaymentByReferenceId,
  fetchPayments,
  fetchRefundsForPayment,
  type PaymentRecord,
  type RefundRecord,
} from '@/service/payments/paymentService'
import { requestRefund } from '@/service/payments/paymongoService'

export const getPaymentsQueryKey = (tenancyId: string) => ['payments', tenancyId] as const
export const getPaymentQueryKey = (paymentId: string) => ['payment', paymentId] as const
export const getPaymentByReferenceQueryKey = (referenceId: string) =>
  ['payment-by-reference', referenceId] as const
export const getRefundsQueryKey = (paymentId: string) => ['refunds', paymentId] as const

export function usePayments(tenancyId: string | null) {
  return useQuery({
    queryKey: ['payments', tenancyId],
    queryFn: () => fetchPayments(tenancyId as string),
    enabled: tenancyId !== null,
  })
}

export function usePayment(paymentId: string | null) {
  return useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => fetchPaymentById(paymentId as string),
    enabled: paymentId !== null,
  })
}

export function usePaymentByReference(
  referenceId: string | null,
  options?: { pollWhilePending?: boolean }
) {
  return useQuery({
    queryKey: ['payment-by-reference', referenceId],
    queryFn: () => fetchPaymentByReferenceId(referenceId as string),
    enabled: referenceId !== null,
    // The success screen may land before the webhook flips the row to paid;
    // keep polling until the status settles. Cash rows are flipped by the
    // landlord, not a webhook — never poll those.
    refetchInterval: (query) => {
      if (!options?.pollWhilePending) return false
      const record = query.state.data as PaymentRecord | null
      return record?.status === 'pending' && record?.method !== 'cash' ? 3000 : false
    },
  })
}

// Refund rows are written server-side (edge function / webhook) and there is
// no realtime channel for them — poll while a refund is pending/processing,
// mirroring usePaymentByReference's settle-polling pattern.
export function useRefundForPayment(paymentId: string | null) {
  return useQuery({
    queryKey: getRefundsQueryKey(paymentId ?? ''),
    queryFn: () => fetchRefundsForPayment(paymentId as string),
    enabled: paymentId !== null,
    refetchInterval: (query) => {
      const records = query.state.data as RefundRecord[] | null
      return records?.some((refund) => refund.status === 'pending' || refund.status === 'processing')
        ? 5000
        : false
    },
  })
}

// Tenant requests a full refund. Duplicate requests are rejected server-side
// (REFUND_ALREADY_PENDING), so the button simply disables while the mutation
// is in flight. On success the refunds list refetches (the new pending row
// must appear); the payment row itself is unchanged — mark-stale only.
export function useRequestRefund(paymentId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (amount: number) =>
      requestRefund({ paymentId: paymentId as string, amount }),
    onSuccess: () => {
      if (!paymentId) return
      queryClient.invalidateQueries({
        queryKey: getRefundsQueryKey(paymentId),
        refetchType: 'active',
      })
      queryClient.invalidateQueries({
        queryKey: getPaymentQueryKey(paymentId),
        exact: true,
        refetchType: 'none',
      })
    },
  })
}
