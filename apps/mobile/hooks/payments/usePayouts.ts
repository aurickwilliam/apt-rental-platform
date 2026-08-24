import { useQuery } from '@tanstack/react-query'

import { fetchPayoutById, fetchPayouts, fetchPayoutPayments } from '@/service/payments/payoutService'

export const getPayoutsQueryKey = () => ['payouts'] as const
export const getPayoutQueryKey = (id: string) => ['payout', id] as const
export const getPayoutPaymentsQueryKey = (payoutId: string) => ['payout-payments', payoutId] as const

export function usePayouts() {
  return useQuery({
    queryKey: getPayoutsQueryKey(),
    queryFn: fetchPayouts,
  })
}

export function usePayout(id: string | null) {
  return useQuery({
    queryKey: getPayoutQueryKey(id ?? ''),
    queryFn: () => fetchPayoutById(id!),
    enabled: !!id,
  })
}

export function usePayoutPayments(payoutId: string | null) {
  return useQuery({
    queryKey: getPayoutPaymentsQueryKey(payoutId ?? ''),
    queryFn: () => fetchPayoutPayments(payoutId!),
    enabled: !!payoutId,
  })
}
