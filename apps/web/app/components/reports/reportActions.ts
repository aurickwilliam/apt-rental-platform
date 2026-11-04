import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApartmentReportReason, UserReportReason } from "@repo/utils";

/**
 * Reports filed from a listing or a profile page. Both are caller-bound RPCs:
 * the database resolves the reporter from the session and decides whether the
 * target can be reported, so no reporter ID is sent.
 */
export async function reportApartment(
  supabase: SupabaseClient,
  params: { apartmentId: string; reason: ApartmentReportReason; details: string },
): Promise<void> {
  const { error } = await supabase.rpc("report_apartment", {
    p_apartment_id: params.apartmentId,
    p_reason: params.reason,
    p_details: params.details.trim() || undefined,
  });
  if (error) throw error;
}

export async function reportProfile(
  supabase: SupabaseClient,
  params: { userId: string; role: "landlord" | "tenant"; reason: UserReportReason; details: string },
): Promise<void> {
  const { error } = await supabase.rpc("report_profile", {
    p_reported_user_id: params.userId,
    p_target_type: params.role,
    p_reason: params.reason,
    p_details: params.details.trim() || undefined,
  });
  if (error) throw error;
}
