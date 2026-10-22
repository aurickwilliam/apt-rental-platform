import { supabase } from "@repo/supabase";

import { normalizeDashboardData, type DashboardData } from "@repo/utils";

// The payload types and derivations are shared with the web dashboard.
export {
  EMPTY_ATTENTION,
  EMPTY_THIS_MONTH,
  buildRequestItems,
  collectionProgress,
  consolidateMonthlyRevenue,
  currentMonthKey,
  monthLabel,
  monthRevenueTotal,
  normalizeDashboardData,
  summarizeRentDues,
  topPropertiesByRevenue,
} from "@repo/utils";
export type {
  CollectionProgress,
  DashboardAttention,
  DashboardData,
  DashboardStats,
  MonthlyRevenuePoint,
  PropertyRevenue,
  PropertyRevenueMonth,
  RentDue,
  RentDueSummary,
  RequestItem,
  RequestKey,
  ThisMonthSummary,
  TopProperty,
} from "@repo/utils";

/**
 * Fetches the full landlord dashboard in a single RPC round trip:
 * stats, attention counts, this-month collection, 12-month revenue series,
 * revenue per property (12-month window) and unpaid rent dues. See
 * supabase/migrations/20261022000000_landlord_dashboard_attention.sql.
 */
export async function fetchDashboardData(landlordId: string): Promise<DashboardData> {
  const { data, error } = await supabase.rpc("get_landlord_dashboard", {
    p_landlord_id: landlordId,
  });

  if (error) throw error;

  // attention / thisMonth are absent until the matching RPC migration is
  // deployed; the normalizer defaults them so the dashboard still renders.
  return normalizeDashboardData(data as unknown as DashboardData);
}
