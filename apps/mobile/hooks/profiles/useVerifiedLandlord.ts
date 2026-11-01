import type { LandlordOwnershipDocument } from '@repo/constants'
import { useQuery } from '@tanstack/react-query'

import {
  fetchIsVerifiedLandlord,
  fetchLandlordOwnershipDocuments,
} from '@/service/profiles/verifiedLandlordService'

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

/** Ownership documents for the profile card; empty while loading or on failure. */
export function useLandlordOwnershipDocuments(landlordId?: string | null): LandlordOwnershipDocument[] {
  const { data } = useQuery({
    queryKey: ['landlord-ownership-documents', landlordId],
    queryFn: () => fetchLandlordOwnershipDocuments(landlordId as string),
    enabled: Boolean(landlordId),
  })
  return data ?? []
}
