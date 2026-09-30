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

/** "YYYY-MM" key for the given date (defaults to today). */
export function currentMonthKey(today: Date = new Date()): string {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

/** Paid revenue recorded for a single "YYYY-MM" bucket (0 when absent). */
export function monthRevenueTotal(
  monthlyRevenue: readonly MonthlyRevenuePoint[],
  month: string,
): number {
  return monthlyRevenue.find((point) => point.month === month)?.amount ?? 0;
}

export interface TopProperty {
  apartmentId: string;
  apartmentName: string;
  total: number;
}

/** Properties ranked by total paid revenue over the window, highest first. */
export function topPropertiesByRevenue(
  revenueByProperty: readonly PropertyRevenue[],
  limit = 3,
): TopProperty[] {
  return revenueByProperty
    .map((property) => ({
      apartmentId: property.apartmentId,
      apartmentName: property.apartmentName,
      total: property.months.reduce((sum, month) => sum + month.amount, 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export interface RentDueSummary {
  pendingTotal: number;
  overdueTotal: number;
  totalDue: number;
}

/** Splits unpaid dues with a due date into pending vs overdue peso totals. */
export function summarizeRentDues(rentDues: readonly RentDue[]): RentDueSummary {
  let pendingTotal = 0;
  let overdueTotal = 0;
  for (const due of rentDues) {
    if (due.isOverdue) overdueTotal += due.amount;
    else pendingTotal += due.amount;
  }
  return { pendingTotal, overdueTotal, totalDue: pendingTotal + overdueTotal };
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
