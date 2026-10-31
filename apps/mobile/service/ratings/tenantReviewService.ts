import { supabase } from "@repo/supabase";
import {
  hasTenantReviewErrors,
  summarizeTenantReviews,
  validateTenantReview,
} from "@repo/utils";

export type TenantReview = {
  id: string;
  tenancyId: string;
  landlordId: string;
  rating: number;
  comment: string;
  createdAt: string;
  landlordName: string;
  landlordAvatarUrl?: string;
  apartmentName?: string;
  leaseStart: string | null;
  leaseEnd: string | null;
};

export type TenantReviewsResult = {
  reviews: TenantReview[];
  average: number;
  count: number;
};

type TenantReviewRow = {
  id: string;
  tenancy_id: string;
  landlord_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  landlord: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  tenancy: {
    lease_start: string | null;
    lease_end: string | null;
    apartments: { name: string | null } | null;
  } | null;
};

/** One rating per tenancy, so this is bounded by the tenant's stays. */
const MAX_TENANT_REVIEWS = 50;

/** RLS decides who can read these: the author, the tenant and landlords linked to the tenant. */
export async function fetchTenantReviews(tenantId: string): Promise<TenantReviewsResult> {
  const { data, error } = await supabase
    .from("tenant_reviews")
    .select(
      `
      id,
      tenancy_id,
      landlord_id,
      rating,
      comment,
      created_at,
      landlord:users!tenant_reviews_landlord_id_fkey (first_name, last_name, avatar_url),
      tenancy:tenancies!tenant_reviews_tenancy_id_fkey (
        lease_start,
        lease_end,
        apartments!tenancies_apartment_id_fkey (name)
      )
    `
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(MAX_TENANT_REVIEWS);

  if (error) throw error;

  const rows = (data ?? []) as unknown as TenantReviewRow[];
  const reviews = rows.map<TenantReview>((row) => ({
    id: row.id,
    tenancyId: row.tenancy_id,
    landlordId: row.landlord_id,
    rating: Number(row.rating),
    comment: row.comment ?? "",
    createdAt: row.created_at,
    landlordName:
      `${row.landlord?.first_name ?? ""} ${row.landlord?.last_name ?? ""}`.trim() || "Landlord",
    landlordAvatarUrl: row.landlord?.avatar_url ?? undefined,
    apartmentName: row.tenancy?.apartments?.name ?? undefined,
    leaseStart: row.tenancy?.lease_start ?? null,
    leaseEnd: row.tenancy?.lease_end ?? null,
  }));

  return { reviews, ...summarizeTenantReviews(reviews.map((review) => review.rating)) };
}

export type SubmitTenantReviewInput = {
  tenancyId: string;
  rating: number;
  comment: string;
};

/**
 * Rates the tenant of an ended tenancy through submit_tenant_review(), the only
 * write path. Calling it again for the same tenancy edits the review. Database
 * messages are user-facing, so they are surfaced as-is.
 */
export async function submitTenantReview({
  tenancyId,
  rating,
  comment,
}: SubmitTenantReviewInput): Promise<void> {
  const errors = validateTenantReview(rating, comment);
  if (hasTenantReviewErrors(errors)) {
    throw new Error(errors.rating ?? errors.comment ?? "Check your rating and try again.");
  }

  const { error } = await supabase.rpc("submit_tenant_review", {
    p_tenancy_id: tenancyId,
    p_rating: rating,
    p_comment: comment.trim() || undefined,
  });

  if (error) {
    console.error("Tenant review failed", error.code);
    throw new Error(error.message || "Could not save your rating. Please try again.");
  }
}
