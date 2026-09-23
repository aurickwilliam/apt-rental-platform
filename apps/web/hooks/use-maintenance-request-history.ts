"use client";

import { useCallback, useEffect, useState } from "react";

import { getTenantContext } from "@/service/favoritesService";
import {
  cancelMaintenanceRequest,
  fetchMaintenanceRequestHistory,
  type MaintenanceRequest,
} from "@/service/maintenanceService";

export type { MaintenanceRequest };

export function canCancelMaintenanceRequest(status: MaintenanceRequest["status"]) {
  return status === "Pending" || status === "In Progress";
}

export function useMaintenanceRequestHistory(apartmentId: string | null) {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!apartmentId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const context = await getTenantContext();
      if (!context.tenantId) {
        setRequests([]);
        return;
      }
      const rows = await fetchMaintenanceRequestHistory(apartmentId, context.tenantId);
      setRequests(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load maintenance requests.");
    } finally {
      setLoading(false);
    }
  }, [apartmentId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
    [requests],
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
