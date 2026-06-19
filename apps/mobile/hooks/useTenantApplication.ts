import { useEffect, useState } from 'react';
import { supabase } from '@repo/supabase';
import { useProfile } from './useProfile';

type ApplicationStatus = 'pending' | 'approved' | 'rejected';

type TenantApplication = {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  rejected_reason: string | null;
  apartments: {
    name: string;
    monthly_rent: number;
  };
};

export function useTenantApplication() {
  const { profile } = useProfile();
  const [application, setApplication] = useState<TenantApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    async function fetch() {
      const { data } = await supabase
        .from('rental_application')
        .select('id, status, created_at, rejected_reason, apartments(name, monthly_rent)')
        .eq('tenant_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setApplication(
        data
          ? { ...data, status: data.status as ApplicationStatus }
          : null
      );
      setLoading(false);
    }

    fetch();
  }, [profile]); // profile, not profile?.id

  return { application, loading };
}