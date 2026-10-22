"use client";

import { createClient } from "@repo/supabase/browser";
import { fetchActiveTenancyWith, type ActiveTenancy } from "./tenancy-context";

export type { ActiveTenancy, TenancyApartment, TenancyLandlord } from "./tenancy-context";

/** Fresh caller-bound read; the internal tenant id is a filter, never authorization. */
export function fetchActiveTenancy(tenantId: string): Promise<ActiveTenancy | null> {
  return fetchActiveTenancyWith(createClient(), tenantId);
}
