import { useQuery } from '@tanstack/react-query'

import {
  fetchIsVerifiedLandlord,
  fetchVerifiedLandlordDocumentTypes,
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

/** Approved ownership document types for the profile card; empty while loading or on failure. */
export function useVerifiedLandlordDocuments(landlordId?: string | null): string[] {
  const { data } = useQuery({
    queryKey: ['verified-landlord-documents', landlordId],
    queryFn: () => fetchVerifiedLandlordDocumentTypes(landlordId as string),
    enabled: Boolean(landlordId),
  })
  return data ?? []
}
