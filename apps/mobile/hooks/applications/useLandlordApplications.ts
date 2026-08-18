import { useQuery } from '@tanstack/react-query';
import { useProfile } from 'hooks/auth';

import { fetchLandlordApplications } from '@/service/landlord/landlordService';

export type { LandlordApplication, DisplayStatus } from '@/service/landlord/landlordService';

export const getLandlordApplicationsQueryKey = (landlordId: string | null) =>
  ['landlord-applications', landlordId] as const;

export function useLandlordApplications() {
  const { profile, loading: profileLoading } = useProfile();
  const landlordId = profile?.id ?? null;

  const applicationsQuery = useQuery({
    queryKey: getLandlordApplicationsQueryKey(landlordId),
    queryFn: () => fetchLandlordApplications(landlordId as string),
    enabled: landlordId !== null && !profileLoading,
  });

  return {
    applications: applicationsQuery.data ?? [],
    loading: applicationsQuery.isLoading || profileLoading,
    error: applicationsQuery.error?.message ?? null,
    refetch: applicationsQuery.refetch,
  };
}