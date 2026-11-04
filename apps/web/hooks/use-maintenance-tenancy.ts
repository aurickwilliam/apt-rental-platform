"use client";

import { useCallback } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { useAuthIdentity } from "@/hooks/use-auth-identity";
import { getTenantContext } from "@/service/favoritesService";
import type { InitialRentalContext } from "@/service/tenancy-context";
import type { ActiveTenancy } from "@/service/tenancyService";
import { fetchMaintenanceTenanciesWith } from "@/service/tenancy-context";
import { createClient } from "@repo/supabase/browser";
import { canRequestMaintenance } from "@/lib/tenant-maintenance";

export interface MaintenanceRentalContext extends InitialRentalContext {
  tenancies?: ActiveTenancy[];
}

/** Maintenance never needs a bill or payment history to display its property. */
export function useMaintenanceTenancy(initial?: MaintenanceRentalContext, requestedTenancyId?: string) {
  const identity = useAuthIdentity(initial?.authUserId);
  const load = useCallback(async () => {
    if (!identity.authUserId) return { tenancy: null, tenantId: null, tenancies: [] as ActiveTenancy[] };
    const { tenantId } = await getTenantContext();
    const tenancies = tenantId ? await fetchMaintenanceTenanciesWith(createClient(), tenantId) : [];
    return { tenantId, tenancy: tenancies.length === 1 ? tenancies[0] : null, tenancies };
  }, [identity]);
  const { data, loading, error } = useAsyncResource(load, { tenancy: null as ActiveTenancy | null, tenantId: null as string | null, tenancies: [] as ActiveTenancy[] }, "Failed to load your rental.", {
    initial: initial && identity.generation === 0 && identity.authUserId === initial.authUserId
      ? { data: { tenancy: initial.tenancy, tenantId: initial.tenantId ?? null, tenancies: initial.tenancies ?? (initial.tenancy ? [initial.tenancy] : []) }, error: initial.error } : undefined,
    clearOnRevalidateError: true,
  });
  const pending = identity.authUserId === undefined || loading;

  // Never display the previous identity's context while a new loader settles.
  const tenancies = pending || error ? [] : data.tenancies;
  const eligibleTenancies = tenancies.filter(tenancy => canRequestMaintenance(tenancy));
  const selected = eligibleTenancies.find(tenancy => tenancy.id === requestedTenancyId)
    ?? (!requestedTenancyId && eligibleTenancies.length === 1 ? eligibleTenancies[0] : null);
  return { tenancy: selected, tenancies: eligibleTenancies, tenantId: pending || error ? null : data.tenantId, loading: pending, error };
}
