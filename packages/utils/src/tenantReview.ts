/** Landlord-to-tenant review rules shared by web and mobile; submit_tenant_review() is the authority (only an ended tenancy can be rated). */
export const TENANT_REVIEW_MAX_COMMENT_LENGTH = 1000;
export const TENANT_REVIEW_MIN_RATING = 1;
export const TENANT_REVIEW_MAX_RATING = 5;

export interface TenantReviewErrors {
  rating?: string;
  comment?: string;
}

export function validateTenantReview(rating: number, comment: string): TenantReviewErrors {
  const errors: TenantReviewErrors = {};
  if (
    !Number.isInteger(rating)
    || rating < TENANT_REVIEW_MIN_RATING
    || rating > TENANT_REVIEW_MAX_RATING
  ) {
    errors.rating = 'Choose a rating from 1 to 5.';
  }
  if (comment.trim().length > TENANT_REVIEW_MAX_COMMENT_LENGTH) {
    errors.comment = `Keep your comment under ${TENANT_REVIEW_MAX_COMMENT_LENGTH.toLocaleString('en-US')} characters.`;
  }
  return errors;
}

export function hasTenantReviewErrors(errors: TenantReviewErrors): boolean {
  return Boolean(errors.rating || errors.comment);
}

export interface TenantReviewSummary {
  average: number;
  count: number;
}

/** Mean of the individual ratings, one decimal, never an average of averages. */
export function summarizeTenantReviews(ratings: readonly number[]): TenantReviewSummary {
  const valid = ratings.filter((rating) => Number.isFinite(rating));
  if (valid.length === 0) return { average: 0, count: 0 };
  const total = valid.reduce((sum, rating) => sum + rating, 0);
  return { average: Math.round((total / valid.length) * 10) / 10, count: valid.length };
}

export const TENANT_REVIEW_SAVE_ERROR = 'Could not save your rating. Please try again.';

export interface TenantReviewSubmission {
  tenancyId: string;
  rating: number;
  comment: string;
}

export interface SubmitTenantReviewArgs {
  p_tenancy_id: string;
  p_rating: number;
  p_comment?: string;
}

export type PreparedTenantReview =
  | { ok: true; args: SubmitTenantReviewArgs }
  | { ok: false; error: string };

/** Validates a rating and builds the `submit_tenant_review` arguments, so both apps send the same call. */
export function prepareTenantReview({ tenancyId, rating, comment }: TenantReviewSubmission): PreparedTenantReview {
  const errors = validateTenantReview(rating, comment);
  if (hasTenantReviewErrors(errors)) {
    return { ok: false, error: errors.rating ?? errors.comment ?? 'Check your rating and try again.' };
  }
  const trimmed = comment.trim();
  return {
    ok: true,
    args: { p_tenancy_id: tenancyId, p_rating: rating, ...(trimmed ? { p_comment: trimmed } : {}) },
  };
}

/** One row of `get_tenant_reviews()`. */
export interface TenantReviewRow {
  id: string;
  tenancy_id: string;
  landlord_id: string;
  rating: number | string;
  comment: string | null;
  created_at: string;
  updated_at: string | null;
  landlord_first_name: string | null;
  landlord_last_name: string | null;
  landlord_avatar_url: string | null;
  apartment_name: string | null;
  lease_start: string | null;
  lease_end: string | null;
  is_mine: boolean;
}

export interface TenantReviewRecord {
  id: string;
  tenancyId: string;
  landlordId: string;
  rating: number;
  comment: string;
  createdAt: string;
  landlordName: string;
  landlordAvatarUrl: string | null;
  apartmentName: string | null;
  leaseStart: string | null;
  leaseEnd: string | null;
  /** True when the signed-in landlord wrote this rating. */
  isMine: boolean;
}

/** Maps `get_tenant_reviews()` rows to the shape both apps render. */
export function toTenantReviewRecords(rows: readonly TenantReviewRow[]): TenantReviewRecord[] {
  return rows.map((row) => ({
    id: row.id,
    tenancyId: row.tenancy_id,
    landlordId: row.landlord_id,
    rating: Number(row.rating),
    comment: row.comment ?? '',
    createdAt: row.created_at,
    landlordName: `${row.landlord_first_name ?? ''} ${row.landlord_last_name ?? ''}`.trim() || 'Landlord',
    landlordAvatarUrl: row.landlord_avatar_url,
    apartmentName: row.apartment_name,
    leaseStart: row.lease_start,
    leaseEnd: row.lease_end,
    isMine: row.is_mine,
  }));
}
