import { queryOptions, useQuery } from '@tanstack/react-query';

import { fetchMaintenanceRequestHistory } from '@/service/maintenance-requests/maintenanceService';

import type { MaintenanceRequest } from '@/service/maintenance-requests/maintenanceService';

export type { MaintenanceRequest } from '@/service/maintenance-requests/maintenanceService';

export const getMaintenanceRequestHistoryQueryKey = (apartmentId: string | undefined) =>
  ['maintenance-request-history', apartmentId] as const;

export const maintenanceRequestHistoryQuery = (apartmentId: string | undefined) =>
  queryOptions({
    queryKey: getMaintenanceRequestHistoryQueryKey(apartmentId),
    queryFn: () => fetchMaintenanceRequestHistory(apartmentId as string),
    enabled: apartmentId !== undefined,
  });

type UseMaintenanceRequestHistoryParams = {
  apartmentId?: string;
};

export function useMaintenanceRequestHistory({ apartmentId }: UseMaintenanceRequestHistoryParams) {
  const historyQuery = useQuery(maintenanceRequestHistoryQuery(apartmentId));

  return {
    requests: (historyQuery.data ?? []) as MaintenanceRequest[],
    loading: historyQuery.isLoading,
    error: historyQuery.error?.message ?? null,
    refetch: historyQuery.refetch,
  };
}