"use client";

import { createClient } from "@repo/supabase/browser";
import { hasTenantReviewErrors, validateTenantReview } from "@repo/utils";

export interface SubmitTenantReviewInput {
  tenancyId: string;
  rating: number;
  comment: string;
}

export type SubmitTenantReviewResult = { success: true } | { success: false; error: string };

/**
 * Rates the tenant of an ended tenancy through submit_tenant_review(), the only
 * write path. Calling it again for the same tenancy edits the review. The
 * database messages are user-facing, so they are surfaced as-is.
 */
export async function submitTenantReview({
  tenancyId,
  rating,
  comment,
}: SubmitTenantReviewInput): Promise<SubmitTenantReviewResult> {
  const errors = validateTenantReview(rating, comment);
  if (hasTenantReviewErrors(errors)) {
    return { success: false, error: errors.rating ?? errors.comment ?? "Check your rating and try again." };
  }

  const { error } = await createClient().rpc("submit_tenant_review", {
    p_tenancy_id: tenancyId,
    p_rating: rating,
    p_comment: comment.trim() || undefined,
  });

  if (error) {
    console.error("Tenant review failed", error.code);
    return { success: false, error: error.message || "Could not save your rating. Please try again." };
  }
  return { success: true };
}
