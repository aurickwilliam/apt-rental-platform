import { useState } from "react";
import { supabase } from "@repo/supabase";

type ActionStatus = "idle" | "loading" | "success" | "error";

export function useVisitRequestActions(requestId: string, onSuccess?: () => void) {
  const [approveStatus, setApproveStatus] = useState<ActionStatus>("idle");
  const [rejectStatus, setRejectStatus] = useState<ActionStatus>("idle");
  const [rescheduleStatus, setRescheduleStatus] = useState<ActionStatus>("idle");

  const approve = async () => {
    setApproveStatus("loading");
    const { error } = await supabase
      .from("visit_request")
      .update({
        status: "approved",
        responded_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      setApproveStatus("error");
      return false;
    }
    setApproveStatus("success");
    onSuccess?.();
    return true;
  };

  const reject = async (reason: string) => {
    setRejectStatus("loading");
    const { error } = await supabase
      .from("visit_request")
      .update({
        status: "rejected",
        rejected_reason: reason,
        responded_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      setRejectStatus("error");
      return false;
    }
    setRejectStatus("success");
    onSuccess?.();
    return true;
  };

  const reschedule = async (confirmedDate: string, confirmedTime: string) => {
    setRescheduleStatus("loading");
    const { error } = await supabase
      .from("visit_request")
      .update({
        status: "rescheduled",
        confirmed_visit_date: confirmedDate,
        confirmed_time: confirmedTime,
        responded_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      setRescheduleStatus("error");
      return false;
    }
    setRescheduleStatus("success");
    onSuccess?.();
    return true;
  };

  return {
    approve,
    reject,
    reschedule,
    isApproving: approveStatus === "loading",
    isRejecting: rejectStatus === "loading",
    isRescheduling: rescheduleStatus === "loading",
  };
}
