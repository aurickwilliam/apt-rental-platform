"use client";

import { createBrowserClient } from "@repo/supabase";

import { useAsyncResource } from "@/hooks/use-async-resource";

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
};

export type TenancyLandlord = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  mobile_number: string | null;
  avatar_url: string | null;
};

export type TenancyPayment = {
  id: string;
  amount: number | null;
  status: string | null;
  date: string;
  due_date: string | null;
  period_start: string | null;
  period_end: string | null;
};

export type CurrentTenancy = {
  id: string;
  lease_start: string;
  lease_end: string | null;
  monthly_rent: number | null;
  status: string;
  apartment: TenancyApartment;
  landlord: TenancyLandlord | null;
};

interface TenancyData {
  tenancy: CurrentTenancy | null;
  payments: TenancyPayment[];
  /** Payments failed to load; the tenancy itself is still shown. */
  paymentError: string | null;
}

const NO_TENANCY: TenancyData = { tenancy: null, payments: [], paymentError: null };

async function fetchCurrentTenancy(): Promise<TenancyData> {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NO_TENANCY;

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (profileError || !profile) throw new Error(profileError?.message ?? "Profile not found");

  const { data: tenancyData, error: tenancyError } = await supabase
    .from("tenancies")
    .select(`
      id,
      lease_start,
      lease_end,
      monthly_rent,
      status,
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
        lease_agreement_url
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
    .eq("tenant_id", profile.id)
    .eq("status", "active")
    .maybeSingle();
  if (tenancyError) throw new Error(tenancyError.message);
  if (!tenancyData) return NO_TENANCY;

  const { data: paymentRows, error: paymentError } = await supabase
    .from("payment")
    .select("id, amount, status, date, due_date, period_start, period_end")
    .eq("tenancy_id", tenancyData.id)
    .order("date", { ascending: false });

  return {
    tenancy: tenancyData as CurrentTenancy,
    payments: (paymentRows ?? []) as TenancyPayment[],
    paymentError: paymentError?.message ?? null,
  };
}

export function useTenancy() {
  const { data, loading, error, refresh } = useAsyncResource(
    fetchCurrentTenancy,
    NO_TENANCY,
    "An unexpected error occurred.",
  );
  const tenancy = error ? null : data.tenancy;
  const payments = error ? NO_TENANCY.payments : data.payments;

  return {
    tenancy,
    payments,
    currentPayment: payments[0] ?? null,
    loading,
    error: error ?? data.paymentError,
    refetch: refresh,
  };
}
