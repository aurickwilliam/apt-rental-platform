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

/**
 * Collapses duplicate month keys by summing their amounts, preserving
 * chronological (first-seen) order. The dashboard RPC emits one row per
 * (month × apartment), so months with several paying apartments arrive
 * repeated — charting and totaling that raw array double-plots months and
 * under-reads `.find`-based lookups. Malformed rows are skipped.
 */
export function consolidateMonthlyRevenue(
  monthlyRevenue: readonly MonthlyRevenuePoint[],
): MonthlyRevenuePoint[] {
  const totals = new Map<string, number>();
  for (const point of monthlyRevenue) {
    if (
      typeof point?.month !== "string" ||
      typeof point?.amount !== "number" ||
      !Number.isFinite(point.amount)
    ) {
      continue;
    }
    totals.set(point.month, (totals.get(point.month) ?? 0) + point.amount);
  }
  return [...totals.entries()].map(([month, amount]) => ({ month, amount }));
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

/** Work waiting on the landlord (see the get_landlord_dashboard RPC). */
export interface DashboardAttention {
  overdueCount: number;
  overdueAmount: number;
  pendingCashCount: number;
  pendingCashAmount: number;
  /** Property of the oldest cash submission; cash is confirmed per property. */
  pendingCashApartmentId: string | null;
  pendingApplications: number;
  pendingVisitRequests: number;
  /** Maintenance requests still waiting for a first response (status pending). */
  pendingMaintenance: number;
}

export interface ThisMonthSummary {
  /** Rental income recorded this month (same figure as the trend chart's last point). */
  collected: number;
  /** Rental income still unpaid on bills due this month. */
  outstanding: number;
}

export interface CollectionMonthPoint {
  /** "YYYY-MM" key of the month the rent was due. */
  month: string;
  /** Rental income already paid for that month. */
  collected: number;
  /** Rental income still pending, unpaid or partial for that month. */
  unpaid: number;
}

export interface DashboardData {
  stats: DashboardStats;
  attention: DashboardAttention;
  thisMonth: ThisMonthSummary;
  /** Last six months, oldest first (see the collection history migration). */
  collectionByMonth: CollectionMonthPoint[];
  monthlyRevenue: MonthlyRevenuePoint[];
  revenueByProperty: PropertyRevenue[];
  rentDues: RentDue[];
}

export const EMPTY_ATTENTION: DashboardAttention = {
  overdueCount: 0,
  overdueAmount: 0,
  pendingCashCount: 0,
  pendingCashAmount: 0,
  pendingCashApartmentId: null,
  pendingApplications: 0,
  pendingVisitRequests: 0,
  pendingMaintenance: 0,
};

export const EMPTY_THIS_MONTH: ThisMonthSummary = { collected: 0, outstanding: 0 };

export interface CollectionProgress {
  collected: number;
  expected: number;
  /** Whole percent of expected rent collected, clamped to 0–100. */
  percent: number;
}

/** Collected vs expected rent for the month; percent is 0 when nothing is expected. */
export function collectionProgress(thisMonth: ThisMonthSummary): CollectionProgress {
  const expected = thisMonth.collected + thisMonth.outstanding;
  const percent =
    expected > 0 ? Math.min(100, Math.round((thisMonth.collected / expected) * 100)) : 0;
  return { collected: thisMonth.collected, expected, percent };
}

export type RequestKey = "applications" | "visits" | "maintenance";

export interface RequestItem {
  key: RequestKey;
  count: number;
}

/** Tenant requests awaiting the landlord's reply; empty when none are pending. */
export function buildRequestItems(attention: DashboardAttention): RequestItem[] {
  const items: RequestItem[] = [
    { key: "applications", count: attention.pendingApplications },
    { key: "visits", count: attention.pendingVisitRequests },
    { key: "maintenance", count: attention.pendingMaintenance },
  ];
  return items.filter((item) => item.count > 0);
}

export type AttentionKey =
  | "overdue"
  | "cash"
  | "applications"
  | "visits"
  | "maintenance";

export interface AttentionItem {
  key: AttentionKey;
  count: number;
  /** Peso total behind the count; only overdue rent and cash submissions carry one. */
  amount?: number;
}

/**
 * Everything the landlord can act on now, most urgent first; empty when the
 * dashboard is clear. Rent goes before tenant requests because a payment can
 * be confirmed today, while a request only needs a reply.
 */
export function buildAttentionItems(attention: DashboardAttention): AttentionItem[] {
  const items: AttentionItem[] = [
    {
      key: "overdue",
      count: attention.overdueCount,
      amount: attention.overdueAmount,
    },
    {
      key: "cash",
      count: attention.pendingCashCount,
      amount: attention.pendingCashAmount,
    },
    { key: "applications", count: attention.pendingApplications },
    { key: "visits", count: attention.pendingVisitRequests },
    { key: "maintenance", count: attention.pendingMaintenance },
  ];
  return items.filter((item) => item.count > 0);
}

/**
 * Fills in fields an older get_landlord_dashboard deployment does not return
 * (attention, thisMonth, collectionByMonth), so callers can rely on the full shape.
 */
export function normalizeDashboardData(payload: DashboardData): DashboardData {
  return {
    ...payload,
    attention: { ...EMPTY_ATTENTION, ...payload.attention },
    thisMonth: { ...EMPTY_THIS_MONTH, ...payload.thisMonth },
    collectionByMonth: payload.collectionByMonth ?? [],
  };
}

export type TrendTimeframe = "Monthly" | "Quarterly" | "Yearly";

export const TREND_TIMEFRAMES: readonly TrendTimeframe[] = [
  "Monthly",
  "Quarterly",
  "Yearly",
];

export interface TrendPoint {
  label: string;
  value: number;
}

/**
 * Profit trend series for the dashboard chart. Monthly keeps each month,
 * Quarterly sums into "Q1".."Q4" buckets per year, Yearly into one bucket per
 * year; buckets keep first-seen (chronological) order.
 */
export function buildTrendSeries(
  points: readonly MonthlyRevenuePoint[],
  timeframe: TrendTimeframe,
): TrendPoint[] {
  if (timeframe === "Monthly") {
    return points.map((point) => ({
      label: monthLabel(point.month),
      value: point.amount,
    }));
  }

  const totals = new Map<string, TrendPoint>();
  for (const point of points) {
    const year = point.month.slice(0, 4);
    const quarter = Math.floor((Number(point.month.slice(5, 7)) - 1) / 3);
    const key = timeframe === "Quarterly" ? `${year}-${quarter}` : year;
    const label = timeframe === "Quarterly" ? `Q${quarter + 1}` : year;
    const current = totals.get(key);
    totals.set(key, { label, value: (current?.value ?? 0) + point.amount });
  }
  return [...totals.values()];
}

export interface CollectionSummary {
  collected: number;
  unpaid: number;
  /** Whole percent of billed rent that was collected; 0 when nothing was billed. */
  percent: number;
}

/** Totals across the collection history window. */
export function summarizeCollection(
  points: readonly CollectionMonthPoint[],
): CollectionSummary {
  let collected = 0;
  let unpaid = 0;
  for (const point of points) {
    collected += point.collected;
    unpaid += point.unpaid;
  }
  const billed = collected + unpaid;
  return {
    collected,
    unpaid,
    percent: billed > 0 ? Math.round((collected / billed) * 100) : 0,
  };
}
