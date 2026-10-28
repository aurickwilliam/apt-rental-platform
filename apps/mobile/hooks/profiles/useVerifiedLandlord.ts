import { useQuery } from '@tanstack/react-query'

import { fetchIsVerifiedLandlord } from '@/service/profiles/verifiedLandlordService'

export const getVerifiedLandlordQueryKey = (landlordId: string | undefined) =>
  ['verified-landlord', landlordId] as const

export function useVerifiedLandlord(landlordId?: string | null): boolean {
  const { data } = useQuery({
    queryKey: getVerifiedLandlordQueryKey(landlordId ?? undefined),
    queryFn: () => fetchIsVerifiedLandlord(landlordId as string),
    enabled: Boolean(landlordId),
  })
  return data ?? false
}
