import { supabase } from "@repo/supabase";
import { mapRow, type MaintenanceRequest } from "./maintenanceService";
import { MAINTENANCE_DASHBOARD_LIMIT } from "@/constants/maintenance-dashboard";
const FEE_PAGE_SIZE = 200;
const REQUEST_COLUMNS = "id,title,category,message,urgency,status,created_at,updated_at,resolved_at,resolution_notes,tenant_id,apartment_id,landlord_id,cancelled_at,tenancy_id,fee_amount,fee_status";

export function orderActiveRequests(requests: readonly MaintenanceRequest[]) {
  return requests.filter((row) => row.status === "Pending" || row.status === "In Progress")
    .sort((a, b) => Number(b.status === "In Progress") - Number(a.status === "In Progress")
      || Date.parse(b.status === "In Progress" ? b.updated_at ?? b.created_at : b.created_at)
        - Date.parse(a.status === "In Progress" ? a.updated_at ?? a.created_at : a.created_at)
      || b.id.localeCompare(a.id));
}

// Independent status reads prevent recent closed requests from displacing open
// ones. Summary cards never need private images; the details route resolves them.
export async function fetchMaintenanceDashboardRequests(apartmentId: string, tenantId: string) {
  const read = async (statuses: string[], updated = false) => {
    let query = supabase.from("maintenance_request").select(REQUEST_COLUMNS)
      .eq("apartment_id", apartmentId).eq("tenant_id", tenantId).in("status", statuses);
    if (updated) query = query.order("updated_at", { ascending: false, nullsFirst: false });
    const { data, error } = await query.order("created_at", { ascending: false })
      .order("id", { ascending: false }).limit(MAINTENANCE_DASHBOARD_LIMIT);
    if (error) throw error;
    return Promise.all((data ?? []).map((row) => mapRow({ ...row, image_urls: [] }, false)));
  };
  const [progress, pending, history] = await Promise.all([
    read(["in_progress"], true), read(["pending"]), read(["resolved", "cancelled"]),
  ]);
  return {
    active: orderActiveRequests([...progress, ...pending]), history,
    activeLimited: progress.length >= MAINTENANCE_DASHBOARD_LIMIT || pending.length >= MAINTENANCE_DASHBOARD_LIMIT,
    historyLimited: history.length >= MAINTENANCE_DASHBOARD_LIMIT,
  };
}

export async function fetchMaintenanceOverview(apartmentId: string, tenantId: string) {
  const [active, tenancy] = await Promise.all([
    supabase.from("maintenance_request").select("id", { count: "exact", head: true })
      .eq("apartment_id", apartmentId).eq("tenant_id", tenantId).in("status", ["pending", "in_progress"]),
    supabase.from("tenancies").select("id").eq("apartment_id", apartmentId)
      .eq("tenant_id", tenantId).eq("status", "active").maybeSingle(),
  ]);
  if (active.error) throw active.error;
  if (tenancy.error) throw tenancy.error;
  if (active.count === null) throw new Error("Active request count is unavailable.");
  let unpaidFees = 0;
  let cursor: string | undefined;
  if (tenancy.data) {
    for (;;) {
      let query = supabase.from("maintenance_request").select("id,fee_amount")
        .eq("apartment_id", apartmentId).eq("tenant_id", tenantId).eq("tenancy_id", tenancy.data.id)
        .eq("fee_status", "pending").gt("fee_amount", 0).order("id", { ascending: true }).limit(FEE_PAGE_SIZE);
      if (cursor) query = query.gt("id", cursor);
      const { data, error } = await query;
      if (error) throw error;
      unpaidFees += (data ?? []).reduce((sum, row) => sum + Number(row.fee_amount), 0);
      if (!data || data.length < FEE_PAGE_SIZE) break;
      cursor = data[data.length - 1].id;
    }
  }
  return { activeCount: active.count, unpaidFees, hasActiveTenancy: !!tenancy.data };
}
