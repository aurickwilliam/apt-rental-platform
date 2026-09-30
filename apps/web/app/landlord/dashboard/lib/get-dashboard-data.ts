import { createClient } from "@repo/supabase/server";

import { summarizeDashboard } from "./summarize-dashboard";

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
}

export interface RentCollectionSlice {
  name: string;
  label: string;
  value: number;
}

export interface DashboardData {
  totalProperties: number;
  totalRevenueThisMonth: number;
  /** Null when the landlord has no properties (0/0 is undefined). */
  occupancyRate: number | null;
  pendingPayments: number;
  /** Last 7 calendar months (inclusive of current), zero-filled. */
  monthlyRevenue: MonthlyRevenuePoint[];
  rentCollection: RentCollectionSlice[];
  hasPayments: boolean;
}

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

  const landlordId = profile.id;

  const [{ data: apartments, error: apartmentsError }, { data: payments, error: paymentsError }] =
    await Promise.all([
      supabase
        .from("apartments")
        .select("id, status")
        .eq("landlord_id", landlordId)
        .is("deleted_at", null),
      supabase
        .from("payment")
        .select("amount, date, status, due_date")
        .eq("landlord_id", landlordId),
    ]);

  if (apartmentsError) throw new Error(apartmentsError.message);
  if (paymentsError) throw new Error(paymentsError.message);

  return summarizeDashboard(apartments, payments, new Date());
}
