import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { fetchMaintenanceDashboardRequests, fetchMaintenanceOverview } from "@/service/maintenance-requests/maintenanceDashboardService";

export function useMaintenanceDashboard(apartmentId?: string, { includeOverview = true }: { includeOverview?: boolean } = {}) {
  const user = useCurrentUser();
  const tenantId = user.data?.id;
  const authId = user.data?.user_id;
  const client = useQueryClient();
  const enabled = !!apartmentId && !!tenantId && !!authId;
  const requests = useQuery({
    queryKey: ["maintenance-dashboard", authId, tenantId, apartmentId],
    queryFn: () => fetchMaintenanceDashboardRequests(apartmentId!, tenantId!), enabled,
  });
  const overview = useQuery({
    queryKey: ["maintenance-overview", authId, tenantId, apartmentId],
    queryFn: () => fetchMaintenanceOverview(apartmentId!, tenantId!), enabled: enabled && includeOverview,
  });
  useFocusEffect(useCallback(() => {
    if (!apartmentId || !tenantId || !authId) return;
    for (const resource of includeOverview ? ["maintenance-dashboard", "maintenance-overview"] : ["maintenance-dashboard"]) {
      void client.invalidateQueries({ queryKey: [resource, authId, tenantId, apartmentId], exact: true }, { cancelRefetch: false });
    }
  }, [apartmentId, tenantId, authId, client, includeOverview]));

  const refresh = async () => {
    if (enabled) await Promise.all([requests.refetch(), ...(includeOverview ? [overview.refetch()] : [])]);
    else await user.refetch();
  };
  const identityError = user.error ? "Couldn't load your account. Please try again."
    : !user.isPending && !enabled ? "Your rental is unavailable. Please return to Rentals." : null;
  return { requests, overview, refresh, identityError, identityLoading: user.isPending, accountKey: `${authId}:${tenantId}:${apartmentId}` };
}
