import type { DashboardData } from "./get-dashboard-data";

export interface DashboardApartmentRow {
  status: string | null;
}

export interface DashboardPaymentRow {
  amount: number | string | null;
  date: string | null;
  status: string | null;
  due_date: string | null;
}

const MONTHS_BACK = 6;

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date): string {
  return d.toLocaleString("en-US", { month: "short" });
}

/** Overdue is derived: past due_date with an unsettled status. */
export function isOverdue(
  status: string,
  dueDate: string | null,
  today: string,
): boolean {
  return (
    dueDate !== null &&
    dueDate < today &&
    (status === "pending" || status === "unpaid" || status === "partial")
  );
}

function toDateKey(today: Date): string {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

/**
 * Pure dashboard rollup shared by the server loader. Canonical statuses come
 * from the payment_status_check constraint ('pending' | 'paid' | 'partial' |
 * 'unpaid'); anything not 'paid' counts as unsettled. Occupancy is the share
 * of non-deleted apartments flagged 'occupied' (kept in sync with active
 * tenancies by DB triggers); null when there are no properties.
 */
export function summarizeDashboard(
  apartments: DashboardApartmentRow[] | null,
  payments: DashboardPaymentRow[] | null,
  today: Date = new Date(),
): DashboardData {
  const liveApartments = apartments ?? [];
  const totalProperties = liveApartments.length;
  const occupiedCount = liveApartments.filter((a) => a.status === "occupied").length;
  const occupancyRate =
    totalProperties > 0 ? Math.round((occupiedCount / totalProperties) * 100) : null;

  const landlordPayments = payments ?? [];
  const todayStr = toDateKey(today);
  const currentMonth = monthKey(today);

  // Seed the last 7 month buckets (oldest → newest).
  const buckets = new Map<string, { label: string; revenue: number }>();
  for (let i = MONTHS_BACK; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    buckets.set(monthKey(d), { label: monthLabel(d), revenue: 0 });
  }

  let totalRevenueThisMonth = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;

  for (const p of landlordPayments) {
    const amount = Number(p.amount ?? 0);
    const status = p.status ?? "pending";

    if (status === "paid") {
      paidCount += 1;
      if (p.date) {
        const key = p.date.slice(0, 7);
        const bucket = buckets.get(key);
        if (bucket) bucket.revenue += amount;
        if (key === currentMonth) totalRevenueThisMonth += amount;
      }
    } else if (isOverdue(status, p.due_date, todayStr)) {
      overdueCount += 1;
    } else {
      pendingCount += 1;
    }
  }

  return {
    totalProperties,
    totalRevenueThisMonth,
    occupancyRate,
    pendingPayments: pendingCount + overdueCount,
    monthlyRevenue: [...buckets.values()].map(({ label, revenue }) => ({
      month: label,
      revenue,
    })),
    rentCollection: [
      { name: "paid", label: "Paid", value: paidCount },
      { name: "pending", label: "Pending", value: pendingCount },
      { name: "overdue", label: "Overdue", value: overdueCount },
    ],
    hasPayments: landlordPayments.length > 0,
  };
}
