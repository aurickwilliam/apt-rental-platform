"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserClient } from "@repo/supabase";

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
  move_in_date: string;
  move_out_date: string | null;
  monthly_rent: number | null;
  status: string;
  apartment: TenancyApartment;
  landlord: TenancyLandlord | null;
};

export function useTenancy() {
  const [tenancy, setTenancy] = useState<CurrentTenancy | null>(null);
  const [payments, setPayments] = useState<TenancyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenancy = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setTenancy(null);
        setPayments([]);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        setError(profileError?.message ?? "Profile not found");
        setTenancy(null);
        setPayments([]);
        return;
      }

      const { data: tenancyData, error: tenancyError } = await supabase
        .from("tenancies")
        .select(`
          id,
          move_in_date,
          move_out_date,
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

      if (tenancyError) {
        setError(tenancyError.message);
        setTenancy(null);
        setPayments([]);
        return;
      }

      if (!tenancyData) {
        setTenancy(null);
        setPayments([]);
        return;
      }

      const { data: paymentRows, error: paymentError } = await supabase
        .from("payment")
        .select("id, amount, status, date, due_date, period_start, period_end")
        .eq("tenancy_id", tenancyData.id)
        .order("date", { ascending: false });

      if (paymentError) {
        setError(paymentError.message);
      }

      setTenancy(tenancyData as CurrentTenancy);
      setPayments((paymentRows ?? []) as TenancyPayment[]);
    } catch (err) {
      console.error("useTenancy:", err);
      setError("An unexpected error occurred.");
      setTenancy(null);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTenancy();
  }, [fetchTenancy]);

  const currentPayment = payments[0] ?? null;

  return {
    tenancy,
    payments,
    currentPayment,
    loading,
    error,
    refetch: fetchTenancy,
  };
}
