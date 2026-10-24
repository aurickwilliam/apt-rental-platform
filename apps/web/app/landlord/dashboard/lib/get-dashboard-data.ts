import { requirePortalViewer } from "@/lib/server-identity";
import {
  consolidateMonthlyRevenue,
  normalizeDashboardData,
  type DashboardData,
} from "@repo/utils";

/**
 * Loads the landlord dashboard through the same get_landlord_dashboard RPC the
 * mobile app uses, so both platforms report identical figures. RLS stays the
 * final authority (security invoker).
 */
export async function getDashboardData(): Promise<DashboardData> {
  const { supabase, profile } = await requirePortalViewer("landlord");

  const { data, error } = await supabase.rpc("get_landlord_dashboard", {
    p_landlord_id: profile.id,
  });

  if (error) throw new Error(error.message);

  const payload = normalizeDashboardData(data as unknown as DashboardData);

  return {
    ...payload,
    // The RPC emits one row per (month x property); collapse to one per month.
    monthlyRevenue: consolidateMonthlyRevenue(payload.monthlyRevenue),
  };
}
