"use client";

import { useCallback, useState } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";

import { getTenantContext } from "@/service/favoritesService";
import {
  cancelMaintenanceRequest,
  fetchMaintenanceRequestHistory,
  type MaintenanceRequest,
} from "@/service/maintenanceService";

export type { MaintenanceRequest };

const NO_REQUESTS: MaintenanceRequest[] = [];

export function canCancelMaintenanceRequest(status: MaintenanceRequest["status"]) {
  return status === "Pending" || status === "In Progress";
}

export function useMaintenanceRequestHistory(apartmentId: string | null) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<MaintenanceRequest[]> => {
    if (!apartmentId) return NO_REQUESTS;
    const context = await getTenantContext();
    if (!context.tenantId) return NO_REQUESTS;
    return fetchMaintenanceRequestHistory(apartmentId, context.tenantId);
  }, [apartmentId]);
  const {
    data: requests,
    loading,
    error,
    refresh,
    setData: setRequests,
  } = useAsyncResource(load, NO_REQUESTS, "Failed to load maintenance requests.");

  const cancelRequest = useCallback(
    async (requestId: string) => {
      const target = requests.find((r) => r.id === requestId);
      if (!target) {
        return { success: false as const, error: "Request not found." };
      }
      if (!canCancelMaintenanceRequest(target.status)) {
        return { success: false as const, error: "This request can no longer be cancelled." };
      }
      setCancellingId(requestId);
      try {
        const context = await getTenantContext();
        if (!context.tenantId) {
          throw new Error("You must be signed in to cancel a request.");
        }
        await cancelMaintenanceRequest(requestId, context.tenantId);
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? { ...r, status: "Cancelled" as const, cancelled_at: new Date().toISOString() }
              : r,
          ),
        );
        return { success: true as const };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Couldn't cancel this request.";
        return { success: false as const, error: msg };
      } finally {
        setCancellingId(null);
      }
    },
    [requests, setRequests],
  );

  const latestRequest = requests[0] ?? null;
  const activeRequest =
    latestRequest && canCancelMaintenanceRequest(latestRequest.status) ? latestRequest : null;

  return {
    requests,
    latestRequest,
    activeRequest,
    loading,
    error,
    refresh,
    cancelRequest,
    cancellingId,
  };
}
