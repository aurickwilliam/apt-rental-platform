import { createClient } from "@repo/supabase/server";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated.");

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile?.id) {
    throw new Error("Landlord profile not found.");
  }

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
