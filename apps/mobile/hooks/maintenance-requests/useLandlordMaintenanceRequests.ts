import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "@repo/supabase";
import { useProfile } from "@/hooks/auth";
import { MaintenanceRequestStatus, MaintenanceRequestUrgency } from "./useMaintenanceRequests";

const DB_TO_DISPLAY_STATUS: Record<string, MaintenanceRequestStatus> = {
  pending: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

const DISPLAY_TO_DB_STATUS: Record<MaintenanceRequestStatus, string> = {
  Pending: "pending",
  "In Progress": "in_progress",
  Resolved: "resolved",
  Cancelled: "cancelled",
};

// Only the "advance" flow moves forward through these three.
// Resolved and Cancelled are terminal states.
const STATUS_FLOW: MaintenanceRequestStatus[] = [
  "Pending",
  "In Progress",
  "Resolved",
];

// Next status in the Pending -> In Progress -> Resolved flow
export function getNextStatus(
  current: MaintenanceRequestStatus
): MaintenanceRequestStatus {
  const index = STATUS_FLOW.indexOf(current);
  if (index === -1 || index === STATUS_FLOW.length - 1) return current;
  return STATUS_FLOW[index + 1];
}

const MAINTENANCE_IMAGES_BUCKET = "maintenance-images";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour
const SIGNED_URL_CACHE_TTL_MS = 55 * 60 * 1000; // refresh a bit before real expiry

// Module-level cache so photos aren't re-signed on every focus/refetch
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

async function resolveSignedUrls(paths: string[]): Promise<string[]> {
  if (paths.length === 0) return [];

  const now = Date.now();
  const uncachedPaths = paths.filter((path) => {
    const cached = signedUrlCache.get(path);
    return !cached || cached.expiresAt <= now;
  });

  if (uncachedPaths.length > 0) {
    const { data, error } = await supabase.storage
      .from(MAINTENANCE_IMAGES_BUCKET)
      .createSignedUrls(uncachedPaths, SIGNED_URL_TTL_SECONDS);

    if (!error && data) {
      data.forEach((entry) => {
        if (entry.signedUrl && entry.path) {
          signedUrlCache.set(entry.path, {
            url: entry.signedUrl,
            expiresAt: now + SIGNED_URL_CACHE_TTL_MS,
          });
        }
      });
    }
  }

  return paths
    .map((path) => signedUrlCache.get(path)?.url)
    .filter((url): url is string => Boolean(url));
}

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
  status: MaintenanceRequestStatus;
  urgency: MaintenanceRequestUrgency;
  photos: string[];
  resolution_notes?: string;
};

export function useLandlordMaintenanceRequests() {
  const { profile, loading: profileLoading } = useProfile();
  const [requests, setRequests] = useState<LandlordMaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (profileLoading) return;
    if (!profile?.id) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("maintenance_request")
      .select(
        `
        id,
        title,
        message,
        status,
        created_at,
        urgency,
        image_urls,
        resolution_notes,
        apartment:apartments!maintenance_request_apartment_id_fkey(name, street_address, barangay, city, province),
        tenant:users!maintenance_request_tenant_id_fkey(first_name, last_name, mobile_number, avatar_url)
      `
      )
      .eq("landlord_id", profile.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setRequests([]);
      setLoading(false);
      return;
    }

    const mapped: LandlordMaintenanceRequest[] = await Promise.all(
      (data ?? []).map(async (row: any) => {
        const photos = await resolveSignedUrls(row.image_urls ?? []);
        const addressParts = [
          row.apartment?.street_address,
          row.apartment?.barangay,
          row.apartment?.city,
          row.apartment?.province,
        ].filter(Boolean);

        return {
          id: row.id,
          issue_title: row.title,
          description: row.message,
          apartment_name: row.apartment?.name ?? "Unknown apartment",
          apartment_city: row.apartment?.city ?? "",
          apartment_address: addressParts.join(", "),
          tenant_name:
            [row.tenant?.first_name, row.tenant?.last_name]
              .filter(Boolean)
              .join(" ") || "Unknown tenant",
          tenant_avatar_url: row.tenant?.avatar_url ?? null,
          contact_number: row.tenant?.mobile_number ?? "-",
          reported_at: row.created_at,
          status: DB_TO_DISPLAY_STATUS[row.status] ?? "Pending",
          urgency: row.urgency,
          photos,
          resolution_notes: row.resolution_notes ?? null,
        };
      })
    );

    setRequests(mapped);
    setLoading(false);
  }, [profile?.id, profileLoading]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [fetchRequests])
  );

  const updateStatus = useCallback(
    async (
      id: string,
      nextStatus: MaintenanceRequestStatus,
      resolutionNotes?: string
    ) => {
      const previous = requests;

      // Optimistic update
      setRequests((current) =>
        current.map((request) =>
          request.id === id
            ? {
                ...request,
                status: nextStatus,
                resolution_notes:
                  nextStatus === "Resolved"
                    ? resolutionNotes ?? request.resolution_notes
                    : request.resolution_notes,
              }
            : request
        )
      );

      const updatePayload: Record<string, any> = {
        status: DISPLAY_TO_DB_STATUS[nextStatus],
      };
      if (nextStatus === "Resolved") {
        updatePayload.resolved_at = new Date().toISOString();
        updatePayload.resolution_notes = resolutionNotes?.trim() || null;
      }
      if (nextStatus === "Cancelled") {
        updatePayload.cancelled_at = new Date().toISOString();
      }

      const { error: updateError, data } = await supabase
        .from("maintenance_request")
        .update(updatePayload)
        .eq("id", id)
        .select("id");

      if (updateError || !data || data.length === 0) {
        // Revert on real errors AND on silent RLS blocks (zero rows affected)
        setRequests(previous);
        setError(updateError?.message ?? "Could not update request status.");
        return false;
      }

      return true;
    },
    [requests]
  );

  const resolveRequest = useCallback(
    async (id: string, resolutionNotes: string) => {
      return updateStatus(id, "Resolved", resolutionNotes);
    },
    [updateStatus]
  );

  const advanceStatus = useCallback(
    async (id: string) => {
      const request = requests.find((entry) => entry.id === id);
      if (!request) return false;

      const nextStatus = getNextStatus(request.status);
      if (nextStatus === request.status) return false;

      if (nextStatus === "Resolved") return false;

      return updateStatus(id, nextStatus);
    },
    [requests, updateStatus]
  );

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
    advanceStatus,
    resolveRequest,
    updateStatus,
    getNextStatus,
  };
}
