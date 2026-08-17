import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  cancelMaintenanceRequest,
  fetchLatestMaintenanceRequest,
} from '@/service/maintenance-requests/maintenanceService';

export type {
  MaintenanceRequestStatus,
  MaintenanceRequestUrgency,
  MaintenanceRequest,
} from '@/service/maintenance-requests/maintenanceService';

export const getLatestMaintenanceRequestQueryKey = (apartmentId: string | undefined) =>
  ['maintenance-request-latest', apartmentId] as const;

type UseMaintenanceRequestsParams = {
  apartmentId?: string;
};

export function useMaintenanceRequests({ apartmentId }: UseMaintenanceRequestsParams) {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const queryKey = getLatestMaintenanceRequestQueryKey(apartmentId);

  const latestRequestQuery = useQuery({
    queryKey,
    queryFn: () => fetchLatestMaintenanceRequest(apartmentId as string),
    enabled: apartmentId !== undefined,
  });

  const latestRequest = latestRequestQuery.data ?? null;

  const canCancel = useCallback((status: string) => {
    return status === 'Pending' || status === 'In Progress';
  }, []);

  // Derived for backward compatibility with any code that expects "an active,
  const activeRequest =
    latestRequest && canCancel(latestRequest.status) ? latestRequest : null;

  const isFinal = latestRequest
    ? latestRequest.status === 'Resolved' || latestRequest.status === 'Cancelled'
    : false;

  const cancelRequest = useCallback(
    async (target?: unknown) => {
      const requestToCancel =
        (target as typeof latestRequest) ?? activeRequest;
      if (!requestToCancel) {
        return { success: false as const, error: 'No maintenance request to cancel.' };
      }
      if (!canCancel(requestToCancel.status)) {
        return { success: false as const, error: 'This request can no longer be cancelled.' };
      }

      const isLocal = latestRequest?.id === requestToCancel.id;
      const previous = latestRequest;
      if (isLocal) {
        queryClient.setQueryData(queryKey, { ...requestToCancel, status: 'Cancelled' });
      }

      const result = await cancelMaintenanceRequest(requestToCancel.id);

      if (!result.success) {
        if (isLocal) queryClient.setQueryData(queryKey, previous);
        setMutationError(result.error ?? 'Could not cancel the request.');
        return result as { success: false; error: string };
      }

      void queryClient.invalidateQueries({ queryKey, exact: true });
      setMutationError(null);
      return { success: true as const };
    },
    [activeRequest, canCancel, latestRequest, queryClient, queryKey]
  );

  return {
    latestRequest,
    activeRequest,
    isFinal,
    loading: latestRequestQuery.isLoading,
    error: mutationError ?? (latestRequestQuery.error?.message ?? null),
    cancelRequest,
    canCancel,
    refetch: latestRequestQuery.refetch,
  };
}