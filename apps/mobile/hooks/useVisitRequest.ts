import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile"; // adjust if your profile hook differs
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

export function useVisitRequest(applicationId: string | undefined) {
  const { profile } = useProfile();
  const [visitRequest, setVisitRequest] = useState<VisitRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const profileId = profile?.id;

  useEffect(() => {
    if (!applicationId || !profileId) {
      setLoading(false);
      return;
    }

    const id = applicationId;

    async function fetch() {
      setLoading(true);
      const { data, error } = await supabase
        .from("visit_request")
        .select("id, visit_date, time, no_visitors, notes, status, rejected_reason, responded_at, confirmed_visit_date, confirmed_time, created_at")
        .eq("application_id", id)
        .eq("tenant_id", profileId!)
        .maybeSingle();

      if (!error) setVisitRequest(data as VisitRequest | null);
      setLoading(false);
    }

    fetch();
  }, [applicationId, profileId]);

  return { visitRequest, loading };
}