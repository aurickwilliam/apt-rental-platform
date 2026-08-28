import { useQuery } from '@tanstack/react-query'

import { fetchPaymentById, fetchPaymentByReferenceId, fetchPayments, type PaymentRecord } from '@/service/payments/paymentService'

export const getPaymentsQueryKey = (tenancyId: string) => ['payments', tenancyId] as const
export const getPaymentQueryKey = (paymentId: string) => ['payment', paymentId] as const
export const getPaymentByReferenceQueryKey = (referenceId: string) => ['payment-by-reference', referenceId] as const

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

export function usePaymentByReference(referenceId: string | null, options?: { pollWhilePending?: boolean }) {
  return useQuery({
    queryKey: ['payment-by-reference', referenceId],
    queryFn: () => fetchPaymentByReferenceId(referenceId as string),
    enabled: referenceId !== null,
    // Simulation: e-wallet/card rows insert as `paid` instantly, so poll rarely
    // needed. Cash rows stay `pending` until landlord flips — never poll those.
    refetchInterval: (query) => {
      if (!options?.pollWhilePending) return false
      const record = query.state.data as PaymentRecord | null
      return record?.status === 'pending' && record?.method !== 'cash' ? 3000 : false
    },
  })
}
