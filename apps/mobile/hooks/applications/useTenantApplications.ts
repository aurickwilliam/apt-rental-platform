import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useCurrentUser } from 'hooks/auth';
import { fetchTenantApplications } from '@/service/applications/tenantApplicationsService';

export type { ApplicationDocument, TenantApplication } from '@/service/applications/tenantApplicationsService';

export const getTenantApplicationsQueryKey = (tenantId: string | undefined) =>
  ['tenant-applications', tenantId] as const;

export function useTenantApplications() {
  const currentUserQuery = useCurrentUser();
  const tenantId = currentUserQuery.data?.id;

  const applicationsQuery = useQuery({
    queryKey: getTenantApplicationsQueryKey(tenantId),
    queryFn: () => fetchTenantApplications(tenantId as string),
    enabled: tenantId !== undefined,
  });

  const refetch = useCallback(async () => {
    await applicationsQuery.refetch();
  }, [applicationsQuery]);

  const refreshing =
    (currentUserQuery.isFetching || applicationsQuery.isFetching) &&
    !(currentUserQuery.isLoading || applicationsQuery.isLoading);

  return {
    applications: applicationsQuery.data ?? [],
    loading: currentUserQuery.isLoading || applicationsQuery.isLoading,
    refreshing,
    error: applicationsQuery.error?.message ?? null,
    refetch,
  };
}