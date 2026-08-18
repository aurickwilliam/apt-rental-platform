import { supabase } from "@repo/supabase";

export type ApartmentReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  image_paths: string[] | null;
  users: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  tenancy: {
    lease_start: string;
    lease_end: string | null;
  } | null;
};

export type LandlordReview = {
  id: string;
  name: string;
  date: string;
  rating: number;
  review: string;
  profilePictureUrl?: string;
  images?: string[];
};

export type LandlordReviewsResult = {
  reviews: LandlordReview[];
  totalCount: number;
};

export async function fetchApartmentReviews(
  apartmentId: string
): Promise<ApartmentReviewRow[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id,
      rating,
      comment,
      created_at,
      image_paths,
      users!reviews_tenant_id_fkey (
        first_name,
        last_name,
        avatar_url
      ),
      tenancy:tenancy_id (
        lease_start,
        lease_end
      )
    `
    )
    .eq("apartment_id", apartmentId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as unknown as ApartmentReviewRow[];
}

type LandlordReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  image_paths: string[] | null;
  users: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
};

export function getReviewImageUrls(paths: string[] | null): string[] | undefined {
  if (!paths || paths.length === 0) return undefined;
  return paths.map(
    (path) => supabase.storage.from("review-images").getPublicUrl(path).data.publicUrl
  );
}

export async function fetchLandlordReviews(
  landlordId: string
): Promise<LandlordReviewsResult> {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
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
      `
    )
    .eq("landlord_id", landlordId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) throw error;

  const mapped: LandlordReview[] = ((data ?? []) as unknown as LandlordReviewRow[]).map(
    (row) => {
      const firstName = row.users?.first_name ?? "";
      const lastName = row.users?.last_name ?? "";
      const name = `${firstName} ${lastName}`.trim() || "Anonymous Tenant";

      return {
        id: row.id,
        name,
        date: row.created_at,
        rating: Number(row.rating),
        review: row.comment ?? "",
        profilePictureUrl: row.users?.avatar_url ?? undefined,
        images: getReviewImageUrls(row.image_paths),
      };
    }
  );

  const { count } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("landlord_id", landlordId);

  return { reviews: mapped, totalCount: count ?? 0 };
}

export async function fetchReviewEligibility(
  apartmentId: string,
  tenantId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("tenancies")
    .select("id, lease_end, reviews(id)")
    .eq("apartment_id", apartmentId)
    .eq("tenant_id", tenantId)
    .order("lease_end", { ascending: false, nullsFirst: false });

  if (error) throw error;

  const unreviewed = (data ?? []).find(
    (tenancy) => !tenancy.reviews || (Array.isArray(tenancy.reviews) && tenancy.reviews.length === 0)
  );

  return unreviewed?.id ?? null;
}