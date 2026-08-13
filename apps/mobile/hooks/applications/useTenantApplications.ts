import { useQuery } from '@tanstack/react-query';

import { useCurrentUser } from 'hooks/auth';
import { fetchTenantApplications } from '@/service/tenantApplicationsService';

export type { ApplicationDocument, TenantApplication } from '@/service/tenantApplicationsService';

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

  return {
    applications: applicationsQuery.data ?? [],
    loading: currentUserQuery.isLoading || applicationsQuery.isLoading,
    error: applicationsQuery.error?.message ?? null,
  };
}