"use client";

import { createClient } from "@repo/supabase/browser";

import { getLandlordContext } from "@/service/landlordApplicationsService";

export type LandlordVisitStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "rescheduled";

export type LandlordVisitRequest = {
  id: string;
  visit_date: string;
  time: string;
  no_visitors: number;
  notes: string | null;
  status: LandlordVisitStatus;
  rejected_reason: string | null;
  responded_at: string | null;
  confirmed_visit_date: string | null;
  confirmed_time: string | null;
  created_at: string;
  resolved_visit_date: string;
  resolved_visit_time: string;
  tenant: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    mobile_number: string | null;
  };
  apartment: {
    name: string;
    barangay: string;
    street_address: string;
    city: string;
    province: string;
    zip_code: number | null;
    cover_url: string | null;
  };
};

export async function fetchLandlordVisitRequests(): Promise<LandlordVisitRequest[]> {
  const context = await getLandlordContext();
  if (!context.landlordId) return [];

  const supabase = createClient();

  const { data, error } = await supabase
    .from("visit_request")
    .select(
      `id, visit_date, time, no_visitors, notes, status, rejected_reason,
      responded_at, confirmed_visit_date, confirmed_time, created_at,
      tenant:users!visit_request_tenant_id_fkey(first_name, last_name, avatar_url, mobile_number),
      apartment:apartments!visit_request_apartment_id_fkey(name, barangay, street_address, city, province, zip_code, apartment_images(url, is_cover))`,
    )
    .eq("landlord_id", context.landlordId)
    .order("visit_date", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => {
    const rawTenant = row.tenant;
    const rawApartment = row.apartment;
    const tenant = (Array.isArray(rawTenant) ? rawTenant[0] : rawTenant) as {
      first_name: string;
      last_name: string;
      avatar_url: string | null;
      mobile_number: string | null;
    };
    const apartment = (Array.isArray(rawApartment) ? rawApartment[0] : rawApartment) as {
      name: string;
      barangay: string;
      street_address: string;
      city: string;
      province: string;
      zip_code: number | null;
      apartment_images: { url: string; is_cover: boolean | null }[] | null;
    };
    // apartment-images bucket is public — urls are permanent CDN URLs, no signing.
    const images = apartment?.apartment_images ?? [];
    const cover = images.find((img) => img.is_cover === true)?.url ?? null;

    return {
      id: row.id as string,
      visit_date: row.visit_date as string,
      time: row.time as string,
      no_visitors: row.no_visitors as number,
      notes: (row.notes as string | null) ?? null,
      status: row.status as LandlordVisitStatus,
      rejected_reason: (row.rejected_reason as string | null) ?? null,
      responded_at: (row.responded_at as string | null) ?? null,
      confirmed_visit_date: (row.confirmed_visit_date as string | null) ?? null,
      confirmed_time: (row.confirmed_time as string | null) ?? null,
      created_at: row.created_at as string,
      resolved_visit_date: (row.confirmed_visit_date as string | null) ?? (row.visit_date as string),
      resolved_visit_time: (row.confirmed_time as string | null) ?? (row.time as string),
      tenant,
      apartment: {
        name: apartment?.name ?? "",
        barangay: apartment?.barangay ?? "",
        street_address: apartment?.street_address ?? "",
        city: apartment?.city ?? "",
        province: apartment?.province ?? "",
        zip_code: apartment?.zip_code ?? null,
        cover_url: cover,
      },
    };
  });
}

export async function approveVisitRequest(requestId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("visit_request")
    .update({ status: "approved", responded_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) throw error;
}

export async function rejectVisitRequest(requestId: string, reason: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("visit_request")
    .update({
      status: "rejected",
      rejected_reason: reason,
      responded_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (error) throw error;
}

export async function rescheduleVisitRequest(
  requestId: string,
  confirmedDate: string,
  confirmedTime: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("visit_request")
    .update({
      status: "rescheduled",
      confirmed_visit_date: confirmedDate,
      confirmed_time: confirmedTime,
      responded_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (error) throw error;
}
