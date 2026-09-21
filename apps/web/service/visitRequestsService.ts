"use client";

import { createClient } from "@repo/supabase/browser";

export type VisitRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "rescheduled";

export type VisitRequest = {
  id: string;
  visit_date: string;
  time: string;
  no_visitors: number;
  notes: string | null;
  status: VisitRequestStatus;
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
  tenantId: string,
): Promise<VisitRequestResult> {
  const supabase = createClient();

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

export type SubmitVisitRequestPayload = {
  apartmentId: string;
  applicationId: string;
  landlordId: string;
  tenantId: string;
  visitDate: string;
  visitHour: string;
  period: "AM" | "PM";
  noVisitors: number;
  notes: string;
};

export async function insertVisitRequest(
  payload: SubmitVisitRequestPayload,
): Promise<void> {
  const supabase = createClient();

  const hourNum = parseInt(payload.visitHour, 10);
  const hour24 =
    payload.period === "AM"
      ? hourNum === 12
        ? 0
        : hourNum
      : hourNum === 12
        ? 12
        : hourNum + 12;
  const timeString = `${String(hour24).padStart(2, "0")}:00:00`;

  const { error } = await supabase.from("visit_request").insert({
    tenant_id: payload.tenantId,
    apartment_id: payload.apartmentId,
    application_id: payload.applicationId,
    landlord_id: payload.landlordId,
    visit_date: payload.visitDate,
    time: timeString,
    no_visitors: payload.noVisitors,
    notes: payload.notes || null,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("You already have an active visit request for this apartment.");
    }
    throw error;
  }
}

export async function respondToVisitRequest(
  visitRequestId: string,
  response: "approved" | "cancelled",
): Promise<void> {
  const supabase = createClient();

  const { error, data } = await supabase
    .from("visit_request")
    .update({
      status: response,
      tenant_responded_at: new Date().toISOString(),
    })
    .eq("id", visitRequestId)
    .select("id");

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(
      "Couldn't update the visit request. It may have already been responded to.",
    );
  }
}
