import { useCallback, useState } from "react";
import { supabase } from "@repo/supabase";

export function useRespondToReschedule() {
  const [loading, setLoading] = useState(false);

  const accept = useCallback(async (visitRequestId: string) => {
    setLoading(true);
    const { error, data } = await supabase
      .from("visit_request")
      .update({
        status: "approved",
        tenant_responded_at: new Date().toISOString(),
      })
      .eq("id", visitRequestId)
      .select();
    setLoading(false);

    if (error) return { error };

    if (!data || data.length === 0) {
      console.log("accept matched 0 rows for visit_request:", visitRequestId);
      return {
        error: {
          message:
            "Couldn't update the visit request. It may have already been responded to.",
        },
      };
    }

    return { error: null };
  }, []);

  const decline = useCallback(async (visitRequestId: string) => {
    setLoading(true);
    const { error, data } = await supabase
      .from("visit_request")
      .update({
        status: "cancelled",
        tenant_responded_at: new Date().toISOString(),
      })
      .eq("id", visitRequestId)
      .select();
    setLoading(false);

    if (error) return { error };

    if (!data || data.length === 0) {
      console.log("decline matched 0 rows for visit_request:", visitRequestId);
      return {
        error: {
          message:
            "Couldn't update the visit request. It may have already been responded to.",
        },
      };
    }

    return { error: null };
  }, []);

  return { accept, decline, loading };
}
