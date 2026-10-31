"use client";

import { createClient } from "@repo/supabase/browser";
import { prepareTenantReview, TENANT_REVIEW_SAVE_ERROR } from "@repo/utils";

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
export async function submitTenantReview(input: SubmitTenantReviewInput): Promise<SubmitTenantReviewResult> {
  const prepared = prepareTenantReview(input);
  if (!prepared.ok) return { success: false, error: prepared.error };

  const { error } = await createClient().rpc("submit_tenant_review", prepared.args);
  if (error) {
    console.error("Tenant review failed", error.code);
    return { success: false, error: error.message || TENANT_REVIEW_SAVE_ERROR };
  }
  return { success: true };
}
