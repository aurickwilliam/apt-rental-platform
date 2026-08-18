import { supabase } from "@repo/supabase";

import { resolvePrivateMediaUrls } from "@/service/media/privateMediaResolver";

export type MaintenanceRequestStatus = "Pending" | "In Progress" | "Resolved" | "Cancelled";
export type MaintenanceRequestUrgency = "low" | "medium" | "high";

export type MaintenanceRequest = {
  id: string;
  title: string;
  category: string;
  message: string;
  urgency: MaintenanceRequestUrgency;
  status: MaintenanceRequestStatus;
  image_urls: string[];
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  tenant_id: string;
  apartment_id: string;
  landlord_id: string | null;
  cancelled_at: string | null;
};

const DB_TO_DISPLAY_STATUS: Record<string, MaintenanceRequestStatus> = {
  pending: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

export async function mapRow(row: Record<string, unknown>): Promise<MaintenanceRequest> {
  const paths: string[] = Array.isArray(row.image_urls) ? (row.image_urls as string[]) : [];
  const { urls } = await resolvePrivateMediaUrls("maintenance-images", paths);
  const resolvedUrls = paths
    .map((path) => urls[path])
    .filter((url): url is string => Boolean(url));

  return {
    ...(row as unknown as MaintenanceRequest),
    status: DB_TO_DISPLAY_STATUS[row.status as string] ?? "Pending",
    image_urls: resolvedUrls,
  };
}

export async function fetchLatestMaintenanceRequest(
  apartmentId: string
): Promise<MaintenanceRequest | null> {
  const { data, error } = await supabase
    .from("maintenance_request")
    .select("*")
    .eq("apartment_id", apartmentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function fetchMaintenanceRequestHistory(
  apartmentId: string
): Promise<MaintenanceRequest[]> {
  const { data, error } = await supabase
    .from("maintenance_request")
    .select("*")
    .eq("apartment_id", apartmentId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return Promise.all(
    (data ?? []).map((row) => mapRow(row as Record<string, unknown>))
  );
}

export async function cancelMaintenanceRequest(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("maintenance_request")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}