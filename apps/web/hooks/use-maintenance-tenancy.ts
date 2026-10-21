"use client";

import { useCallback } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { useUser } from "@/hooks/use-user";
import { fetchActiveTenancy, type ActiveTenancy } from "@/service/tenancyService";

/** Maintenance never needs a bill or payment history to display its property. */
export function useMaintenanceTenancy() {
  const { profile, loading: profileLoading } = useUser();
  const tenantId = profile?.roles.includes("tenant") ? profile.id : null;
  const load = useCallback(
    (): Promise<ActiveTenancy | null> => tenantId ? fetchActiveTenancy(tenantId) : Promise.resolve(null),
    [tenantId],
  );
  const { data, loading, error } = useAsyncResource(load, null, "Failed to load your rental.");
  const pending = profileLoading || loading;

  // Never display the previous identity's context while a new loader settles.
  return { tenancy: pending || error ? null : data, tenantId, loading: pending, error };
}
