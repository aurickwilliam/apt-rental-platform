import type { SupabaseClient } from "@supabase/supabase-js";
import { parseListingReviewState, type ListingReviewState } from "@repo/utils";

/** The landlord's view of their listing's admin visibility; the database decides who may ask. */
export async function fetchListingReviewState(
  supabase: SupabaseClient,
  apartmentId: string,
): Promise<ListingReviewState> {
  const { data, error } = await supabase.rpc("get_listing_review_state", { p_apartment_id: apartmentId });
  if (error) throw error;
  return parseListingReviewState(data);
}

export async function requestListingReview(
  supabase: SupabaseClient,
  apartmentId: string,
  note: string,
): Promise<void> {
  const { error } = await supabase.rpc("request_listing_review", {
    p_apartment_id: apartmentId,
    p_note: note.trim(),
  });
  if (error) throw error;
}
