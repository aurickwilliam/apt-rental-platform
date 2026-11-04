import { supabase } from "@repo/supabase";
import type { TenancyBill } from "@repo/utils";

import { coverImageUrl, type ApartmentImageRow } from "@/service/apartments/coverImage";

export interface TenancyApartment {
  id: string;
  name: string;
  street_address: string;
  barangay: string;
  city: string;
  province: string;
  zip_code: string;
  monthly_rent: number;
  type: string;
  no_bedrooms: number;
  no_bathrooms: number;
  area_sqm: number;
  amenities: string[] | null;
  description: string;
  furnished_type: string | null;
  floor_level: string | null;
  max_occupants: number | null;
  lease_duration: string | null;
  lease_agreement_url: string | null;
  // Full-size cover photo (public CDN URL), or null when the listing has none.
  cover_url: string | null;
}

export interface TenancyLandlord {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  mobile_number: string | null;
  avatar_url: string | null;
}

export interface TenancyPayment {
  id: string;
  amount: number | null;
  status: string;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
}

// A pending maintenance fee that rides on the next rent. Only tenancies without a
// server bill (billing_version null) carry these, because a server bill already
// lists its own fees.
export interface TenancyFee {
  id: string;
  title: string;
  amount: number;
}

export interface CurrentTenancy {
  bill?: TenancyBill | null;
  legacyFees?: TenancyFee[];
  id: string;
  lease_start: string;
  lease_end: string | null;
  monthly_rent: number | null;
  // Day of the month rent falls due (server source of truth, default 5).
  rent_due_day: number;
  status: string;
  apartment: TenancyApartment;
  landlord: TenancyLandlord | null;
  currentPayment: TenancyPayment | null;
  signed_lease_path: string | null;
  signed_lease_uploaded_at: string | null;
  tenant_acknowledged_at: string | null;
}

type TenancyRow = Omit<CurrentTenancy, "currentPayment" | "apartment"> & {
  apartment: Omit<TenancyApartment, "cover_url"> & {
    apartment_images: ApartmentImageRow[] | null;
  };
};

export async function fetchTenancy(tenantId: string): Promise<CurrentTenancy | null> {
  const { data: tenancyData, error: tenancyError } = await supabase
    .from("tenancies")
    .select(`
      id,
      lease_start,
      lease_end,
      monthly_rent,
      rent_due_day,
      status,
      signed_lease_path,
      signed_lease_uploaded_at,
      tenant_acknowledged_at,
      apartment:apartments (
        id, name, street_address, barangay, city, province, zip_code, monthly_rent,
        type, no_bedrooms, no_bathrooms, area_sqm, amenities, description,
        furnished_type, floor_level, max_occupants, lease_duration,
        lease_agreement_url,
        apartment_images ( url, url_thumb, is_cover, created_at )
      ),
      landlord:users!tenancies_landlord_id_fkey (
        id, first_name, last_name, email, mobile_number, avatar_url
      )
    `)
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .maybeSingle();

  if (tenancyError) throw tenancyError;
  if (!tenancyData) return null;

  const [{ data: bill, error: billError }, { data: paymentData, error: paymentError }] = await Promise.all([
    supabase.rpc("get_tenancy_bill", { p_tenancy_id: tenancyData.id }),
    supabase.from("payment")
      .select("id, amount, status, period_start, period_end, due_date")
      .eq("tenancy_id", tenancyData.id)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (billError) throw billError;

  if (paymentError) throw paymentError;

  const legacyFees = bill ? [] : await fetchPendingMaintenanceFees(tenancyData.id, tenantId);

  const { apartment: apartmentRow, ...tenancy } = tenancyData as unknown as TenancyRow;
  const { apartment_images: apartmentImages, ...apartment } = apartmentRow;

  return {
    ...tenancy,
    signed_lease_path: tenancy.signed_lease_path ?? null,
    signed_lease_uploaded_at: tenancy.signed_lease_uploaded_at ?? null,
    tenant_acknowledged_at: tenancy.tenant_acknowledged_at ?? null,
    bill: bill as unknown as TenancyBill | null,
    legacyFees,
    apartment: { ...apartment, cover_url: coverImageUrl(apartmentImages, "full") },
    currentPayment: paymentData as TenancyPayment | null,
  };
}

// Pending fees for a tenancy without a server bill. Fees belong to the tenancy that
// raised them: a re-let to the same tenant never inherits an older tenancy's balance.
export async function fetchPendingMaintenanceFees(tenancyId: string, tenantId: string): Promise<TenancyFee[]> {
  const { data, error } = await supabase
    .from("maintenance_request")
    .select("id, title, fee_amount")
    .eq("tenancy_id", tenancyId)
    .eq("tenant_id", tenantId)
    .eq("fee_status", "pending");
  if (error) throw error;

  return (data ?? [])
    .filter((row) => Number(row.fee_amount ?? 0) > 0)
    .map((row) => ({ id: row.id, title: row.title, amount: Number(row.fee_amount) }));
}

// Marks a tenancy's pending fees as paid once the rent payment they rode on is `paid`.
// `paidBeforeIso` bounds it to fees raised before that payment began, so a fee added
// afterwards stays pending for the next one. A server bill settles its own fees.
export async function settleMaintenanceFees(tenancyId: string, tenantId: string, paidBeforeIso: string): Promise<number> {
  const { data, error } = await supabase
    .from("maintenance_request")
    .update({ fee_status: "paid" })
    .eq("tenancy_id", tenancyId)
    .eq("tenant_id", tenantId)
    .eq("fee_status", "pending")
    .lte("created_at", paidBeforeIso)
    .select("id");
  if (error) throw error;
  return (data ?? []).length;
}
