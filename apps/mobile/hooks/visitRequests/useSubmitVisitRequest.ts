import { useState } from "react";
import { supabase } from "@repo/supabase";
import { useProfile } from "hooks/auth";

type VisitRequestPayload = {
  apartmentId: string;
  applicationId: string;
  landlordId: string;
  date: Date;
  hour: string;
  period: "AM" | "PM";
  noVisitors: number;
  notes: string;
};

export function useSubmitVisitRequest() {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitVisitRequest(payload: VisitRequestPayload) {
    if (!profile?.id) return { success: false };

    const {
      apartmentId,
      applicationId,
      landlordId,
      date,
      hour,
      period,
      noVisitors,
      notes,
    } = payload;

    // Convert to 24h time for DB (time without time zone column)
    const hourNum = parseInt(hour, 10);
    const hour24 =
      period === "AM"
        ? hourNum === 12 ? 0 : hourNum
        : hourNum === 12 ? 12 : hourNum + 12;
    const timeString = `${String(hour24).padStart(2, "0")}:00:00`;

    // Format date as YYYY-MM-DD
    const visitDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase
      .from("visit_request")
      .insert({
        tenant_id: profile.id,
        apartment_id: apartmentId,
        application_id: applicationId,
        landlord_id: landlordId,
        visit_date: visitDate,
        time: timeString,
        no_visitors: noVisitors,
        notes: notes || null,
      });

    setLoading(false);

    if (insertError) {
      if (insertError.code === "23505") {
        const message = "You already have an active visit request for this apartment.";
        setError(message);
        return { success: false };
      }
      setError(insertError.message);
      return { success: false };
    }

    return { success: true };
  }

  return { submitVisitRequest, loading, error };
}
