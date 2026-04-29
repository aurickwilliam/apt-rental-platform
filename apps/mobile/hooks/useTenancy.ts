import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@repo/supabase';

export type TenancyApartment = {
  id: string;
  name: string;
  street_address: string;
  barangay: string;
  city: string;
  province: string;
  monthly_rent: number;
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
  status: string;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
};

export type CurrentTenancy = {
  id: string;
  move_in_date: string;
  move_out_date: string | null;
  monthly_rent: number | null;
  status: string;
  apartment: TenancyApartment;
  landlord: TenancyLandlord | null;
  currentPayment: TenancyPayment | null;
};

export function useTenancy() {
  const [tenancy, setTenancy] = useState<CurrentTenancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenancy = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTenancy(null);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        setError(profileError?.message ?? 'Profile not found');
        setTenancy(null);
        return;
      }

      const { data: tenancyData, error: tenancyError } = await supabase
        .from('tenancies')
        .select(`
          id,
          move_in_date,
          move_out_date,
          monthly_rent,
          status,
          apartment:apartments (
            id, name, street_address, barangay, city, province, monthly_rent
          ),
          landlord:users!tenancies_landlord_id_fkey (
            id, first_name, last_name, email, mobile_number, avatar_url
          )
        `)
        .eq('tenant_id', profile.id)
        .eq('status', 'active')
        .maybeSingle();

      if (tenancyError) {
        setError(tenancyError.message);
        setTenancy(null);
        return;
      }

      if (!tenancyData) {
        setTenancy(null);
        return;
      }

      const { data: paymentData } = await supabase
        .from('payment')
        .select('id, amount, status, period_start, period_end, due_date')
        .eq('tenancy_id', tenancyData.id)
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      setTenancy({ ...(tenancyData as any), currentPayment: paymentData ?? null });
    } catch (err) {
      console.error('useTenancy:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTenancy();
    }, [fetchTenancy])
  );

  // Realtime subscription — keeps payment status live without manual refresh
  useEffect(() => {
    let tenancyId: string | null = null;

    const channel = supabase
      .channel('tenancy-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment' },
        (payload) => {
          // Only refetch if the changed payment belongs to our tenancy
          const record = (payload.new ?? payload.old) as any;
          if (tenancyId && record?.tenancy_id === tenancyId) {
            fetchTenancy();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tenancies' },
        () => fetchTenancy()
      )
      .subscribe();

    // Store tenancy id once we have it so the payment listener can filter
    if (tenancy?.id) tenancyId = tenancy.id;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenancy?.id, fetchTenancy]);

  return { tenancy, loading, error, refetch: fetchTenancy };
}