import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@repo/supabase";

export type TenancyApartment = {
  id: string;
  name: string;
  street_address: string;
  barangay: string;
  city: string;
  province: string;
  monthly_rent: number | null;
  type: string | null;
  no_bedrooms: number | null;
  no_bathrooms: number | null;
  area_sqm: number | null;
  amenities: string[] | null;
  description: string | null;
  furnished_type: string | null;
  floor_level: string | null;
  max_occupants: number | null;
  lease_duration: string | null;
  lease_agreement_url: string | null;
  apartment_images: { url: string; is_cover: boolean | null }[] | null;
};

export type TenancyLandlord = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  mobile_number: string | null;
  avatar_url: string | null;
};

/** Rental/property context only. Billing is loaded separately by useTenancy. */
export type ActiveTenancy = {
  id: string;
  lease_start: string;
  lease_end: string | null;
  monthly_rent: number | null;
  // Day of the month rent falls due (server source of truth, default 5).
  rent_due_day: number;
  status: string;
  signed_lease_path: string | null;
  signed_lease_uploaded_at: string | null;
  tenant_acknowledged_at: string | null;
  apartment: TenancyApartment;
  landlord: TenancyLandlord | null;
};

/** One fresh server request's context; never persisted or reused as authority. */
export interface InitialRentalContext {
  authUserId: string;
  /** Server-resolved query filter only; every secondary read still uses RLS. */
  tenantId?: string;
  tenancy: ActiveTenancy | null;
  error: string | null;
  /** Keep the server shell's date identical during browser hydration. */
  renderedAt: string;
}

/** Fresh caller-bound read; the internal tenant id is a filter, never authorization. */
export async function fetchActiveTenancyWith(supabase: Pick<SupabaseClient<Database>, "from">, tenantId: string): Promise<ActiveTenancy | null> {
  const { data, error } = await supabase
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
        id,
        name,
        street_address,
        barangay,
        city,
        province,
        monthly_rent,
        type,
        no_bedrooms,
        no_bathrooms,
        area_sqm,
        amenities,
        description,
        furnished_type,
        floor_level,
        max_occupants,
        lease_duration,
        lease_agreement_url,
        apartment_images (url, is_cover)
      ),
      landlord:users!tenancies_landlord_id_fkey (
        id,
        first_name,
        last_name,
        email,
        mobile_number,
        avatar_url
      )
    `)
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(error.message);
  const tenancy = data as ActiveTenancy | null;
  // A hidden/unreadable apartment must never become usable rental context.
  return tenancy?.apartment ? tenancy : null;
}
