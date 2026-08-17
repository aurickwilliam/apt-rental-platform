import { supabase } from "@repo/supabase";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export interface DashboardStats {
  totalProperties: number;
  unitsOccupied: number;
  pendingPayments: number;
  maintenanceRequests: number;
}

export async function fetchDashboardStats(landlordId: string): Promise<DashboardStats> {
  const { data: apartmentRows, error: apartmentsError } = await supabase
    .from("apartments")
    .select("id")
    .eq("landlord_id", landlordId)
    .is("deleted_at", null);

  if (apartmentsError) throw apartmentsError;

  const apartmentIds = (apartmentRows ?? []).map((apartment) => apartment.id);
  const unitsOccupiedQuery = supabase
    .from("tenancies")
    .select("id", { count: "exact", head: true })
    .eq("landlord_id", landlordId)
    .eq("status", "active");

  if (apartmentIds.length === 0) {
    const { count: unitsOccupied, error: unitsOccupiedError } = await unitsOccupiedQuery;
    if (unitsOccupiedError) throw unitsOccupiedError;

    return {
      totalProperties: 0,
      unitsOccupied: unitsOccupied ?? 0,
      pendingPayments: 0,
      maintenanceRequests: 0,
    };
  }

  const [
    { count: unitsOccupied, error: unitsOccupiedError },
    { count: pendingPayments, error: pendingPaymentsError },
    { count: maintenanceRequests, error: maintenanceRequestsError },
  ] = await Promise.all([
    unitsOccupiedQuery,
    supabase
      .from("payment")
      .select("id", { count: "exact", head: true })
      .eq("status", "not paid")
      .in("apartment_id", apartmentIds),
    supabase
      .from("maintenance_request")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "in_progress"])
      .in("apartment_id", apartmentIds),
  ]);

  if (unitsOccupiedError) throw unitsOccupiedError;
  if (pendingPaymentsError) throw pendingPaymentsError;
  if (maintenanceRequestsError) throw maintenanceRequestsError;

  return {
    totalProperties: apartmentIds.length,
    unitsOccupied: unitsOccupied ?? 0,
    pendingPayments: pendingPayments ?? 0,
    maintenanceRequests: maintenanceRequests ?? 0,
  };
}

// ─── Landlord dashboard charts & rent dues ────────────────────────────────────

export interface MonthlyRevenuePoint {
  month: string;
  amount: number;
}

export interface PropertyRevenue {
  apartmentId: string;
  apartmentName: string;
  amount: number;
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

function toDateKey(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

async function fetchLandlordApartmentRows(landlordId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("apartments")
    .select("id, name")
    .eq("landlord_id", landlordId)
    .is("deleted_at", null);

  if (error) throw error;

  return data ?? [];
}

export async function fetchMonthlyRevenue(
  landlordId: string,
  months = 12
): Promise<MonthlyRevenuePoint[]> {
  const apartments = await fetchLandlordApartmentRows(landlordId);
  if (apartments.length === 0) return [];

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data, error } = await supabase
    .from("payment")
    .select("date, amount")
    .in("apartment_id", apartments.map((a) => a.id))
    .eq("status", "paid")
    .gte("date", toDateKey(startDate))
    .lte("date", toDateKey(endDate));

  if (error) throw error;

  const totalsByMonth = new Map<string, number>();
  for (const payment of data ?? []) {
    const monthKey = (payment.date ?? "").slice(0, 7);
    if (!monthKey) continue;
    totalsByMonth.set(monthKey, (totalsByMonth.get(monthKey) ?? 0) + Number(payment.amount ?? 0));
  }

  const points: MonthlyRevenuePoint[] = [];
  for (let i = 0; i < months; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    points.push({
      month: MONTH_LABELS[monthDate.getMonth()],
      amount: totalsByMonth.get(key) ?? 0,
    });
  }

  return points;
}

export async function fetchRevenueByProperty(
  landlordId: string,
  year: number,
  monthIndex: number
): Promise<PropertyRevenue[]> {
  const apartments = await fetchLandlordApartmentRows(landlordId);
  if (apartments.length === 0) return [];

  const startDate = new Date(year, monthIndex, 1);
  const endDate = new Date(year, monthIndex + 1, 0);

  const { data, error } = await supabase
    .from("payment")
    .select("apartment_id, amount")
    .in("apartment_id", apartments.map((a) => a.id))
    .eq("status", "paid")
    .gte("date", toDateKey(startDate))
    .lte("date", toDateKey(endDate));

  if (error) throw error;

  const totalsByApartment = new Map<string, number>();
  for (const payment of data ?? []) {
    if (!payment.apartment_id) continue;
    totalsByApartment.set(
      payment.apartment_id,
      (totalsByApartment.get(payment.apartment_id) ?? 0) + Number(payment.amount ?? 0)
    );
  }

  return apartments
    .map((apartment) => ({
      apartmentId: apartment.id,
      apartmentName: apartment.name,
      amount: totalsByApartment.get(apartment.id) ?? 0,
    }))
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export async function fetchRentDues(landlordId: string): Promise<RentDue[]> {
  const apartments = await fetchLandlordApartmentRows(landlordId);
  if (apartments.length === 0) return [];

  const { data, error } = await supabase
    .from("payment")
    .select(
      `
        id, apartment_id, due_date, amount,
        apartment:apartments!payment_apartment_id_fkey (name),
        tenant:users!payment_tenant_id_fkey (first_name, last_name)
      `
    )
    .in("apartment_id", apartments.map((a) => a.id))
    .neq("status", "paid")
    .not("due_date", "is", null)
    .order("due_date", { ascending: true });

  if (error) throw error;

  const todayKey = toDateKey(new Date());

  return (data ?? []).map((payment) => ({
    id: payment.id,
    apartmentId: payment.apartment_id ?? "",
    apartmentName: payment.apartment?.name ?? "Apartment",
    tenantName:
      [payment.tenant?.first_name, payment.tenant?.last_name].filter(Boolean).join(" ") ||
      "Tenant",
    dueDate: payment.due_date ?? "",
    amount: Number(payment.amount ?? 0),
    isOverdue: (payment.due_date ?? "") < todayKey,
  }));
}
