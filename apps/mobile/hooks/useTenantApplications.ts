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
  // employment
  occupation: string;
  employer_name: string;
  monthly_income: number;
  employment_type: string;
  // previous landlord
  prev_landlord_name: string | null;
  prev_landlord_contact: string | null;
  // rental preferences
  move_in_date: string;
  no_occupants: number;
  has_pets: boolean;
  has_smoker: boolean;
  need_parking: boolean;
  message: string | null;
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
          `id, status, created_at, rejected_reason, apartment_id,
          occupation, employer_name, monthly_income, employment_type,
          prev_landlord_name, prev_landlord_contact,
          move_in_date, no_occupants, has_pets, has_smoker, need_parking, message,
          apartments(name, monthly_rent)`
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