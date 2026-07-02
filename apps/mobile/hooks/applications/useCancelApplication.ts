import { useState } from "react";
import { supabase } from "@repo/supabase";

export function useCancelApplication() {
  const [loading, setLoading] = useState(false);

  const cancelApplication = async (applicationId: string, visitRequestId?: string) => {
    setLoading(true);

    // Cancel the application
    const { error: appError } = await supabase
      .from("rental_application")
      .update({ status: "cancelled" })
      .eq("id", applicationId);

    if (appError) {
      setLoading(false);
      return { error: appError };
    }

    // If there's a pending/approved visit request, cancel it too
    if (visitRequestId) {
      await supabase
        .from("visit_request")
        .update({ status: "cancelled" })
        .eq("id", visitRequestId)
        .in("status", ["pending", "approved", "rescheduled"]);
      // Non-fatal — don't block on this error
    }

    setLoading(false);
    return { error: null };
  };

  return { cancelApplication, loading };
}