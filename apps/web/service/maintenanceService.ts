"use client";

import { createClient } from "@repo/supabase/browser";

export const MAINTENANCE_IMAGES_BUCKET = "maintenance-images";

export const MAINTENANCE_IMAGE_SIGNED_URL_TTL_SECONDS = 60 * 60;

export const MAINTENANCE_HISTORY_LIMIT = 100;

export type MaintenanceUrgency = "low" | "medium" | "high";

export type MaintenanceStatusDb =
  | "pending"
  | "in_progress"
  | "resolved"
  | "cancelled";

export type MaintenanceStatusDisplay =
  | "Pending"
  | "In Progress"
  | "Resolved"
  | "Cancelled";

export type MaintenanceRequest = {
  id: string;
  title: string;
  category: string;
  message: string;
  urgency: MaintenanceUrgency;
  status: MaintenanceStatusDisplay;
  image_paths: string[];
  image_urls: string[];
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  cancelled_at: string | null;
  apartment_id: string;
  tenant_id: string;
  landlord_id: string | null;
};

const DB_TO_DISPLAY_STATUS: Record<string, MaintenanceStatusDisplay> = {
  pending: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

const SELECT_FIELDS =
  "id, title, category, message, urgency, status, image_urls, created_at, resolved_at, resolution_notes, cancelled_at, apartment_id, tenant_id, landlord_id";

type MaintenanceRow = {
  id: string;
  title: string;
  category: string;
  message: string;
  urgency: string;
  status: string;
  image_urls: string[] | null;
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  cancelled_at: string | null;
  apartment_id: string;
  tenant_id: string;
  landlord_id: string | null;
};

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "image.jpg";
}

export async function uploadMaintenanceImages(
  files: File[],
  tenantId: string,
): Promise<string[]> {
  if (files.length === 0) return [];
  const supabase = createClient();
  const paths: string[] = [];

  for (const file of files) {
    const path = `${tenantId}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error } = await supabase.storage
      .from(MAINTENANCE_IMAGES_BUCKET)
      .upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
    if (error) throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    paths.push(path);
  }

  return paths;
}

export async function removeMaintenanceImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(MAINTENANCE_IMAGES_BUCKET)
    .remove(paths);
  if (error) {
    console.warn("Cleanup failed for", paths, error.message);
  }
}

export async function resolveMaintenanceImageUrls(
  paths: readonly string[],
): Promise<{ urls: Record<string, string | null>; error: string | null }> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return { urls: {}, error: null };

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(MAINTENANCE_IMAGES_BUCKET)
    .createSignedUrls(unique, MAINTENANCE_IMAGE_SIGNED_URL_TTL_SECONDS);

  if (error) {
    return {
      urls: Object.fromEntries(unique.map((path) => [path, null])),
      error: "Unable to access maintenance photos.",
    };
  }

  const signedByPath = new Map(
    (data ?? [])
      .filter((entry) => entry.path && entry.signedUrl && !entry.error)
      .map((entry) => [entry.path, entry.signedUrl] as const),
  );

  let hasMissing = false;
  const urls: Record<string, string | null> = {};
  for (const path of unique) {
    const signedUrl = signedByPath.get(path);
    if (!signedUrl) {
      urls[path] = null;
      hasMissing = true;
    } else {
      urls[path] = signedUrl;
    }
  }

  return {
    urls,
    error: hasMissing ? "Some maintenance photos could not be accessed." : null,
  };
}

async function mapRow(row: MaintenanceRow): Promise<MaintenanceRequest> {
  const paths = Array.isArray(row.image_urls) ? row.image_urls : [];
  const { urls } = await resolveMaintenanceImageUrls(paths);
  const signedUrls = paths
    .map((path) => urls[path])
    .filter((url): url is string => Boolean(url));

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    message: row.message,
    urgency: (row.urgency as MaintenanceUrgency) ?? "medium",
    status: DB_TO_DISPLAY_STATUS[row.status] ?? "Pending",
    image_paths: paths,
    image_urls: signedUrls,
    created_at: row.created_at,
    resolved_at: row.resolved_at,
    resolution_notes: row.resolution_notes,
    cancelled_at: row.cancelled_at,
    apartment_id: row.apartment_id,
    tenant_id: row.tenant_id,
    landlord_id: row.landlord_id,
  };
}

export async function fetchMaintenanceRequestHistory(
  apartmentId: string,
  tenantId: string,
): Promise<MaintenanceRequest[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("maintenance_request")
    .select(SELECT_FIELDS)
    .eq("apartment_id", apartmentId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(MAINTENANCE_HISTORY_LIMIT);

  if (error) throw error;

  const rows = (data ?? []) as unknown as MaintenanceRow[];
  return Promise.all(rows.map((row) => mapRow(row)));
}

export async function fetchLatestMaintenanceRequest(
  apartmentId: string,
  tenantId: string,
): Promise<MaintenanceRequest | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("maintenance_request")
    .select(SELECT_FIELDS)
    .eq("apartment_id", apartmentId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapRow(data as unknown as MaintenanceRow);
}

export type InsertMaintenanceRequestPayload = {
  tenant_id: string;
  apartment_id: string;
  landlord_id: string | null;
  title: string;
  category: string;
  urgency: MaintenanceUrgency;
  message: string;
  image_paths: string[];
};

export async function insertMaintenanceRequest(
  payload: InsertMaintenanceRequestPayload,
): Promise<{ id: string }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("maintenance_request")
    .insert({
      tenant_id: payload.tenant_id,
      apartment_id: payload.apartment_id,
      landlord_id: payload.landlord_id,
      title: payload.title,
      category: payload.category,
      urgency: payload.urgency,
      message: payload.message,
      image_urls: payload.image_paths,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) throw error;

  return { id: (data as { id: string }).id };
}

export async function cancelMaintenanceRequest(
  requestId: string,
  tenantId: string,
): Promise<void> {
  const supabase = createClient();

  const { error, data } = await supabase
    .from("maintenance_request")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("tenant_id", tenantId)
    .in("status", ["pending", "in_progress"])
    .select("id");

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(
      "Couldn't cancel this request. It may have already been resolved or cancelled.",
    );
  }
}
