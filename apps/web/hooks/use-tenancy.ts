"use client";

import { createClient } from "@repo/supabase/browser";
import type { TenancyBill } from "@repo/utils";
import { useEffect } from "react";

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

export type TenancyPayment = {
  billing_kind?: string | null;
  id: string;
  amount: number | null;
  status: string | null;
  date: string;
  due_date: string | null;
  period_start: string | null;
  period_end: string | null;
};

export type CurrentTenancy = {
  bill?: TenancyBill | null;
  id: string;
  lease_start: string;
  lease_end: string | null;
  monthly_rent: number | null;
  // Day of the month rent falls due (server source of truth, default 5).
  rent_due_day: number;
  status: string;
  // Executed contract uploaded by the landlord; tenants view and confirm it.
  signed_lease_path: string | null;
  signed_lease_uploaded_at: string | null;
  tenant_acknowledged_at: string | null;
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
  const supabase = createClient();
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
    .eq("tenant_id", profile.id)
    .eq("status", "active")
    .maybeSingle();
  if (tenancyError) throw new Error(tenancyError.message);
  if (!tenancyData) return NO_TENANCY;

  const [{ data: bill, error: billError }, { data: paymentRows, error: paymentError }] = await Promise.all([
    supabase.rpc("get_tenancy_bill", { p_tenancy_id: tenancyData.id }),
    supabase.from("payment")
      .select("id, amount, status, date, due_date, period_start, period_end, billing_kind")
      .eq("tenancy_id", tenancyData.id)
      .order("period_start", { ascending: false })
      .order("date", { ascending: false })
      .limit(200),
  ]);
  if (billError) throw new Error(billError.message);

  return {
    tenancy: { ...tenancyData, bill: bill as unknown as TenancyBill | null } as CurrentTenancy,
    payments: (paymentRows ?? []) as TenancyPayment[],
    paymentError: paymentError?.message ?? null,
  };
}

// The payment with the latest period (like mobile's fetchTenancy): the rent
// status reuses its dates when it covers the month being billed.
function latestPeriodPayment(payments: TenancyPayment[]): TenancyPayment | null {
  return payments.reduce<TenancyPayment | null>(
    (latest, payment) =>
      (payment.period_start ?? "") > (latest?.period_start ?? "") ? payment : latest,
    payments[0] ?? null,
  );
}

export function useTenancy() {
  const { data, loading, error, refresh, revalidate } = useAsyncResource(
    fetchCurrentTenancy,
    NO_TENANCY,
    "An unexpected error occurred.",
  );
  const tenancy = error ? null : data.tenancy;
  const payments = error ? NO_TENANCY.payments : data.payments;
  const hasBill = !!tenancy?.bill;

  // Coming back to the tab re-reads the bill so a landlord's confirmation
  // shows up, but silently: no skeleton flash and no error takeover.
  useEffect(() => {
    if (!hasBill) return;
    const onFocus = () => { void revalidate(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [hasBill, revalidate]);

  return {
    tenancy,
    payments,
    currentPayment: latestPeriodPayment(payments),
    loading,
    error: error ?? data.paymentError,
    refetch: refresh,
  };
}
