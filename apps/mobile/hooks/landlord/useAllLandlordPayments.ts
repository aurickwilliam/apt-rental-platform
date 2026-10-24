import { useQuery } from '@tanstack/react-query'

import { useCurrentUser } from '@/hooks/auth'
import { fetchAllLandlordPayments } from '@/service/landlord/landlordService'

export type {
  AllLandlordPayments,
  LandlordPaymentWithUnit,
  LandlordUnitOption,
} from '@/service/landlord/landlordService'

// Prefix shared by every "all units" payments query, whichever landlord it is for.
export const ALL_LANDLORD_PAYMENTS_QUERY_PREFIX = ['landlord-payments', 'all'] as const

export const getAllLandlordPaymentsQueryKey = (landlordId: string | null) =>
  [...ALL_LANDLORD_PAYMENTS_QUERY_PREFIX, landlordId] as const

// Every payment across the signed-in landlord's units (up to 500), with the unit list
// for the picker. Server data stays in React Query, never in a store.
export function useAllLandlordPayments() {
  const currentUserQuery = useCurrentUser()
  const landlordId = currentUserQuery.data?.id ?? null

  const query = useQuery({
    queryKey: getAllLandlordPaymentsQueryKey(landlordId),
    queryFn: () => fetchAllLandlordPayments(landlordId as string),
    enabled: landlordId !== null,
  })

  return {
    units: query.data?.units ?? [],
    payments: query.data?.payments ?? [],
    isLoading: currentUserQuery.isLoading || query.isLoading,
    error: currentUserQuery.error ?? query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  }
}
