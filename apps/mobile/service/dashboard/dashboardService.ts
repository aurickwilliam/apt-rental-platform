import { supabase } from "@repo/supabase";

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
