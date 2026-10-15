import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getLatestMaintenanceRequestQueryKey } from './useMaintenanceRequests';
import { maintenanceRequestHistoryQuery } from './useMaintenanceRequestHistory';

import type { MaintenanceRequest } from '@/service/maintenance-requests/maintenanceService';

type UseMaintenanceRequestParams = {
  requestId?: string;
  apartmentId?: string;
};

// One tenant maintenance request, found by id in the apartment's history (the
// same query the history screen uses). Routes pass ids only: requests carry
// signed photo URLs, which must never travel in route params.
export function useMaintenanceRequest({ requestId, apartmentId }: UseMaintenanceRequestParams) {
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    ...maintenanceRequestHistoryQuery(apartmentId),
    // Opened from the Rentals card: show the cached latest request right away
    // while the full history loads.
    placeholderData: () => {
      const latest = queryClient.getQueryData<MaintenanceRequest | null>(
        getLatestMaintenanceRequestQueryKey(apartmentId)
      );
      return latest ? [latest] : undefined;
    },
  });

  return {
    request: historyQuery.data?.find((request) => request.id === requestId) ?? null,
    loading: historyQuery.isLoading,
    error: historyQuery.error?.message ?? null,
  };
}
