import { supabase } from "@repo/supabase";
import { nextListingVisibilityStatus, type ListingVisibilityStatus } from "@repo/utils";
import { usePortalStore } from "@/stores/usePortalStore";

export interface ListingVisibilityRequest {
  apartmentId: string;
  ownerId: string;
  authUserId: string;
  currentStatus: ListingVisibilityStatus;
  isCurrent: () => boolean;
}

/** Caller-owned compare-and-set, matching web; RLS and maintenance guards decide. */
export async function changeListingVisibility(request: ListingVisibilityRequest): Promise<ListingVisibilityStatus> {
  const { apartmentId, ownerId, authUserId, currentStatus, isCurrent } = request;
  const status = nextListingVisibilityStatus(currentStatus);
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  const portal = usePortalStore.getState();
  if (sessionError || !isCurrent() || !authUserId || !ownerId || !apartmentId
    || portal.loading || portal.portal !== "landlord" || portal.authUserId !== authUserId
    || session.session?.user.id !== authUserId) {
    throw new Error("Your session has changed. Reopen this property in the landlord portal to continue.");
  }

  const { data, error } = await supabase.from("apartments")
    .update({ status })
    .eq("id", apartmentId)
    .eq("landlord_id", ownerId)
    .eq("status", currentStatus)
    .is("deleted_at", null)
    .select("status")
    .maybeSingle();
  if (error) throw error;
  if (!data || data.status !== status) {
    throw new Error("This property has changed or is no longer available. Refresh the page and try again.");
  }
  return status;
}
