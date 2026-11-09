import { createClient } from "@repo/supabase/browser";
import { fetchMaintenanceRequestHistory, MAINTENANCE_HISTORY_LIMIT } from "./maintenanceService";
import { sortActiveMaintenanceRequests } from "../lib/maintenance-featured-request";

const FEE_PAGE_SIZE = 200;

export interface MaintenanceOverview {
  activeCount: number;
  unpaidFees: number;
}

/** Separate bounded lists keep recent closed requests from hiding open ones. */
export async function fetchTenantMaintenanceRequests(apartmentId: string, tenantId: string, supabase = createClient()) {
  const [progress, pending, history] = await Promise.all([
    fetchMaintenanceRequestHistory(apartmentId, tenantId, false, supabase, ["in_progress"], true),
    fetchMaintenanceRequestHistory(apartmentId, tenantId, false, supabase, ["pending"]),
    fetchMaintenanceRequestHistory(apartmentId, tenantId, false, supabase, ["resolved", "cancelled"]),
  ]);
  return [...sortActiveMaintenanceRequests([...progress, ...pending]).slice(0, MAINTENANCE_HISTORY_LIMIT), ...history];
}

/** No month filter: unpaid fees belong only to the tenancy that raised them. */
export async function fetchMaintenanceOverview(apartmentId: string, tenantId: string, tenancyId: string, supabase = createClient()): Promise<MaintenanceOverview> {
  const activeCount = async () => {
    const { count, error } = await supabase.from("maintenance_request")
      .select("id", { count: "exact", head: true })
      .eq("apartment_id", apartmentId).eq("tenant_id", tenantId)
      .in("status", ["pending", "in_progress"]);
    if (error) throw error;
    if (count === null) throw new Error("Unable to count active maintenance requests.");
    return count;
  };
  const unpaidFees = async () => {
    let total = 0;
    let cursor: string | null = null;
    // Page by immutable id rather than silently accepting PostgREST's row cap.
    for (;;) {
      let query = supabase.from("maintenance_request").select("id, fee_amount")
        .eq("apartment_id", apartmentId).eq("tenant_id", tenantId)
        .eq("tenancy_id", tenancyId).eq("fee_status", "pending")
        .gt("fee_amount", 0).order("id", { ascending: true }).limit(FEE_PAGE_SIZE);
      if (cursor) query = query.gt("id", cursor);
      const { data, error } = await query;
      if (error) throw error;
      const rows = data ?? [];
      total += rows.reduce((sum, row) => sum + Math.round((row.fee_amount ?? 0) * 100), 0);
      if (rows.length < FEE_PAGE_SIZE) return total / 100;
      cursor = rows[rows.length - 1].id;
    }
  };
  const [count, fees] = await Promise.all([activeCount(), unpaidFees()]);
  return { activeCount: count, unpaidFees: fees };
}
