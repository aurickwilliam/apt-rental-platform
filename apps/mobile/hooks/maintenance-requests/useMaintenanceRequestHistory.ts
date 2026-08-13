import { useQuery } from '@tanstack/react-query';

import { fetchMaintenanceRequestHistory } from '@/service/maintenanceService';

import type { MaintenanceRequest } from '@/service/maintenanceService';

export type { MaintenanceRequest } from '@/service/maintenanceService';

export const getMaintenanceRequestHistoryQueryKey = (apartmentId: string | undefined) =>
  ['maintenance-request-history', apartmentId] as const;

type UseMaintenanceRequestHistoryParams = {
  apartmentId?: string;
};

export function useMaintenanceRequestHistory({ apartmentId }: UseMaintenanceRequestHistoryParams) {
  const historyQuery = useQuery({
    queryKey: getMaintenanceRequestHistoryQueryKey(apartmentId),
    queryFn: () => fetchMaintenanceRequestHistory(apartmentId as string),
    enabled: apartmentId !== undefined,
  });

  return {
    requests: (historyQuery.data ?? []) as MaintenanceRequest[],
    loading: historyQuery.isLoading,
    error: historyQuery.error?.message ?? null,
    refetch: historyQuery.refetch,
  };
}