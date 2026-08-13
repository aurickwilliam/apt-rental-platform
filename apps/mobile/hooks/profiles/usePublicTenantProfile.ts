import { useQuery } from '@tanstack/react-query'

import { fetchPublicTenantProfile } from '@/service/profilesService'

export type { PublicTenantProfile, PastApartment } from '@/service/profilesService'

export const getPublicTenantProfileQueryKey = (tenantId: string | undefined) =>
  ['public-tenant-profile', tenantId] as const

export function usePublicTenantProfile(tenantId?: string) {
  const profileQuery = useQuery({
    queryKey: getPublicTenantProfileQueryKey(tenantId),
    queryFn: () => fetchPublicTenantProfile(tenantId as string),
    enabled: tenantId !== undefined,
  })

  return {
    profile: profileQuery.data?.profile ?? null,
    pastApartments: profileQuery.data?.pastApartments ?? [],
    loading: profileQuery.isLoading,
    refetch: profileQuery.refetch,
  }
}