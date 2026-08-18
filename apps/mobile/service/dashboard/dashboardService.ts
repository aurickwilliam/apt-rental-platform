import { supabase } from "@repo/supabase";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** Maps a "YYYY-MM" month key to its short label, e.g. "2026-08" -> "Aug". */
export function monthLabel(monthKey: string): string {
  const index = Number(monthKey.slice(5, 7)) - 1;
  return MONTH_LABELS[index] ?? monthKey;
}

export interface DashboardStats {
  totalProperties: number;
  unitsOccupied: number;
  pendingPayments: number;
  maintenanceRequests: number;
}

export interface MonthlyRevenuePoint {
  /** "YYYY-MM" key, e.g. "2026-08". */
  month: string;
  amount: number;
}

export interface PropertyRevenueMonth {
  /** "YYYY-MM" key, e.g. "2026-08". */
  month: string;
  amount: number;
}

export interface PropertyRevenue {
  apartmentId: string;
  apartmentName: string;
  months: PropertyRevenueMonth[];
}

export interface RentDue {
  id: string;
  apartmentId: string;
  apartmentName: string;
  tenantName: string;
  dueDate: string;
  amount: number;
  isOverdue: boolean;
}

export interface DashboardData {
  stats: DashboardStats;
  monthlyRevenue: MonthlyRevenuePoint[];
  revenueByProperty: PropertyRevenue[];
  rentDues: RentDue[];
}

/**
 * Fetches the full landlord dashboard in a single RPC round trip:
 * stats, 12-month revenue series, revenue per property (12-month window)
 * and unpaid rent dues. See supabase/migrations/20260817020000_get_landlord_dashboard.sql.
 */
export async function fetchDashboardData(landlordId: string): Promise<DashboardData> {
  const { data, error } = await supabase.rpc("get_landlord_dashboard", {
    p_landlord_id: landlordId,
  });

  if (error) throw error;

  return data as unknown as DashboardData;
}
