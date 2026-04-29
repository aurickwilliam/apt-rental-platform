import { create } from 'zustand';
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

type TenancyStore = {
  tenancy: CurrentTenancy | null;
  loading: boolean;
  error: string | null;
  hasFetched: boolean;
  fetchTenancy: () => Promise<void>;
  clearTenancy: () => void;
};

export const useTenancyStore = create<TenancyStore>((set, get) => ({
  tenancy: null,
  loading: false,
  error: null,
  hasFetched: false,

  fetchTenancy: async () => {
    // Skip if already fetched — prevents re-fetch on tab switch
    if (get().hasFetched) return;

    set({ loading: true, error: null });

    try {
      // Step 1: Get auth user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false, hasFetched: true });
        return;
      }

      // Step 2: Resolve public.users.id from auth uid
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        set({ loading: false, hasFetched: true, error: profileError?.message ?? null });
        return;
      }

      // Step 3: Fetch active tenancy with apartment + landlord
      const { data: tenancyData, error: tenancyError } = await supabase
        .from('tenancies')
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
            monthly_rent
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
        .eq('tenant_id', profile.id)
        .eq('status', 'active')
        .maybeSingle();

      if (tenancyError) {
        set({ error: tenancyError.message, loading: false, hasFetched: true });
        return;
      }

      if (!tenancyData) {
        set({ tenancy: null, loading: false, hasFetched: true });
        return;
      }

      // Step 4: Fetch the most recent payment for this tenancy
      const { data: paymentData } = await supabase
        .from('payment')
        .select('id, amount, status, period_start, period_end, due_date')
        .eq('tenancy_id', tenancyData.id)
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      set({
        tenancy: { ...(tenancyData as any), currentPayment: paymentData ?? null },
        loading: false,
        hasFetched: true,
      });
    } catch (err) {
      console.error('useTenancyStore.fetchTenancy:', err);
      set({ error: 'An unexpected error occurred.', loading: false, hasFetched: true });
    }
  },

  // Call this on sign-out so next login fetches fresh data
  clearTenancy: () => set({ tenancy: null, hasFetched: false, error: null }),
}));