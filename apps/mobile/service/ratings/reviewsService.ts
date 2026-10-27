import { supabase } from "@repo/supabase";
import { isReviewStayEligible } from "@repo/utils";

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
  /** The landlord's apartment the reviewer rented, for the "Stayed at" line. */
  apartmentName?: string;
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
  apartment_id: string | null;
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

export type LandlordReviewSort = 'Most Recent' | 'Highest Rating' | 'Lowest Rating'

/** Review cards on the public landlord profile; the full list lives on its own screen. */
export const LANDLORD_REVIEW_PREVIEW_LIMIT = 3
/** Reviews loaded per page on the full landlord reviews screen. */
export const LANDLORD_REVIEWS_PAGE_SIZE = 20

export type LandlordReviewPageOptions = {
  offset: number
  limit: number
  sort?: LandlordReviewSort
}

type LandlordReviewContext = {
  apartmentIds: string[]
  apartmentNames: Map<string, string>
}

async function fetchLandlordReviewContext(
  landlordId: string
): Promise<LandlordReviewContext> {
  // reviews has no landlord_id column — resolve via the landlord's apartments.
  const { data, error } = await supabase
    .from("apartments")
    .select("id, name")
    .eq("landlord_id", landlordId)
    .eq("is_hidden_by_admin", false);
  if (error) throw error;

  const apartments = data ?? [];
  return {
    apartmentIds: apartments.map((apartment) => apartment.id),
    apartmentNames: new Map(
      apartments.map((apartment) => [apartment.id, apartment.name])
    ),
  };
}

function toLandlordReview(
  row: LandlordReviewRow,
  apartmentNames: ReadonlyMap<string, string>
): LandlordReview {
  const firstName = row.users?.first_name ?? "";
  const lastName = row.users?.last_name ?? "";

  return {
    id: row.id,
    name: `${firstName} ${lastName}`.trim() || "Anonymous Tenant",
    date: row.created_at,
    rating: Number(row.rating),
    review: row.comment ?? "",
    profilePictureUrl: row.users?.avatar_url ?? undefined,
    apartmentName:
      (row.apartment_id && apartmentNames.get(row.apartment_id)) || undefined,
    images: getReviewImageUrls(row.image_paths),
  };
}

export async function fetchLandlordReviewsPage(
  landlordId: string,
  { offset, limit, sort = 'Most Recent' }: LandlordReviewPageOptions
): Promise<LandlordReviewsResult> {
  const { apartmentIds, apartmentNames } =
    await fetchLandlordReviewContext(landlordId);
  if (apartmentIds.length === 0) return { reviews: [], totalCount: 0 };

  let reviewsQuery = supabase
    .from("reviews")
    .select(
      `
        id,
        rating,
        comment,
        created_at,
        image_paths,
        apartment_id,
        users!reviews_tenant_id_fkey (
          first_name,
          last_name,
          avatar_url
        )
      `
    )
    .in("apartment_id", apartmentIds);

  if (sort === 'Highest Rating') {
    reviewsQuery = reviewsQuery.order("rating", { ascending: false });
  } else if (sort === 'Lowest Rating') {
    reviewsQuery = reviewsQuery.order("rating", { ascending: true });
  }

  const [reviewsResult, countResult] = await Promise.all([
    reviewsQuery
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + limit - 1),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .in("apartment_id", apartmentIds),
  ]);

  if (reviewsResult.error) throw reviewsResult.error;
  if (countResult.error) throw countResult.error;

  const rows = (reviewsResult.data ?? []) as unknown as LandlordReviewRow[];

  return {
    reviews: rows.map((row) => toLandlordReview(row, apartmentNames)),
    totalCount: countResult.count ?? 0,
  };
}

export async function fetchLandlordReviews(
  landlordId: string
): Promise<LandlordReviewsResult> {
  return fetchLandlordReviewsPage(landlordId, {
    offset: 0,
    limit: LANDLORD_REVIEW_PREVIEW_LIMIT,
  });
}

export interface ReviewEligibility {
  reviewableTenancyId: string | null;
  stayLocked: boolean;
}

export async function fetchReviewEligibility(
  apartmentId: string,
  tenantId: string
): Promise<ReviewEligibility> {
  const { data, error } = await supabase
    .from("tenancies")
    .select("id, lease_start, lease_end, reviews(id)")
    .eq("apartment_id", apartmentId)
    .eq("tenant_id", tenantId)
    .order("lease_end", { ascending: false, nullsFirst: false });

  if (error) throw error;

  const unreviewed = (data ?? []).filter(
    (tenancy) => !tenancy.reviews || (Array.isArray(tenancy.reviews) && tenancy.reviews.length === 0)
  );
  const eligible = unreviewed.find(
    (tenancy) => isReviewStayEligible(tenancy.lease_start, tenancy.lease_end)
  );

  return {
    reviewableTenancyId: eligible?.id ?? null,
    stayLocked: !eligible && unreviewed.length > 0,
  };
}
