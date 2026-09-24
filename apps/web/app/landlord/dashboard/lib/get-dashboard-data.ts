import { createClient } from "@repo/supabase/server";

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

const MONTHS_BACK = 6;

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date): string {
  return d.toLocaleString("en-US", { month: "short" });
}

/** Overdue is derived: past due_date with an unsettled status. */
function isOverdue(
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

  const liveApartments = apartments ?? [];
  const totalProperties = liveApartments.length;
  const occupiedCount = liveApartments.filter((a) => a.status === "occupied").length;
  const occupancyRate =
    totalProperties > 0 ? Math.round((occupiedCount / totalProperties) * 100) : null;

  const landlordPayments = payments ?? [];
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
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
