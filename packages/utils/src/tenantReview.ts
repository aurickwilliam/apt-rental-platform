/** Landlord-to-tenant review rules shared by web and mobile; submit_tenant_review() is the authority. */
export const TENANT_REVIEW_MAX_COMMENT_LENGTH = 1000;
export const TENANT_REVIEW_MIN_RATING = 1;
export const TENANT_REVIEW_MAX_RATING = 5;

export interface TenantReviewableTenancy {
  status: string | null;
  lease_end: string | null;
}

export interface TenantReviewErrors {
  rating?: string;
  comment?: string;
}

/** A tenant can be rated once the tenancy has ended or its lease end date has passed. */
export function isTenantReviewable(
  tenancy: TenantReviewableTenancy,
  now: Date = new Date(),
): boolean {
  if (tenancy.status === 'ended') return true;
  const end = tenancy.lease_end?.slice(0, 10);
  if (!end || !Number.isFinite(now.getTime())) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(end) || !Number.isFinite(Date.parse(end))) return false;
  return end <= now.toISOString().slice(0, 10);
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
