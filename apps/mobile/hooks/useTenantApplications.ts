import { useEffect, useState } from 'react';
import { supabase } from '@repo/supabase';
import { useProfile } from './useProfile';

import type { ApplicationStatus } from '@/hooks/useApplicationStatusStyles';

export type ApplicationDocument = {
  label: string;
  path: string;
  signedUrl: string | null;
};

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
  // uploaded documents, resolved to viewable signed URLs
  documents: ApplicationDocument[];
  apartments: {
    name: string;
    monthly_rent: number;
  };
};

const DOCUMENTS_BUCKET = 'application-documents';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour is plenty for a viewing session

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
          gov_id_url, proof_of_income_url, proof_of_billing_url, nbi_clearance_url,
          apartments(name, monthly_rent)`
        )
        .eq('tenant_id', profile!.id)
        .order('created_at', { ascending: false });

      const rows = data ?? [];

      const withDocuments = await Promise.all(
        rows.map(async (item) => {
          const docDefs: { label: string; path: string | null }[] = [
            { label: 'Government ID', path: item.gov_id_url },
            { label: 'Proof of Income', path: item.proof_of_income_url },
            { label: 'Proof of Billing', path: item.proof_of_billing_url },
            { label: 'NBI Clearance', path: item.nbi_clearance_url },
          ];

          const present = docDefs.filter(
            (d): d is { label: string; path: string } => !!d.path
          );

          let signedByPath: Record<string, string> = {};

          if (present.length > 0) {
            const { data: signedData } = await supabase.storage
              .from(DOCUMENTS_BUCKET)
              .createSignedUrls(
                present.map((d) => d.path),
                SIGNED_URL_TTL_SECONDS
              );

            (signedData ?? []).forEach((entry) => {
              if (entry.path && entry.signedUrl && !entry.error) {
                signedByPath[entry.path] = entry.signedUrl;
              }
            });
          }

          const documents: ApplicationDocument[] = present.map((d) => ({
            label: d.label,
            path: d.path,
            signedUrl: signedByPath[d.path] ?? null,
          }));

          const {
            gov_id_url,
            proof_of_income_url,
            proof_of_billing_url,
            nbi_clearance_url,
            ...rest
          } = item;

          return {
            ...rest,
            status: item.status as ApplicationStatus,
            documents,
          };
        })
      );

      setApplications(withDocuments);
      setLoading(false);
    }

    fetch();
  }, [profile, profileLoading]);

  return { applications, loading: loading || profileLoading };
}
