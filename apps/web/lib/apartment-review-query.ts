const PUBLIC_REVIEW_SELECT = `
  id,
  rating,
  comment,
  created_at,
  image_paths,
  users!reviews_tenant_id_fkey (
    first_name,
    last_name,
    avatar_url
  )
`;

// Session presence chooses presentation only; database policies still authorize
// every read. Anonymous tenancy policies reference private users.user_id, so
// even an outer tenancy join makes the entire public review request fail.
export function apartmentReviewSelect(hasSession: boolean): string {
  return hasSession
    ? `${PUBLIC_REVIEW_SELECT}, tenancy:tenancy_id (lease_start, lease_end)`
    : PUBLIC_REVIEW_SELECT;
}
