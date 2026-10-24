import { supabase } from "@repo/supabase";
import { isReviewStayEligible } from "@repo/utils";
import { readReviewUnlockDismissals } from "./reviewUnlockStorage";

export const REVIEW_UNLOCK_LIMIT = 10;

export interface ReviewUnlockCandidate {
  tenancyId: string;
  apartmentId: string;
  apartmentName: string;
}

interface ApartmentEmbed {
  id: string;
  name: string | null;
  is_hidden_by_admin: boolean | null;
  deleted_at: string | null;
}

export interface ReviewUnlockStay {
  id: string;
  apartment_id: string;
  lease_start: string | null;
  lease_end: string | null;
  apartment: ApartmentEmbed | ApartmentEmbed[] | null;
  reviews: { id: string }[] | null;
}

export function selectReviewUnlockCandidate(
  stays: readonly ReviewUnlockStay[],
  dismissed: ReadonlySet<string>,
  now: Date = new Date(),
): ReviewUnlockCandidate | null {
  for (const stay of stays) {
    const apartment = Array.isArray(stay.apartment) ? stay.apartment[0] : stay.apartment;
    if (!apartment || apartment.is_hidden_by_admin || apartment.deleted_at || dismissed.has(stay.id)) continue;
    if (stay.reviews?.length || !isReviewStayEligible(stay.lease_start, stay.lease_end, now)) continue;
    return { tenancyId: stay.id, apartmentId: stay.apartment_id, apartmentName: apartment.name?.trim() || "your apartment" };
  }
  return null;
}

export async function fetchReviewUnlock(authUserId: string, tenantId: string, signal?: AbortSignal): Promise<ReviewUnlockCandidate | null> {
  const request = supabase.from("tenancies")
    .select("id, apartment_id, lease_start, lease_end, apartment:apartments(id, name, is_hidden_by_admin, deleted_at), reviews(id)")
    .eq("tenant_id", tenantId)
    .order("lease_start", { ascending: false })
    .order("id", { ascending: false })
    .limit(REVIEW_UNLOCK_LIMIT);
  const { data, error } = await (signal ? request.abortSignal(signal) : request);
  if (error) throw error;
  const stays = (data ?? []) as unknown as ReviewUnlockStay[];
  const dismissed = await readReviewUnlockDismissals(authUserId, stays.map(stay => stay.id));
  return selectReviewUnlockCandidate(stays, dismissed);
}
