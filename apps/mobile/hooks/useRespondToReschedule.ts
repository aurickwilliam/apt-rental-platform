import { useCallback, useState } from "react";
import { supabase } from "@repo/supabase";

export function useRespondToReschedule() {
  const [loading, setLoading] = useState(false);

  const accept = useCallback(async (visitRequestId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("visit_request")
      .update({ status: "approved", responded_at: new Date().toISOString() })
      .eq("id", visitRequestId);
    setLoading(false);
    return { error };
  }, []);

  const decline = useCallback(async (visitRequestId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("visit_request")
      .update({ status: "cancelled", responded_at: new Date().toISOString() })
      .eq("id", visitRequestId);
    setLoading(false);
    return { error };
  }, []);

  return { accept, decline, loading };
}