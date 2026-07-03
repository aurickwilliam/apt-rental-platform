import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '@repo/supabase';

export type LandlordTenant = {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  avatarUrl: string | null;
  leaseStart: string;
  leaseEnd: string | null;
  tenancyId: string;
};

export type MaintenanceRequest = {
  id: string;
  title: string;
  reportedDate: string;
};

export type PaymentRecord = {
  id: string;
  month: string;
  year: string;
  amount: number;
  paidDate: string;
  status: 'paid' | 'partial';
};

export function useLandlordTenancy(apartmentId: string | undefined) {
  const [tenant, setTenant] = useState<LandlordTenant | null>(null);
  const [maintenanceRequest, setMaintenanceRequest] = useState<MaintenanceRequest | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!apartmentId) return;
    setLoading(true);

    try {
      const { data: tenancyData } = await supabase
        .from('tenancies')
        .select(`
          id,
          lease_start,
          lease_end,
          tenant:users!tenancies_tenant_id_fkey (
            id,
            first_name,
            last_name,
            mobile_number,
            email,
            avatar_url
          )
        `)
        .eq('apartment_id', apartmentId)
        .eq('status', 'active')
        .maybeSingle();

      if (tenancyData?.tenant) {
        const t = tenancyData.tenant as {
          id: string;
          first_name: string;
          last_name: string;
          mobile_number: string;
          email: string | null;
          avatar_url: string | null;
        };
        setTenant({
          id: t.id,
          fullName: `${t.first_name} ${t.last_name}`,
          email: t.email ?? '—',
          mobileNumber: t.mobile_number,
          avatarUrl: t.avatar_url,
          leaseStart: tenancyData.lease_start,
          leaseEnd: tenancyData.lease_end,
          tenancyId: tenancyData.id,
        });
      } else {
        setTenant(null);
      }

      const { data: maintData } = await supabase
        .from('maintenance_request')
        .select('id, title, created_at')
        .eq('apartment_id', apartmentId)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setMaintenanceRequest(
        maintData
          ? {
              id: maintData.id,
              title: maintData.title,
              reportedDate: new Date(maintData.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
            }
          : null
      );

      const { data: payments } = await supabase
        .from('payment')
        .select('id, amount, date, status')
        .eq('apartment_id', apartmentId)
        .in('status', ['paid', 'partial'])
        .order('date', { ascending: false })
        .limit(4);

      setPaymentHistory(
        (payments ?? []).map((p) => {
          const d = new Date(p.date);
          return {
            id: p.id,
            month: d.toLocaleString('default', { month: 'long' }),
            year: String(d.getFullYear()),
            amount: Number(p.amount ?? 0),
            paidDate: `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`,
            status: p.status as 'paid' | 'partial',
          };
        })
      );
    } catch (err) {
      console.error('useLandlordTenancy:', err);
    } finally {
      setLoading(false);
    }
  }, [apartmentId]);

  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [fetch])
  );

  return { tenant, maintenanceRequest, paymentHistory, loading, refetch: fetch };
}
