"use client";

import { useCallback, useState } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";

import { getLandlordContext } from "@/service/landlordApplicationsService";
import {
  fetchLandlordMaintenanceRequests,
  getNextStatus,
  updateLandlordMaintenanceStatus,
  type LandlordMaintenanceRequest,
} from "@/service/landlordMaintenanceService";

export type { LandlordMaintenanceRequest };
export { getNextStatus };

const NO_REQUESTS: LandlordMaintenanceRequest[] = [];

export function useLandlordMaintenanceRequests() {
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async (): Promise<LandlordMaintenanceRequest[]> => {
    const context = await getLandlordContext();
    if (!context.landlordId) return NO_REQUESTS;
    return fetchLandlordMaintenanceRequests(context.landlordId);
  }, []);
  const {
    data: requests,
    loading,
    error,
    refresh,
    setData: setRequests,
  } = useAsyncResource(load, NO_REQUESTS, "Failed to load maintenance requests.");

  const updateStatus = useCallback(
    async (
      id: string,
      nextStatus: "In Progress" | "Resolved",
      resolutionNotes?: string,
      feeAmount?: number,
    ) => {
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
                fee_amount: nextStatus === "Resolved" && feeAmount !== undefined ? feeAmount : request.fee_amount,
                fee_status:
                  nextStatus === "Resolved" && feeAmount !== undefined ? "pending" : request.fee_status,
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
          feeAmount,
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
    [requests, setRequests],
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
    async (id: string, resolutionNotes: string, feeAmount?: number) => {
      if (!resolutionNotes.trim()) {
        return { success: false as const, error: "Resolution notes are required." };
      }
      if (feeAmount !== undefined && !(feeAmount > 0)) {
        return { success: false as const, error: "Fee amount must be greater than ₱0." };
      }
      return updateStatus(id, "Resolved", resolutionNotes, feeAmount);
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
