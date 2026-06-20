import { useEffect, useState } from 'react';
import { supabase } from '@repo/supabase';
import { useProfile } from './useProfile';

type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export type TenantApplication = {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  rejected_reason: string | null;
  apartment_id: string;
  apartments: {
    name: string;
    monthly_rent: number;
  };
};

export function useTenantApplications() {
  const { profile, loading: profileLoading } = useProfile();
  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileLoading) return;

    if (!profile?.id) {
      setApplications([]);
      setLoading(false);
      return;
    }

    async function fetch() {
      setLoading(true);

      const { data } = await supabase
        .from('rental_application')
        .select(
          'id, status, created_at, rejected_reason, apartment_id, apartments(name, monthly_rent)'
        )
        .eq('tenant_id', profile!.id)
        .order('created_at', { ascending: false });

      setApplications(
        (data ?? []).map(item => ({
          ...item,
          status: item.status as ApplicationStatus,
        }))
      );

      setLoading(false);
    }

    fetch();
  }, [profile, profileLoading]);

  return { applications, loading: loading || profileLoading };
}