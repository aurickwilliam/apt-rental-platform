import { useEffect, useState, useCallback } from "react";
import { useProfile } from "hooks/auth";
import { supabase } from "@repo/supabase";

export type VisitRequest = {
  id: string;
  visit_date: string;
  time: string;
  no_visitors: number;
  notes: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled" | "rescheduled";
  rejected_reason: string | null;
  responded_at: string | null;
  confirmed_visit_date: string | null;
  confirmed_time: string | null;
  created_at: string;
};

const SELECT_FIELDS =
  "id, visit_date, time, no_visitors, notes, status, rejected_reason, responded_at, confirmed_visit_date, confirmed_time, created_at";

export function useVisitRequest(applicationId: string | undefined) {
  const { profile } = useProfile();
  const [visitRequest, setVisitRequest] = useState<VisitRequest | null>(null);
  const [history, setHistory] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const profileId = profile?.id;

  const fetchVisitRequest = useCallback(async () => {
    if (!applicationId || !profileId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Get all the rows
    // Get the latest row as the current visit request, and the rest as history
    const { data, error } = await supabase
      .from("visit_request")
      .select(SELECT_FIELDS)
      .eq("application_id", applicationId)
      .eq("tenant_id", profileId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const [current, ...rest] = data as VisitRequest[];
      setVisitRequest(current ?? null);
      setHistory(rest);
    }
    setLoading(false);
  }, [applicationId, profileId]);

  // useEffect(() => {
  //   fetchVisitRequest();
  // }, [fetchVisitRequest]);

  return { visitRequest, history, loading, refetch: fetchVisitRequest };
}
