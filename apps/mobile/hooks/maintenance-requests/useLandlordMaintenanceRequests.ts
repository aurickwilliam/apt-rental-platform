import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useProfile } from "@/hooks/auth";
import {
  fetchLandlordMaintenanceRequests,
  updateLandlordMaintenanceStatus,
} from "@/service/landlordService";

import type {
  LandlordMaintenanceRequest,
  MaintenanceRequestStatus,
} from "@/service/landlordService";

export type { LandlordMaintenanceRequest } from "@/service/landlordService";

// Only the "advance" flow moves forward through these three.
// Resolved and Cancelled are terminal states.
const STATUS_FLOW: MaintenanceRequestStatus[] = [
  "Pending",
  "In Progress",
  "Resolved",
];

// Next status in the Pending -> In Progress -> Resolved flow
export function getNextStatus(
  current: MaintenanceRequestStatus
): MaintenanceRequestStatus {
  const index = STATUS_FLOW.indexOf(current);
  if (index === -1 || index === STATUS_FLOW.length - 1) return current;
  return STATUS_FLOW[index + 1];
}

export const getLandlordMaintenanceRequestsQueryKey = (landlordId: string | null) =>
  ["landlord-maintenance", landlordId] as const;

export function useLandlordMaintenanceRequests() {
  const queryClient = useQueryClient();
  const { profile, loading: profileLoading } = useProfile();
  const landlordId = profile?.id ?? null;
  const [error, setError] = useState<string | null>(null);

  const queryKey = getLandlordMaintenanceRequestsQueryKey(landlordId);
  const requestsQuery = useQuery({
    queryKey,
    queryFn: () => fetchLandlordMaintenanceRequests(landlordId as string),
    enabled: landlordId !== null && !profileLoading,
  });

  const updateStatus = useCallback(
    async (
      id: string,
      nextStatus: MaintenanceRequestStatus,
      resolutionNotes?: string
    ) => {
      const previous = queryClient.getQueryData<LandlordMaintenanceRequest[]>(queryKey) ?? null;

      // Optimistic update
      queryClient.setQueryData<LandlordMaintenanceRequest[]>(queryKey, (current) =>
        current?.map((request) =>
          request.id === id
            ? {
                ...request,
                status: nextStatus,
                resolution_notes:
                  nextStatus === "Resolved"
                    ? resolutionNotes ?? request.resolution_notes
                    : request.resolution_notes,
              }
            : request
        )
      );

      const result = await updateLandlordMaintenanceStatus(id, nextStatus, resolutionNotes);

      if (!result.success) {
        // Revert on real errors AND on silent RLS blocks (zero rows affected)
        queryClient.setQueryData(queryKey, previous);
        setError(result.error ?? "Could not update request status.");
        return false;
      }

      void queryClient.invalidateQueries({ queryKey, exact: true });
      setError(null);
      return true;
    },
    [queryClient, queryKey]
  );

  const resolveRequest = useCallback(
    async (id: string, resolutionNotes: string) => {
      return updateStatus(id, "Resolved", resolutionNotes);
    },
    [updateStatus]
  );

  const advanceStatus = useCallback(
    async (id: string) => {
      const requests = queryClient.getQueryData<LandlordMaintenanceRequest[]>(queryKey) ?? [];
      const request = requests.find((entry) => entry.id === id);
      if (!request) return false;

      const nextStatus = getNextStatus(request.status);
      if (nextStatus === request.status) return false;
      if (nextStatus === "Resolved") return false;

      return updateStatus(id, nextStatus);
    },
    [queryClient, queryKey, updateStatus]
  );

  return {
    requests: requestsQuery.data ?? [],
    loading: requestsQuery.isLoading || profileLoading,
    error,
    refetch: requestsQuery.refetch,
    advanceStatus,
    resolveRequest,
    updateStatus,
    getNextStatus,
  };
}