"use client";

import { createClient } from "@repo/supabase/browser";

export type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "closed";

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
  documents: ApplicationDocument[];
  apartments: {
    name: string;
    monthly_rent: number;
    street_address: string | null;
    barangay: string | null;
    city: string | null;
    province: string | null;
    zip_code: number | null;
    apartment_images: { url: string; is_cover: boolean | null }[] | null;
  } | null;
};

const APPLICATION_SELECT = `id, status, created_at, rejected_reason, apartment_id,
  occupation, employer_name, monthly_income, employment_type,
  prev_landlord_name, prev_landlord_contact,
  move_in_date, no_occupants, has_pets, has_smoker, need_parking, message,
  gov_id_url, proof_of_income_url, proof_of_billing_url, nbi_clearance_url,
  apartments(name, monthly_rent, street_address, barangay, city, province, zip_code, apartment_images(url, is_cover))`;

type ApplicationDocumentPathKey =
  | "gov_id_url"
  | "proof_of_income_url"
  | "proof_of_billing_url"
  | "nbi_clearance_url";

const DOCUMENT_DEFINITIONS: { label: string; pathKey: ApplicationDocumentPathKey }[] = [
  { label: "Government ID", pathKey: "gov_id_url" },
  { label: "Proof of Income", pathKey: "proof_of_income_url" },
  { label: "Proof of Billing", pathKey: "proof_of_billing_url" },
  { label: "NBI Clearance", pathKey: "nbi_clearance_url" },
];

export async function fetchTenantApplications(tenantId: string): Promise<TenantApplication[]> {
  const supabase = createClient();

  const { data: rows, error } = await supabase
    .from("rental_application")
    .select(APPLICATION_SELECT)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const { resolveApplicationDocumentUrls } = await import(
    "@/service/applicationDocumentsService"
  );

  const typed = (rows ?? []) as unknown as (Omit<
    TenantApplication,
    "documents" | "apartments"
  > &
    Record<ApplicationDocumentPathKey, string | null> & {
      apartments: TenantApplication["apartments"];
    })[];

  const paths = typed
    .flatMap((item) => DOCUMENT_DEFINITIONS.map((d) => item[d.pathKey]))
    .filter((path): path is string => !!path);

  const { urls } = await resolveApplicationDocumentUrls(paths);

  return typed.map((item) => {
    const documents: ApplicationDocument[] = DOCUMENT_DEFINITIONS.flatMap(
      (definition) => {
        const path = item[definition.pathKey];
        if (!path) return [];
        return [{ label: definition.label, path, signedUrl: urls[path] ?? null }];
      },
    );

    return {
      id: item.id,
      status: item.status as ApplicationStatus,
      created_at: item.created_at,
      rejected_reason: item.rejected_reason,
      apartment_id: item.apartment_id,
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
      apartments: item.apartments,
      documents,
    };
  });
}

export type InsertTenantApplicationPayload = {
  tenant_id: string;
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
  gov_id_url: string;
  proof_of_income_url: string | null;
  proof_of_billing_url: string;
  nbi_clearance_url: string | null;
};

export async function insertTenantApplication(
  payload: InsertTenantApplicationPayload,
): Promise<{ id: string }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("rental_application")
    .insert({ ...payload, status: "pending" })
    .select("id")
    .single();

  if (error) {
    if (error.message.includes("unique_active_application_per_tenant_apartment")) {
      throw new Error("You already have an active application for this apartment.");
    }
    throw error;
  }

  return { id: data.id };
}

export async function cancelTenantApplication(
  applicationId: string,
  visitRequestId?: string,
): Promise<void> {
  const supabase = createClient();

  const { error: appError } = await supabase
    .from("rental_application")
    .update({ status: "cancelled" })
    .eq("id", applicationId);

  if (appError) throw appError;

  if (visitRequestId) {
    await supabase
      .from("visit_request")
      .update({ status: "cancelled" })
      .eq("id", visitRequestId)
      .in("status", ["pending", "approved", "rescheduled"]);
  }
}
