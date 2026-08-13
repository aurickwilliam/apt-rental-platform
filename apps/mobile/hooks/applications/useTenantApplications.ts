import { useEffect, useState } from 'react';
import { supabase } from '@repo/supabase';
import { useProfile } from 'hooks/auth';

import type { ApplicationStatus } from '@/hooks/applications';
import { resolvePrivateMediaUrls } from '@/service/privateMediaResolver';

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

const APPLICATION_DOCUMENTS_BUCKET = 'application-documents';

export function useTenantApplications() {
  const { profile, loading: profileLoading } = useProfile();
  const profileId = profile?.id;
  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (profileLoading) {
      return () => {
        cancelled = true;
      };
    }

    if (!profileId) {
      setApplications([]);
      setError(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const tenantId = profileId;

    async function fetchApplications() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('rental_application')
          .select(
            `id, status, created_at, rejected_reason, apartment_id,
            occupation, employer_name, monthly_income, employment_type,
            prev_landlord_name, prev_landlord_contact,
            move_in_date, no_occupants, has_pets, has_smoker, need_parking, message,
            gov_id_url, proof_of_income_url, proof_of_billing_url, nbi_clearance_url,
            apartments(name, monthly_rent)`
          )
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        const rows = data ?? [];
        const documentDefinitions = rows.flatMap((item) => [
          { label: 'Government ID', path: item.gov_id_url },
          { label: 'Proof of Income', path: item.proof_of_income_url },
          { label: 'Proof of Billing', path: item.proof_of_billing_url },
          { label: 'NBI Clearance', path: item.nbi_clearance_url },
        ]);
        const documentPaths = documentDefinitions
          .map((document) => document.path)
          .filter((path): path is string => !!path);
        const { urls: signedUrls, error: resolutionError } = await resolvePrivateMediaUrls(
          APPLICATION_DOCUMENTS_BUCKET,
          documentPaths
        );

        if (cancelled) return;

        const applicationsWithDocuments = rows.map((item) => {
          const documentDefinitions = [
            { label: 'Government ID', path: item.gov_id_url },
            { label: 'Proof of Income', path: item.proof_of_income_url },
            { label: 'Proof of Billing', path: item.proof_of_billing_url },
            { label: 'NBI Clearance', path: item.nbi_clearance_url },
          ];
          const documents: ApplicationDocument[] = documentDefinitions
            .filter((document): document is { label: string; path: string } => !!document.path)
            .map((document) => ({
              label: document.label,
              path: document.path,
              signedUrl: signedUrls[document.path] ?? null,
            }));
          const {
            gov_id_url,
            proof_of_income_url,
            proof_of_billing_url,
            nbi_clearance_url,
            ...application
          } = item;

          return {
            ...application,
            status: item.status as ApplicationStatus,
            documents,
          };
        });

        setApplications(applicationsWithDocuments);
        setError(resolutionError);
      } catch (fetchError) {
        if (cancelled) return;
        console.error('Unable to load tenant applications:', fetchError);
        setApplications([]);
        setError('Unable to load applications.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchApplications();

    return () => {
      cancelled = true;
    };
  }, [profileId, profileLoading]);

  return { applications, loading: loading || profileLoading, error };
}
