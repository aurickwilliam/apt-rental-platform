"use client";

import { useCallback } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { useAuthIdentity } from "@/hooks/use-auth-identity";
import { getTenantContext } from "@/service/favoritesService";
import type { InitialRentalContext } from "@/service/tenancy-context";
import { fetchActiveTenancy, type ActiveTenancy } from "@/service/tenancyService";

/** Maintenance never needs a bill or payment history to display its property. */
export function useMaintenanceTenancy(initial?: InitialRentalContext) {
  const identity = useAuthIdentity(initial?.authUserId);
  const load = useCallback(async () => {
    if (!identity.authUserId) return { tenancy: null, tenantId: null };
    const { tenantId } = await getTenantContext();
    return { tenantId, tenancy: tenantId ? await fetchActiveTenancy(tenantId) : null };
  }, [identity]);
  const { data, loading, error } = useAsyncResource(load, { tenancy: null as ActiveTenancy | null, tenantId: null as string | null }, "Failed to load your rental.", {
    initial: initial && identity.generation === 0 && identity.authUserId === initial.authUserId
      ? { data: { tenancy: initial.tenancy, tenantId: initial.tenantId ?? null }, error: initial.error } : undefined,
    clearOnRevalidateError: true,
  });
  const pending = identity.authUserId === undefined || loading;

  // Never display the previous identity's context while a new loader settles.
  return { tenancy: pending || error ? null : data.tenancy, tenantId: pending || error ? null : data.tenantId, loading: pending, error };
}
