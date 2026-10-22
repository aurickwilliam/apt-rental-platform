import { useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { canWaiveMaintenanceFee, getMaintenanceFeeError } from "@repo/utils";

import { useProfile } from "@/hooks/auth";
import {
  fetchLandlordMaintenanceRequests,
  updateLandlordMaintenanceStatus,
  waiveMaintenanceFee,
} from "@/service/landlord/landlordService";
import { getTenancyQueryKey } from "@/hooks/tenancy/useTenancy";
import { getLandlordTenancyQueryKey } from "@/hooks/tenancy/useLandlordTenancy";
import { getMaintenanceRequestHistoryQueryKey } from "./useMaintenanceRequestHistory";
import { getLatestMaintenanceRequestQueryKey } from "./useMaintenanceRequests";

import type {
  LandlordMaintenanceRequest,
  MaintenanceRequestStatus,
} from "@/service/landlord/landlordService";

export type { LandlordMaintenanceRequest } from "@/service/landlord/landlordService";

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

type MaintenanceActionInput = { kind: "status"; nextStatus: MaintenanceRequestStatus; notes?: string; feeAmount?: number }
  | { kind: "waive" };

type MaintenanceAction = {
  ownerId: string;
  request: LandlordMaintenanceRequest;
} & MaintenanceActionInput;

export function useLandlordMaintenanceRequests() {
  const queryClient = useQueryClient();
  const { profile, loading: profileLoading } = useProfile();
  const landlordId = profile?.roles.includes("landlord") ? profile.id : null;
  const currentOwner = useRef(landlordId);
  currentOwner.current = landlordId;
  const busy = useRef(false);

  const queryKey = getLandlordMaintenanceRequestsQueryKey(landlordId);
  const requestsQuery = useQuery({
    queryKey,
    queryFn: () => fetchLandlordMaintenanceRequests(landlordId as string),
    enabled: landlordId !== null && !profileLoading,
  });

  useFocusEffect(useCallback(() => {
    if (landlordId) {
      void queryClient.invalidateQueries({
        queryKey: getLandlordMaintenanceRequestsQueryKey(landlordId), exact: true,
      }, { cancelRefetch: false });
    }
  }, [landlordId, queryClient]));

  const mutation = useMutation({
    mutationFn: async (action: MaintenanceAction) => {
      if (currentOwner.current !== action.ownerId) throw new Error("Your account has changed. Reopen this request.");
      const result = action.kind === "waive"
        ? await waiveMaintenanceFee(action.request.id)
        : await updateLandlordMaintenanceStatus(
          action.request.id, action.ownerId, action.nextStatus, action.notes, action.feeAmount,
        );
      if (!result.success) throw new Error(result.error ?? "Could not update this request.");
    },
    onMutate: async (action) => {
      const key = getLandlordMaintenanceRequestsQueryKey(action.ownerId);
      await queryClient.cancelQueries({ queryKey: key, exact: true });
      if (currentOwner.current !== action.ownerId) throw new Error("Your account has changed. Reopen this request.");
      const previous = queryClient.getQueryData<LandlordMaintenanceRequest[]>(key)?.find((r) => r.id === action.request.id);
      queryClient.setQueryData<LandlordMaintenanceRequest[]>(key, (rows) => rows?.map((request) => {
        if (request.id !== action.request.id) return request;
        if (action.kind === "waive") return { ...request, fee_status: "waived" };
        return {
          ...request,
          status: action.nextStatus,
          resolution_notes: action.nextStatus === "Resolved" ? action.notes?.trim() : request.resolution_notes,
          ...(action.feeAmount !== undefined ? { fee_amount: action.feeAmount, fee_status: "pending" as const } : {}),
        };
      }));
      return { previous };
    },
    onError: (_error, action, context) => {
      if (currentOwner.current !== action.ownerId || !context?.previous) return;
      queryClient.setQueryData<LandlordMaintenanceRequest[]>(
        getLandlordMaintenanceRequestsQueryKey(action.ownerId),
        (rows) => rows?.map((request) => request.id === action.request.id ? context.previous! : request),
      );
    },
    onSettled: (_data, _error, action) => {
      if (currentOwner.current !== action.ownerId) return;
      // Maintenance is not Realtime-published. Refresh these exact resources,
      // including after an uncertain transport failure, instead of waiting for an event.
      const request = action.request;
      for (const key of [
        getLandlordMaintenanceRequestsQueryKey(action.ownerId),
        getMaintenanceRequestHistoryQueryKey(request.apartment_id),
        getLatestMaintenanceRequestQueryKey(request.apartment_id),
        getTenancyQueryKey(request.tenant_id),
        getLandlordTenancyQueryKey(request.apartment_id),
      ]) {
        void queryClient.invalidateQueries({ queryKey: key, exact: true });
      }
    },
  });

  const runAction = async (id: string, action: MaintenanceActionInput) => {
    if (busy.current || !landlordId) return false;
    const request = queryClient.getQueryData<LandlordMaintenanceRequest[]>(queryKey)?.find((entry) => entry.id === id);
    if (!request) return false;
    if (action.kind === "waive" && !canWaiveMaintenanceFee(request)) return false;
    if (action.kind === "status" && action.nextStatus === "Resolved"
      && (request.status !== "In Progress" || !action.notes?.trim() || getMaintenanceFeeError(action.feeAmount))) return false;
    busy.current = true;
    try {
      await mutation.mutateAsync({ ...action, request, ownerId: landlordId });
      return true;
    } catch {
      // React Query retains the error for the dialog and rolls back the row.
      return false;
    } finally {
      busy.current = false;
    }
  };

  const updateStatus = (id: string, nextStatus: MaintenanceRequestStatus, notes?: string, feeAmount?: number) =>
    runAction(id, { kind: "status", nextStatus, notes, feeAmount });

  const resolveRequest = (id: string, notes: string, feeAmount?: number) =>
    updateStatus(id, "Resolved", notes, feeAmount);

  const advanceStatus = async (id: string) => {
    const requests = queryClient.getQueryData<LandlordMaintenanceRequest[]>(queryKey) ?? [];
    const request = requests.find((entry) => entry.id === id);
    if (!request) return false;

    const nextStatus = getNextStatus(request.status);
    if (nextStatus === request.status || nextStatus === "Resolved") return false;
    return updateStatus(id, nextStatus);
  };

  return {
    requests: requestsQuery.data ?? [],
    loading: requestsQuery.isLoading || profileLoading,
    error: mutation.error?.message ?? requestsQuery.error?.message ?? null,
    actionLoading: mutation.isPending,
    clearError: mutation.reset,
    refetch: requestsQuery.refetch,
    advanceStatus,
    resolveRequest,
    updateStatus,
    waiveFee: (id: string) => runAction(id, { kind: "waive" }),
    getNextStatus,
  };
}
