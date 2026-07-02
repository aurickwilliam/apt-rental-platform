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
      .eq("id", visitRequestId);
    console.log("accept result:", { error, data });
    setLoading(false);
    return { error };
  }, []);

  const decline = useCallback(async (visitRequestId: string) => {
    setLoading(true);
    const { error, data } = await supabase
      .from("visit_request")
      .update({
        status: "cancelled",
        tenant_responded_at: new Date().toISOString(),
      })
      .eq("id", visitRequestId);
    console.log("decline result:", { error, data });
    setLoading(false);
    return { error };
  }, []);

  return { accept, decline, loading };
}
