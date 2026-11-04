import { supabase } from "@repo/supabase";
import type { ApartmentReportReason, UserReportReason } from "@repo/utils";

/**
 * Reports filed from a listing or a landlord/tenant profile. Both are
 * caller-bound RPCs: the database resolves the reporter from the session and
 * decides whether the target can be reported (mirrors web's `reportActions`).
 */
export type ReportTarget =
  | { kind: "apartment"; apartmentId: string }
  | { kind: "profile"; userId: string; role: "landlord" | "tenant" };

export async function submitReport(params: {
  target: ReportTarget;
  reason: string;
  details: string;
}): Promise<void> {
  const details = params.details.trim() || undefined;
  const { target } = params;

  const { error } =
    target.kind === "apartment"
      ? await supabase.rpc("report_apartment", {
          p_apartment_id: target.apartmentId,
          p_reason: params.reason as ApartmentReportReason,
          p_details: details,
        })
      : await supabase.rpc("report_profile", {
          p_reported_user_id: target.userId,
          p_target_type: target.role,
          p_reason: params.reason as UserReportReason,
          p_details: details,
        });
  if (error) throw error;
}
