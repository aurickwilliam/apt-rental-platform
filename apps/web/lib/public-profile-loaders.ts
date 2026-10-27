import "server-only";

import { getVerifiedPassportSlots, type PassportSlotDocument } from "@repo/passport";
import { createClient } from "@repo/supabase/server";

import { apartmentReviewSelect } from "@/lib/apartment-review-query";
import {
  PROFILE_LISTING_LIMIT,
  LISTED_APARTMENT_STATUSES,
  PROFILE_REVIEW_LIMIT,
  coveredCities,
  formatStayRange,
  profileDisplayName,
  profileLocation,
  stayDurationMonths,
  toPastStay,
  summarizeListingVerification,
  summarizeReviewRatings,
  summarizeStayHistory,
  summarizeUnits,
  type PastStayRow,
} from "@/lib/public-profile";
import type {
  LandlordProfileData,
  PublicProfileIdentity,
  PublicProfileListing,
  PublicProfilePastStay,
  PublicProfileReview,
  TenantProfileData,
} from "@/app/components/profile/public/types";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

const FALLBACK_THUMBNAIL = "/images/house-check.png";
const REVIEW_IMAGES_BUCKET = "review-images";
// A landlord with more listings than this still gets a correct page: the grid is capped anyway.
const MAX_PROFILE_APARTMENTS = 200;
// Rating summary rows are bounded: the profile shows the 5 newest reviews and a
// distribution from at most this many ratings.
const MAX_PROFILE_REVIEW_RATINGS = 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Signed-out reads of public.users are column-scoped to these display fields.
const DISPLAY_COLUMNS = "id, first_name, last_name, avatar_url, background_url, account_status, roles, created_at";
const CONTACT_COLUMNS = "email, mobile_number, city, province";

interface UserRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  background_url: string | null;
  account_status: string | null;
  created_at: string | null;
  email?: string | null;
  mobile_number?: string | null;
  city?: string | null;
  province?: string | null;
}

interface ImageRow {
  url: string;
  url_thumb: string | null;
  is_cover: boolean | null;
}

interface ApartmentRow {
  id: string;
  name: string;
  monthly_rent: number;
  average_rating: number | null;
  barangay: string | null;
  city: string | null;
  status: string;
  is_verified: boolean | null;
  apartment_images: ImageRow[] | null;
}

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  image_paths: string[] | null;
  apartment_id: string | null;
  users: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null;
  /** Present only for signed-in readers; anonymous tenancy policies cannot be joined. */
  tenancy?: { lease_start: string | null; lease_end: string | null } | null;
}

function thumbnailOf(images: ImageRow[] | null): string {
  const list = images ?? [];
  const cover = list.find((image) => image.is_cover) ?? list[0];
  return cover?.url_thumb || cover?.url || FALLBACK_THUMBNAIL;
}

function toIdentity(row: UserRow, fallbackName: string): PublicProfileIdentity {
  return {
    id: row.id,
    displayName: profileDisplayName(row.first_name, row.last_name, fallbackName),
    avatarUrl: row.avatar_url?.trim() || null,
    backgroundUrl: row.background_url?.trim() || null,
    accountStatus: row.account_status,
    joinedAt: row.created_at,
    location: profileLocation(row.city, row.province),
  };
}

function toListing(row: ApartmentRow): PublicProfileListing {
  return {
    id: row.id,
    name: row.name,
    location: [row.barangay, row.city].filter(Boolean).join(", "),
    price: row.monthly_rent,
    rating: row.average_rating ?? 0,
    isVerified: Boolean(row.is_verified),
    thumbnailUrl: thumbnailOf(row.apartment_images),
  };
}

function toReview(
  supabase: ServerClient,
  row: ReviewRow,
  apartmentNames: ReadonlyMap<string, string>,
): PublicProfileReview {
  const images = (row.image_paths ?? []).map(
    (path) => supabase.storage.from(REVIEW_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl,
  );
  return {
    id: row.id,
    reviewerName: profileDisplayName(row.users?.first_name, row.users?.last_name, "Anonymous Tenant"),
    reviewerAvatar: row.users?.avatar_url ?? undefined,
    date: row.created_at,
    text: row.comment ?? "",
    rating: Number(row.rating),
    images: images.length > 0 ? images : undefined,
    apartmentName: row.apartment_id ? apartmentNames.get(row.apartment_id) ?? null : null,
    stayPeriod: row.tenancy
      ? formatStayRange(row.tenancy.lease_start, row.tenancy.lease_end)
      : undefined,
  };
}

/**
 * Landlord profile for any viewer. Signed-out visitors get the display fields and
 * listings only; contact details are read (and shown) for signed-in viewers.
 * Returns null when the id is not a landlord, so the route can 404.
 */
export async function loadLandlordProfile(landlordId: string): Promise<LandlordProfileData | null> {
  if (!UUID_PATTERN.test(landlordId)) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSignedIn = Boolean(user);

  const { data: landlordData } = await supabase
    .from("users")
    .select(isSignedIn ? `${DISPLAY_COLUMNS}, ${CONTACT_COLUMNS}` : DISPLAY_COLUMNS)
    .eq("id", landlordId)
    .filter("roles", "cs", "{landlord}")
    .maybeSingle();
  const landlord = landlordData as unknown as UserRow | null;
  if (!landlord) return null;

  const { data: apartmentData } = await supabase
    .from("apartments")
    .select(
      "id, name, monthly_rent, average_rating, barangay, city, status, is_verified, apartment_images(url, url_thumb, is_cover)",
    )
    .eq("landlord_id", landlordId)
    .eq("is_hidden_by_admin", false)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .order("is_cover", { referencedTable: "apartment_images", ascending: false, nullsFirst: false })
    .limit(1, { referencedTable: "apartment_images" })
    .limit(MAX_PROFILE_APARTMENTS);
  const apartments = (apartmentData ?? []) as unknown as ApartmentRow[];

  const apartmentIds = apartments.map((apartment) => apartment.id);
  const apartmentNames = new Map(apartments.map((apartment) => [apartment.id, apartment.name]));
  let reviews: PublicProfileReview[] = [];
  let ratingSummary = summarizeReviewRatings([]);
  if (apartmentIds.length > 0) {
    const [reviewResult, ratingResult] = await Promise.all([
      supabase
        .from("reviews")
        .select(`${apartmentReviewSelect(isSignedIn)}, apartment_id`)
        .in("apartment_id", apartmentIds)
        .order("created_at", { ascending: false })
        .limit(PROFILE_REVIEW_LIMIT),
      // Bounded: the headline mean and the 5→1 bars come from the same ratings,
      // so they can never disagree with each other.
      supabase
        .from("reviews")
        .select("rating")
        .in("apartment_id", apartmentIds)
        .limit(MAX_PROFILE_REVIEW_RATINGS),
    ]);
    reviews = ((reviewResult.data ?? []) as unknown as ReviewRow[]).map((row) =>
      toReview(supabase, row, apartmentNames),
    );
    ratingSummary = summarizeReviewRatings(
      ((ratingResult.data ?? []) as { rating: number }[]).map((row) => Number(row.rating)),
    );
  }

  const listedApartments = apartments.filter((apartment) =>
    LISTED_APARTMENT_STATUSES.includes(apartment.status),
  );
  const verification = summarizeListingVerification(
    listedApartments.map((apartment) => apartment.is_verified),
  );

  return {
    identity: toIdentity(landlord, "Landlord"),
    contact: isSignedIn
      ? { email: landlord.email ?? null, mobileNumber: landlord.mobile_number ?? null }
      : null,
    units: summarizeUnits(apartments.map((apartment) => apartment.status)),
    cities: coveredCities(apartments.map((apartment) => apartment.city)),
    averageRating: ratingSummary.average,
    reviewCount: ratingSummary.count,
    ratingDistribution: ratingSummary.distribution,
    verifiedListings: verification.verified,
    listedTotal: verification.total,
    listings: listedApartments.slice(0, PROFILE_LISTING_LIMIT).map(toListing),
    reviews,
  };
}

/**
 * Tenant profile for a landlord. A landlord may open it only for a tenant who has
 * applied to, or rented, one of their own apartments; anyone else gets null (404).
 * `viewerLandlordId` is the caller's internal users.id.
 */
export async function loadTenantProfile(
  supabase: ServerClient,
  viewerLandlordId: string,
  tenantId: string,
): Promise<TenantProfileData | null> {
  if (!UUID_PATTERN.test(tenantId)) return null;

  const [applicationLink, tenancyLink] = await Promise.all([
    supabase
      .from("rental_application")
      .select("id, apartments!rental_application_apartment_id_fkey!inner(landlord_id)")
      .eq("tenant_id", tenantId)
      .eq("apartments.landlord_id", viewerLandlordId)
      .limit(1),
    supabase
      .from("tenancies")
      .select("id, apartments!tenancies_apartment_id_fkey!inner(landlord_id)")
      .eq("tenant_id", tenantId)
      .eq("apartments.landlord_id", viewerLandlordId)
      .limit(1),
  ]);
  const hasRelationship = (applicationLink.data?.length ?? 0) > 0 || (tenancyLink.data?.length ?? 0) > 0;
  if (!hasRelationship) return null;

  const { data: tenantData } = await supabase
    .from("users")
    .select(`${DISPLAY_COLUMNS}, ${CONTACT_COLUMNS}`)
    .eq("id", tenantId)
    .filter("roles", "cs", "{tenant}")
    .maybeSingle();
  const tenant = tenantData as unknown as UserRow | null;
  if (!tenant) return null;

  const [reviewResult, stayResult, passportResult] = await Promise.all([
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase
      .from("tenancies")
      .select(
        "id, lease_start, lease_end, apartments!tenancies_apartment_id_fkey(id, name, barangay, city, is_hidden_by_admin, apartment_images(url, url_thumb, is_cover), landlord:users!apartments_landlord_id_fkey1(id, first_name, last_name))",
      )
      .eq("tenant_id", tenantId)
      .eq("status", "ended")
      .order("lease_end", { ascending: false })
      .limit(PROFILE_LISTING_LIMIT),
    // RLS lets a landlord read an applicant's passport rows only while that application
    // is open, so an empty result means "nothing visible", not "nothing verified".
    supabase
      .from("passport_documents")
      .select("doc_type, id_type, is_primary, is_verified, review_status, expires_at, created_at")
      .eq("user_id", tenantId),
  ]);

  const stayRows = (stayResult.data ?? []) as unknown as (PastStayRow & {
    apartments: { apartment_images: ImageRow[] | null } | null;
  })[];

  const pastStays = stayRows.map<PublicProfilePastStay>((row) => ({
    ...toPastStay(row),
    thumbnailUrl: thumbnailOf(row.apartments?.apartment_images ?? null),
  }));

  return {
    identity: toIdentity(tenant, "Tenant"),
    contact: { email: tenant.email ?? null, mobileNumber: tenant.mobile_number ?? null },
    reviewCount: reviewResult.count ?? 0,
    verifiedDocuments: getVerifiedPassportSlots((passportResult.data ?? []) as unknown as PassportSlotDocument[]),
    stayHistory: summarizeStayHistory(stayRows.map((row) => stayDurationMonths(row.lease_start, row.lease_end))),
    pastStays,
  };
}
