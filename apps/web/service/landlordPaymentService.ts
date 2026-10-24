"use client";

import { createClient } from "@repo/supabase/browser";
import type { PaymentRecord } from "@/service/paymentService";
import type { PaymentAllocation } from "@repo/utils";

export type { PaymentRecord };

export type LandlordApartment = {
  id: string;
  name: string;
};

/** A payment with the unit it belongs to, so rows from several units can be told apart. */
export type LandlordPaymentRecord = PaymentRecord & { apartment_id: string };

export { ALL_APARTMENTS } from "@/lib/landlord-payments-view";

// Landlord unit list for the payments selector. RLS scopes apartments to the
// signed-in landlord; role-gated to landlord profiles like the applications flow.
export async function fetchLandlordApartments(): Promise<LandlordApartment[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profileData, error: profileError } = await supabase
    .from("users")
    .select("id, roles")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  const profile = profileData as unknown as { id: string; roles: string[] } | null;
  if (!profile?.roles.includes("landlord")) return [];

  const { data, error } = await supabase
    .from("apartments")
    .select("id, name")
    .eq("landlord_id", profile.id as string)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as LandlordApartment[]).map((apt) => ({ id: apt.id, name: apt.name }));
}

type LandlordPaymentRow = PaymentAllocation & {
  id: string;
  created_at: string;
  date: string;
  amount: number | null;
  status: string;
  method: string | null;
  reference_id: string | null;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  apartment_id: string;
  apartment: { name: string | null } | null;
  tenant: { first_name: string | null; last_name: string | null } | null;
};

const LANDLORD_PAYMENT_SELECT = `
  billing_kind, rent_amount, deposit_amount, advance_amount, maintenance_amount,
  advance_period_start, advance_period_end,
  id,
  created_at,
  date,
  amount,
  status,
  method,
  reference_id,
  period_start,
  period_end,
  due_date,
  apartment_id,
  apartment:apartments (name),
  tenant:users!payment_tenant_id_fkey (first_name, last_name)
`;

function toPaymentRecord(row: LandlordPaymentRow, fallbackApartmentName: string | null = null): LandlordPaymentRecord {
  const tenant = row.tenant;
  return {
    billing_kind: row.billing_kind,
    rent_amount: row.rent_amount,
    deposit_amount: row.deposit_amount,
    advance_amount: row.advance_amount,
    maintenance_amount: row.maintenance_amount,
    advance_period_start: row.advance_period_start,
    advance_period_end: row.advance_period_end,
    id: row.id,
    created_at: row.created_at,
    date: row.date,
    amount: row.amount,
    status: row.status,
    method: row.method,
    reference_id: row.reference_id,
    period_start: row.period_start,
    period_end: row.period_end,
    due_date: row.due_date,
    apartment_id: row.apartment_id,
    apartment_name: row.apartment?.name ?? fallbackApartmentName,
    landlord_name: null,
    tenant_name:
      tenant?.first_name || tenant?.last_name
        ? `${tenant.first_name ?? ""} ${tenant.last_name ?? ""}`.trim()
        : null,
  };
}

export const LANDLORD_PAYMENTS_LIMIT = 200;
export const LANDLORD_ALL_PAYMENTS_LIMIT = 500;

// Mobile parity: landlord sees every status for the unit (pending included).
export async function fetchLandlordPayments(apartmentId: string): Promise<LandlordPaymentRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment")
    .select(LANDLORD_PAYMENT_SELECT)
    .eq("apartment_id", apartmentId)
    .order("period_start", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(LANDLORD_PAYMENTS_LIMIT);

  if (error) throw error;
  return (data as unknown as LandlordPaymentRow[]).map((row) => toPaymentRecord(row));
}

// Every unit the landlord owns, newest first. The unit list is read first and
// the payment query is bound to those ids, so the result never depends on RLS
// alone (a profile that is also an admin can read other landlords' payments).
export async function fetchAllLandlordPayments(): Promise<LandlordPaymentRecord[]> {
  const apartments = await fetchLandlordApartments();
  if (apartments.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment")
    .select(LANDLORD_PAYMENT_SELECT)
    .in("apartment_id", apartments.map((apartment) => apartment.id))
    .order("period_start", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(LANDLORD_ALL_PAYMENTS_LIMIT);

  if (error) throw error;
  return (data as unknown as LandlordPaymentRow[]).map((row) => toPaymentRecord(row));
}

export async function fetchLandlordPaymentById(id: string): Promise<PaymentRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("payment").select(LANDLORD_PAYMENT_SELECT).eq("id", id).maybeSingle();

  if (error) throw error;
  return data ? toPaymentRecord(data as unknown as LandlordPaymentRow) : null;
}

// Only cash rows awaiting landlord confirmation are hand-resolved; the
// webhook owns e-wallet/card rows. RLS + database transition guard gate this.
export async function updateLandlordPaymentStatus(
  id: string,
  status: "paid" | "rejected",
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error, data } = await supabase
    .from("payment")
    .update({ status })
    .eq("id", id)
    .eq("method", "cash")
    .eq("status", "pending")
    .select("id");

  if (error || !data || data.length === 0) {
    return { success: false, error: error?.message ?? "Could not update payment status." };
  }
  return { success: true };
}
