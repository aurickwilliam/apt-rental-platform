"use client";

import { useCallback } from "react";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { fetchMaintenanceOverview, type MaintenanceOverview } from "@/service/tenantMaintenanceService";

export function useMaintenanceOverview(apartmentId: string | null, tenantId: string | null, tenancyId: string | null) {
  const load = useCallback(() => {
    if (!apartmentId || !tenantId || !tenancyId) return Promise.resolve(null);
    return fetchMaintenanceOverview(apartmentId, tenantId, tenancyId);
  }, [apartmentId, tenantId, tenancyId]);
  const resource = useAsyncResource<MaintenanceOverview | null>(load, null, "Unable to load your maintenance overview.", { clearOnRevalidateError: true });
  return { ...resource, data: resource.loading || resource.error ? null : resource.data };
}
