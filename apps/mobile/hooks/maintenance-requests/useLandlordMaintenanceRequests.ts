import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "@repo/supabase";
import { useProfile } from "@/hooks/auth";

import type { MaintenanceRequestStatus } from "./useMaintenanceRequests";

const DB_TO_DISPLAY_STATUS: Record<string, MaintenanceRequestStatus> = {
  pending: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

export type LandlordMaintenanceRequest = {
  id: string;
  issue_title: string;
  apartment_name: string;
  tenant_name: string;
  reported_at: string;
  status: MaintenanceRequestStatus;
};

export function useLandlordMaintenanceRequests() {
  const { profile, loading: profileLoading } = useProfile();
  const [requests, setRequests] = useState<LandlordMaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    // Profile hasn't resolved yet, keep loading state
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
        status,
        created_at,
        apartment:apartments!maintenance_request_apartment_id_fkey(name),
        tenant:users!maintenance_request_tenant_id_fkey(first_name, last_name)
      `
      )
      .eq("landlord_id", profile.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setRequests([]);
    } else {
      const mapped: LandlordMaintenanceRequest[] = (data ?? []).map((row: any) => ({
        id: row.id,
        issue_title: row.title,
        apartment_name: row.apartment?.name ?? "Unknown apartment",
        tenant_name:
          [row.tenant?.first_name, row.tenant?.last_name].filter(Boolean).join(" ") ||
          "Unknown tenant",
        reported_at: row.created_at,
        status: DB_TO_DISPLAY_STATUS[row.status] ?? "Pending",
      }));
      setRequests(mapped);
    }

    setLoading(false);
  }, [profile?.id, profileLoading]);

  // Re-run the moment the profile actually resolves
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [fetchRequests])
  );

  return { requests, loading, error, refetch: fetchRequests };
}
