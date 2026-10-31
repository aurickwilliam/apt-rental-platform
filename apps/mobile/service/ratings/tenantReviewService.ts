import { supabase } from "@repo/supabase";
import {
  prepareTenantReview,
  summarizeTenantReviews,
  TENANT_REVIEW_SAVE_ERROR,
  toTenantReviewRecords,
  type TenantReviewRecord,
  type TenantReviewSubmission,
} from "@repo/utils";

export type TenantReview = TenantReviewRecord;

export type TenantReviewsResult = {
  reviews: TenantReview[];
  average: number;
  count: number;
};

/**
 * `get_tenant_reviews()` applies who may read (the tenant, the author, linked
 * landlords, admins) and adds the author and stay context, which other
 * landlords cannot read from the tenancy itself. It returns at most 50 rows.
 */
export async function fetchTenantReviews(tenantId: string): Promise<TenantReviewsResult> {
  const { data, error } = await supabase.rpc("get_tenant_reviews", { p_tenant_id: tenantId });
  if (error) throw error;

  const reviews = toTenantReviewRecords(data ?? []);
  return { reviews, ...summarizeTenantReviews(reviews.map((review) => review.rating)) };
}

/**
 * Rates the tenant of an ended tenancy through submit_tenant_review(), the only
 * write path. Calling it again for the same tenancy edits the review. Database
 * messages are user-facing, so they are surfaced as-is.
 */
export async function submitTenantReview(input: TenantReviewSubmission): Promise<void> {
  const prepared = prepareTenantReview(input);
  if (!prepared.ok) throw new Error(prepared.error);

  const { error } = await supabase.rpc("submit_tenant_review", prepared.args);
  if (error) {
    console.error("Tenant review failed", error.code);
    throw new Error(error.message || TENANT_REVIEW_SAVE_ERROR);
  }
}
