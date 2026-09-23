"use client";

import { createClient } from "@repo/supabase/browser";
import { formatAddress } from "@repo/utils";

import { resolveMaintenanceImageUrls } from "@/service/maintenanceService";

export type LandlordMaintenanceStatus =
  | "Pending"
  | "In Progress"
  | "Resolved"
  | "Cancelled";

export type LandlordMaintenanceUrgency = "low" | "medium" | "high";

export type LandlordMaintenanceRequest = {
  id: string;
  issue_title: string;
  description: string;
  apartment_name: string;
  apartment_city: string;
  apartment_address: string;
  tenant_name: string;
  tenant_avatar_url: string | null;
  contact_number: string;
  reported_at: string;
  status: LandlordMaintenanceStatus;
  urgency: LandlordMaintenanceUrgency;
  photos: string[];
  resolution_notes: string | null;
};

const DB_TO_DISPLAY_STATUS: Record<string, LandlordMaintenanceStatus> = {
  pending: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

const DISPLAY_TO_DB_STATUS: Record<
  Exclude<LandlordMaintenanceStatus, "Pending" | "Cancelled">,
  string
> = {
  "In Progress": "in_progress",
  Resolved: "resolved",
};

// Only the "advance" flow moves forward through these two.
// Resolved and Cancelled are terminal states.
const STATUS_FLOW: LandlordMaintenanceStatus[] = ["Pending", "In Progress", "Resolved"];

export function getNextStatus(current: LandlordMaintenanceStatus): LandlordMaintenanceStatus {
  const index = STATUS_FLOW.indexOf(current);
  if (index === -1 || index === STATUS_FLOW.length - 1) return current;
  return STATUS_FLOW[index + 1];
}

type LandlordMaintenanceRow = {
  id: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
  urgency: LandlordMaintenanceUrgency;
  image_urls: string[] | null;
  resolution_notes: string | null;
  apartment: {
    name: string | null;
    street_address: string | null;
    barangay: string | null;
    city: string | null;
    province: string | null;
  } | null;
  tenant: {
    first_name: string | null;
    last_name: string | null;
    mobile_number: string | null;
    avatar_url: string | null;
  } | null;
};

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export async function fetchLandlordMaintenanceRequests(
  landlordId: string,
): Promise<LandlordMaintenanceRequest[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("maintenance_request")
    .select(
      `id, title, message, status, created_at, urgency, image_urls, resolution_notes,
      apartment:apartments!maintenance_request_apartment_id_fkey(name, street_address, barangay, city, province),
      tenant:users!maintenance_request_tenant_id_fkey(first_name, last_name, mobile_number, avatar_url)`,
    )
    .eq("landlord_id", landlordId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  const rows = (data ?? []) as unknown as LandlordMaintenanceRow[];
  const imagePaths = rows.flatMap((row) => row.image_urls ?? []);
  const { urls: mediaUrls } = await resolveMaintenanceImageUrls(imagePaths);

  return rows.map((row) => {
    const apartment = Array.isArray(row.apartment) ? row.apartment[0] : row.apartment;
    const tenant = Array.isArray(row.tenant) ? row.tenant[0] : row.tenant;
    const photos = (row.image_urls ?? [])
      .map((path) => mediaUrls[path])
      .filter((url): url is string => Boolean(url));

    return {
      id: row.id,
      issue_title: row.title,
      description: row.message,
      apartment_name: apartment?.name ?? "Unknown apartment",
      apartment_city: apartment?.city ?? "",
      apartment_address: formatAddress({
        street_address: asNullableString(apartment?.street_address),
        barangay: asNullableString(apartment?.barangay),
        city: asNullableString(apartment?.city),
        province: asNullableString(apartment?.province),
        zip_code: null,
      }),
      tenant_name:
        [tenant?.first_name, tenant?.last_name].filter(Boolean).join(" ") || "Unknown tenant",
      tenant_avatar_url: tenant?.avatar_url ?? null,
      contact_number: tenant?.mobile_number ?? "—",
      reported_at: row.created_at,
      status: DB_TO_DISPLAY_STATUS[row.status] ?? "Pending",
      urgency: row.urgency,
      photos,
      resolution_notes: row.resolution_notes ?? null,
    };
  });
}

export async function updateLandlordMaintenanceStatus(
  requestId: string,
  landlordId: string,
  nextStatus: "In Progress" | "Resolved",
  resolutionNotes?: string,
): Promise<{ success: boolean; error?: string }> {
  if (nextStatus === "Resolved" && !resolutionNotes?.trim()) {
    return { success: false, error: "Resolution notes are required." };
  }

  const updatePayload: {
    status: string;
    resolved_at?: string;
    resolution_notes?: string | null;
  } =
    nextStatus === "Resolved"
      ? {
          status: DISPLAY_TO_DB_STATUS.Resolved,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes!.trim(),
        }
      : { status: DISPLAY_TO_DB_STATUS["In Progress"] };

  const supabase = createClient();
  const { error, data } = await supabase
    .from("maintenance_request")
    .update(updatePayload)
    .eq("id", requestId)
    .eq("landlord_id", landlordId)
    .select("id");

  if (error || !data || data.length === 0) {
    return { success: false, error: error?.message ?? "Could not update request status." };
  }

  return { success: true };
}
