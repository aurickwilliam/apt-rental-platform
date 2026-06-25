import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@repo/supabase';
import { useProfile } from './useProfile';
import { formatAddress } from '@repo/utils';

type DbStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type DisplayStatus = 'Applied' | 'Approved' | 'Rejected' | 'Cancelled';

const STATUS_MAP: Record<DbStatus, DisplayStatus> = {
  pending: 'Applied',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export type LandlordApplication = {
  id: string;
  status: DisplayStatus;
  created_at: string;
  rejected_reason: string | null;
  apartment_id: string;
  tenant_id: string;
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
  // document paths (raw — sign on demand in the detail screen)
  gov_id_url: string;
  proof_of_income_url: string;
  proof_of_billing_url: string;
  nbi_clearance_url: string | null;
  // joined
  tenant_name: string;
  tenant_avatar_url: string | null;
  tenant_address: string;
  tenant_email: string;
  tenant_city: string;
  tenant_mobile_number: string;
  apartment_name: string;
  monthly_rent: number;
  apartment_city: string;
  apartment_address: string;
};

export function useLandlordApplications() {
  const { profile, loading: profileLoading } = useProfile();
  const [applications, setApplications] = useState<LandlordApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    if (!profile?.id) {
      setApplications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('rental_application')
      .select(
        `id, status, created_at, rejected_reason, apartment_id, tenant_id,
        occupation, employer_name, monthly_income, employment_type,
        prev_landlord_name, prev_landlord_contact,
        move_in_date, no_occupants, has_pets, has_smoker, need_parking, message,
        gov_id_url, proof_of_income_url, proof_of_billing_url, nbi_clearance_url,
        apartments!inner(name, monthly_rent, city, street_address, barangay, province, zip_code),
        users!rental_application_tenant_id_fkey(first_name, last_name, avatar_url, street_address, barangay, city, province, postal_code, email, mobile_number)`,
      )
      // Filtering on embedded resource columns (apartments.landlord_id) is not
      // supported by PostgREST — rely on RLS to scope rows to the landlord's apartments.
      .order('created_at', { ascending: false });


    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const mapped: LandlordApplication[] = (data ?? []).map((item) => {
      const tenant = Array.isArray(item.users) ? item.users[0] : item.users;
      const apartment = Array.isArray(item.apartments) ? item.apartments[0] : item.apartments;

      const firstName = tenant?.first_name ?? '';
      const lastName = tenant?.last_name ?? '';
      const tenantName =
        [firstName, lastName].filter(Boolean).join(' ') || 'Unknown Tenant';

      return {
        id: item.id,
        status: STATUS_MAP[item.status as DbStatus] ?? 'Applied',
        created_at: item.created_at,
        rejected_reason: item.rejected_reason,
        apartment_id: item.apartment_id,
        tenant_id: item.tenant_id,
        occupation: item.occupation,
        employer_name: item.employer_name,
        monthly_income: item.monthly_income,
        employment_type: item.employment_type,
        prev_landlord_name: item.prev_landlord_name,
        prev_landlord_contact: item.prev_landlord_contact,
        move_in_date: item.move_in_date,
        no_occupants: item.no_occupants,
        has_pets: item.has_pets,
        has_smoker: item.has_smoker,
        need_parking: item.need_parking,
        message: item.message,
        gov_id_url: item.gov_id_url,
        proof_of_income_url: item.proof_of_income_url,
        proof_of_billing_url: item.proof_of_billing_url,
        nbi_clearance_url: item.nbi_clearance_url,
        tenant_name: tenantName,
        tenant_avatar_url: tenant?.avatar_url ?? null,
        tenant_address: formatAddress({
          street_address: tenant?.street_address ?? null,
          barangay:       tenant?.barangay ?? null,
          city:           tenant?.city ?? null,
          province:       tenant?.province ?? null,
          zip_code: tenant?.postal_code ?? null
        }),
        tenant_email: tenant?.email ?? null,
        tenant_mobile_number: tenant?.mobile_number ?? null,
        tenant_city: tenant?.city ?? '',
        apartment_name: apartment?.name ?? '',
        monthly_rent: Number(apartment?.monthly_rent ?? 0),
        apartment_city: apartment?.city ?? '',
        apartment_address: formatAddress({
          street_address: apartment?.street_address ?? null,
          barangay:       apartment?.barangay ?? null,
          city:           apartment?.city ?? null,
          province:       apartment?.province ?? null,
          zip_code:       apartment?.zip_code ?? null,
        }),
      };
    });

    setApplications(mapped);
    setLoading(false);

  }, [profile?.id]);

  useEffect(() => {
    if (profileLoading) return;
    fetchApplications();
  }, [profileLoading, fetchApplications]);

  return { applications, loading: loading || profileLoading, error, refetch: fetchApplications };
}
