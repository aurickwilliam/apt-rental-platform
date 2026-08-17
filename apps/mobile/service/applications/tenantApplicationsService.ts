import { supabase } from '@repo/supabase';

import type { ApplicationStatus } from '@/hooks/applications';
import { resolvePrivateMediaUrls } from '@/service/media/privateMediaResolver';

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

type ApplicationDocumentPathKey =
  | 'gov_id_url'
  | 'proof_of_income_url'
  | 'proof_of_billing_url'
  | 'nbi_clearance_url';

const DOCUMENT_DEFINITIONS: { label: string; pathKey: ApplicationDocumentPathKey }[] = [
  { label: 'Government ID', pathKey: 'gov_id_url' },
  { label: 'Proof of Income', pathKey: 'proof_of_income_url' },
  { label: 'Proof of Billing', pathKey: 'proof_of_billing_url' },
  { label: 'NBI Clearance', pathKey: 'nbi_clearance_url' },
];

type ApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  rejected_reason: string | null;
  apartment_id: string;
  occupation: string;
  employer_name: string;
  monthly_income: number;
  employment_type: string;
  prev_landlord_name: string | null;
  prev_landlord_contact: string | null;
  move_in_date: string;
  no_occupants: number;
  has_pets: boolean;
  has_smoker: boolean;
  need_parking: boolean;
  message: string | null;
  gov_id_url: string | null;
  proof_of_income_url: string | null;
  proof_of_billing_url: string | null;
  nbi_clearance_url: string | null;
  apartments: {
    name: string;
    monthly_rent: number;
  };
};

async function fetchTenantApplications(tenantId: string): Promise<TenantApplication[]> {
  const { data: rows, error: fetchError } = await supabase
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

  if (fetchError) throw new Error(fetchError.message);

  const rowsTyped = (rows ?? []) as ApplicationRow[];

  const documentPaths = rowsTyped
    .flatMap((item) => DOCUMENT_DEFINITIONS.map((d) => item[d.pathKey]))
    .filter((path): path is string => !!path);

  const { urls: signedUrls, error: resolutionError } = await resolvePrivateMediaUrls(
    APPLICATION_DOCUMENTS_BUCKET,
    documentPaths
  );

  const applications = rowsTyped.map((item) => {
    const documents: ApplicationDocument[] = DOCUMENT_DEFINITIONS.flatMap((definition) => {
      const path = item[definition.pathKey];
      if (!path) return [];
      return [{ label: definition.label, path, signedUrl: signedUrls[path] ?? null }];
    });
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

  if (resolutionError) {
    // Surface as a non-fatal marker alongside the data; consumers fall back to
    // the stored path when no signed URL is available.
    console.error('Unable to resolve some application documents:', resolutionError);
  }

  return applications;
}

export { fetchTenantApplications };