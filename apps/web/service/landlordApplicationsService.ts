"use client";

import { createClient } from "@repo/supabase/browser";
import { formatAddress } from "@repo/utils";

export type DisplayStatus = "Applied" | "Approved" | "Rejected" | "Cancelled";

type DbStatus = "pending" | "approved" | "rejected" | "cancelled";

const STATUS_MAP: Record<DbStatus, DisplayStatus> = {
  pending: "Applied",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const OCCUPIED_ERROR_MESSAGE =
  "This unit is already occupied and cannot accept another tenant. Vacate it first, then approve.";

export type LandlordApplication = {
  id: string;
  status: DisplayStatus;
  created_at: string;
  rejected_reason: string | null;
  apartment_id: string;
  tenant_id: string;
  occupation: string;
  employer_name: string;
  monthly_income: number;
  employment_type: string;
  prev_landlord_name: string | null;
  prev_landlord_contact: string | null;
  move_in_date: string;
  no_occupants: number;
  has_pets: boolean;
  has_smoker: boolean;
  need_parking: boolean;
  message: string | null;
  gov_id_url: string | null;
  proof_of_income_url: string | null;
  proof_of_billing_url: string | null;
  nbi_clearance_url: string | null;
  tenant_name: string;
  tenant_avatar_url: string | null;
  tenant_address: string;
  tenant_email: string | null;
  tenant_city: string;
  tenant_mobile_number: string | null;
  apartment_name: string;
  monthly_rent: number;
  apartment_city: string;
  apartment_address: string;
  apartment_status: string;
};

export type LandlordContext = {
  landlordId: string | null;
  role: string | null;
  isAuthenticated: boolean;
};

export async function getLandlordContext(): Promise<LandlordContext> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    if (authError.name === "AuthSessionMissingError") {
      return { landlordId: null, role: null, isAuthenticated: false };
    }
    throw authError;
  }
  if (!user) {
    return { landlordId: null, role: null, isAuthenticated: false };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  const role = profile?.role ?? null;
  const landlordId = role === "landlord" ? profile?.id ?? null : null;

  return { landlordId, role, isAuthenticated: true };
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export async function fetchLandlordApplications(): Promise<LandlordApplication[]> {
  const supabase = createClient();

  // No landlord-side filter here — RLS scopes rows to the signed-in
  // landlord's own apartments, mirroring the mobile flow.
  const { data, error } = await supabase
    .from("rental_application")
    .select(
      `id, status, created_at, rejected_reason, apartment_id, tenant_id,
      occupation, employer_name, monthly_income, employment_type,
      prev_landlord_name, prev_landlord_contact,
      move_in_date, no_occupants, has_pets, has_smoker, need_parking, message,
      gov_id_url, proof_of_income_url, proof_of_billing_url, nbi_clearance_url,
      apartments!inner(name, monthly_rent, city, street_address, barangay, province, zip_code, status),
      users!rental_application_tenant_id_fkey(first_name, last_name, avatar_url, street_address, barangay, city, province, postal_code, email, mobile_number)`,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as Record<string, unknown>[]).map((item) => {
    const rawTenant = item.users;
    const rawApartment = item.apartments;
    const tenant = (Array.isArray(rawTenant) ? rawTenant[0] : rawTenant) as Record<
      string,
      unknown
    > | null;
    const apartment = (Array.isArray(rawApartment) ? rawApartment[0] : rawApartment) as Record<
      string,
      unknown
    > | null;

    const tenantName =
      [tenant?.first_name, tenant?.last_name].filter(Boolean).join(" ") || "Unknown Tenant";

    return {
      id: item.id as string,
      status: STATUS_MAP[item.status as DbStatus] ?? "Applied",
      created_at: item.created_at as string,
      rejected_reason: (item.rejected_reason as string | null) ?? null,
      apartment_id: item.apartment_id as string,
      tenant_id: item.tenant_id as string,
      occupation: item.occupation as string,
      employer_name: item.employer_name as string,
      monthly_income: Number(item.monthly_income ?? 0),
      employment_type: item.employment_type as string,
      prev_landlord_name: (item.prev_landlord_name as string | null) ?? null,
      prev_landlord_contact: (item.prev_landlord_contact as string | null) ?? null,
      move_in_date: item.move_in_date as string,
      no_occupants: Number(item.no_occupants ?? 0),
      has_pets: Boolean(item.has_pets),
      has_smoker: Boolean(item.has_smoker),
      need_parking: Boolean(item.need_parking),
      message: (item.message as string | null) ?? null,
      gov_id_url: (item.gov_id_url as string | null) ?? null,
      proof_of_income_url: (item.proof_of_income_url as string | null) ?? null,
      proof_of_billing_url: (item.proof_of_billing_url as string | null) ?? null,
      nbi_clearance_url: (item.nbi_clearance_url as string | null) ?? null,
      tenant_name: tenantName,
      tenant_avatar_url: asNullableString(tenant?.avatar_url),
      tenant_address: formatAddress({
        street_address: asNullableString(tenant?.street_address),
        barangay: asNullableString(tenant?.barangay),
        city: asNullableString(tenant?.city),
        province: asNullableString(tenant?.province),
        zip_code: asNullableString(tenant?.postal_code),
      }),
      tenant_email: asNullableString(tenant?.email),
      tenant_mobile_number: asNullableString(tenant?.mobile_number),
      tenant_city: asNullableString(tenant?.city) ?? "",
      apartment_name: asNullableString(apartment?.name) ?? "",
      monthly_rent: Number(apartment?.monthly_rent ?? 0),
      apartment_city: asNullableString(apartment?.city) ?? "",
      apartment_status: asNullableString(apartment?.status) ?? "available",
      apartment_address: formatAddress({
        street_address: asNullableString(apartment?.street_address),
        barangay: asNullableString(apartment?.barangay),
        city: asNullableString(apartment?.city),
        province: asNullableString(apartment?.province),
        zip_code: asNullableString(apartment?.zip_code),
      }),
    };
  });
}

export async function approveApplication(applicationId: string): Promise<void> {
  const supabase = createClient();

  // Server-side trigger creates the tenancy, flips the unit to occupied,
  // and raises 'already occupied' when the unit is taken.
  const { error } = await supabase
    .from("rental_application")
    .update({ status: "approved" })
    .eq("id", applicationId);

  if (error) {
    if (error.message.includes("already occupied")) {
      throw new Error(OCCUPIED_ERROR_MESSAGE);
    }
    throw error;
  }
}

export async function rejectApplication(
  applicationId: string,
  reason: string,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("rental_application")
    .update({ status: "rejected", rejected_reason: reason || null })
    .eq("id", applicationId);

  if (error) throw error;
}
