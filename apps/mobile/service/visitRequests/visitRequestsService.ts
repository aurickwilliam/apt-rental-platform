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
  tenant_responded_at: string | null;
};

const SELECT_FIELDS =
  "id, visit_date, time, no_visitors, notes, status, rejected_reason, responded_at, confirmed_visit_date, confirmed_time, created_at, tenant_responded_at";

export type VisitRequestResult = {
  current: VisitRequest | null;
  history: VisitRequest[];
};

export async function fetchVisitRequest(
  applicationId: string,
  tenantId: string
): Promise<VisitRequestResult> {
  const { data, error } = await supabase
    .from("visit_request")
    .select(SELECT_FIELDS)
    .eq("application_id", applicationId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as VisitRequest[];
  const [current, ...history] = rows;

  return { current: current ?? null, history };
}