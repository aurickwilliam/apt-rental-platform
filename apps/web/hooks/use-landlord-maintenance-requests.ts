"use client";

import { useCallback, useEffect, useState } from "react";

import { getLandlordContext } from "@/service/landlordApplicationsService";
import {
  fetchLandlordMaintenanceRequests,
  getNextStatus,
  updateLandlordMaintenanceStatus,
  type LandlordMaintenanceRequest,
} from "@/service/landlordMaintenanceService";

export type { LandlordMaintenanceRequest };
export { getNextStatus };

export function useLandlordMaintenanceRequests() {
  const [requests, setRequests] = useState<LandlordMaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const context = await getLandlordContext();
      if (!context.landlordId) {
        setRequests([]);
        return;
      }
      const rows = await fetchLandlordMaintenanceRequests(context.landlordId);
      setRequests(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load maintenance requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateStatus = useCallback(
    async (id: string, nextStatus: "In Progress" | "Resolved", resolutionNotes?: string) => {
      const previous = requests;
      setActionLoading(true);
      setRequests((current) =>
        current.map((request) =>
          request.id === id
            ? {
                ...request,
                status: nextStatus,
                resolution_notes:
                  nextStatus === "Resolved" ? (resolutionNotes ?? request.resolution_notes) : request.resolution_notes,
              }
            : request,
        ),
      );

      try {
        const context = await getLandlordContext();
        if (!context.landlordId) {
          throw new Error("You must be signed in to update a request.");
        }
        const result = await updateLandlordMaintenanceStatus(
          id,
          context.landlordId,
          nextStatus,
          resolutionNotes,
        );
        if (!result.success) {
          setRequests(previous);
          return { success: false as const, error: result.error ?? "Could not update request status." };
        }
        return { success: true as const };
      } catch (err) {
        setRequests(previous);
        return {
          success: false as const,
          error: err instanceof Error ? err.message : "Could not update request status.",
        };
      } finally {
        setActionLoading(false);
      }
    },
    [requests],
  );

  const advanceStatus = useCallback(
    async (id: string) => {
      const request = requests.find((entry) => entry.id === id);
      if (!request) return { success: false as const, error: "Request not found." };
      const next = getNextStatus(request.status);
      if (next !== "In Progress") return { success: false as const };
      return updateStatus(id, next);
    },
    [requests, updateStatus],
  );

  const resolveRequest = useCallback(
    async (id: string, resolutionNotes: string) => {
      if (!resolutionNotes.trim()) {
        return { success: false as const, error: "Resolution notes are required." };
      }
      return updateStatus(id, "Resolved", resolutionNotes);
    },
    [updateStatus],
  );

  return {
    requests,
    loading,
    error,
    refresh,
    updateStatus,
    advanceStatus,
    resolveRequest,
    actionLoading,
  };
}
