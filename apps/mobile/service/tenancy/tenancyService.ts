import { supabase } from "@repo/supabase";

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

export interface CurrentTenancy {
  id: string;
  lease_start: string;
  lease_end: string | null;
  monthly_rent: number | null;
  status: string;
  apartment: TenancyApartment;
  landlord: TenancyLandlord | null;
  currentPayment: TenancyPayment | null;
}

type TenancyWithoutPayment = Omit<CurrentTenancy, "currentPayment">;

export async function fetchTenancy(tenantId: string): Promise<CurrentTenancy | null> {
  const { data: tenancyData, error: tenancyError } = await supabase
    .from("tenancies")
    .select(`
      id,
      lease_start,
      lease_end,
      monthly_rent,
      status,
      apartment:apartments (
        id, name, street_address, barangay, city, province, zip_code, monthly_rent,
        type, no_bedrooms, no_bathrooms, area_sqm, amenities, description,
        furnished_type, floor_level, max_occupants, lease_duration,
        lease_agreement_url
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

  const { data: paymentData, error: paymentError } = await supabase
    .from("payment")
    .select("id, amount, status, period_start, period_end, due_date")
    .eq("tenancy_id", tenancyData.id)
    .order("period_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (paymentError) throw paymentError;

  return {
    ...(tenancyData as unknown as TenancyWithoutPayment),
    currentPayment: paymentData as TenancyPayment | null,
  };
}
