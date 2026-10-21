import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { getTenancyQueryKey } from "@/hooks/tenancy/useTenancy";
import { getMaintenanceRequestHistoryQueryKey } from "./useMaintenanceRequestHistory";
import { getLatestMaintenanceRequestQueryKey } from "./useMaintenanceRequests";

// Maintenance is not Realtime-published. Reconcile Web/other-device changes
// when these screens regain focus, reusing any already-running requests.
export function useMaintenanceFocusRefresh(apartmentId?: string, tenantId?: string) {
  const client = useQueryClient();
  useFocusEffect(useCallback(() => {
    if (apartmentId) {
      for (const key of [
        getMaintenanceRequestHistoryQueryKey(apartmentId),
        getLatestMaintenanceRequestQueryKey(apartmentId),
      ]) {
        void client.invalidateQueries({ queryKey: key, exact: true }, { cancelRefetch: false });
      }
    }
    if (tenantId) {
      void client.invalidateQueries({ queryKey: getTenancyQueryKey(tenantId), exact: true }, { cancelRefetch: false });
    }
  }, [apartmentId, tenantId, client]));
}
