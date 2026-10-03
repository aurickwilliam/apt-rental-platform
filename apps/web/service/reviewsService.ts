"use client";

import { createClient } from "@repo/supabase/browser";

export const REVIEW_IMAGES_BUCKET = "review-images";
export const MAX_REVIEW_IMAGES = 5;

const REVIEW_IMAGE_MAX_LONG_EDGE = 1600;
const REVIEW_IMAGE_JPEG_QUALITY = 0.7;

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

export type ApartmentReview = {
  id: string;
  name: string;
  date: string;
  rating: number;
  review: string;
  profilePictureUrl?: string;
  stayPeriod?: string;
  images?: string[];
};

export type RatingBucket = {
  rating: number;
  ratingCount: number;
  totalCount: number;
};

export type TenancyLease = {
  id: string;
  apartment_id: string;
  tenant_id: string;
  lease_start: string;
  lease_end: string | null;
};

export type TenantApartmentReview = {
  id: string;
  tenancyId: string;
  tenantId: string;
  rating: number;
  comment: string;
  stayedDate: string | null;
  imagePaths: string[];
};

export type RateApartmentHeader = {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  street_address: string | null;
  barangay: string | null;
  city: string | null;
  average_rating: number | null;
  no_ratings: number | null;
  landlordName: string;
  coverImage: string | null;
};

const REVIEW_SELECT = `
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
`;

function randomSuffix(): string {
  return Math.random().toString(36).slice(2);
}

export function formatStayPeriod(
  leaseStart: string | null,
  leaseEnd: string | null,
): string | undefined {
  if (!leaseStart) return undefined;
  const fmt = (iso: string) =>
    new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  return `${fmt(leaseStart)} - ${leaseEnd ? fmt(leaseEnd) : "Present"}`;
}

export function getReviewImageUrls(paths: string[] | null): string[] | undefined {
  if (!paths || paths.length === 0) return undefined;
  const supabase = createClient();
  return paths.map(
    (path) => supabase.storage.from(REVIEW_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl,
  );
}

export function mapReviewRow(row: ApartmentReviewRow): ApartmentReview {
  const name =
    `${row.users?.first_name ?? ""} ${row.users?.last_name ?? ""}`.trim() || "Anonymous Tenant";
  return {
    id: row.id,
    name,
    date: row.created_at,
    rating: Number(row.rating),
    review: row.comment ?? "",
    profilePictureUrl: row.users?.avatar_url ?? undefined,
    stayPeriod: formatStayPeriod(row.tenancy?.lease_start ?? null, row.tenancy?.lease_end ?? null),
    images: getReviewImageUrls(row.image_paths),
  };
}

export async function fetchApartmentReviews(apartmentId: string): Promise<ApartmentReviewRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("apartment_id", apartmentId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as unknown as ApartmentReviewRow[];
}

export async function fetchReviewEligibility(
  apartmentId: string,
  tenantId: string,
): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tenancies")
    .select("id, lease_start, lease_end, reviews(id)")
    .eq("apartment_id", apartmentId)
    .eq("tenant_id", tenantId)
    .order("lease_end", { ascending: false, nullsFirst: false });

  if (error) throw error;

  // Stay rule (mirrors the enforce_review_stay_eligibility trigger): eligible
  // only after 3 months of stay or once the tenancy has ended.
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const cutoff = threeMonthsAgo.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const unreviewed = (data ?? []).find((tenancy) => {
    const hasReview = !!tenancy.reviews && !(Array.isArray(tenancy.reviews) && tenancy.reviews.length === 0);
    if (hasReview) return false;
    const leaseStart = (tenancy.lease_start as string | null) ?? null;
    const leaseEnd = (tenancy.lease_end as string | null) ?? null;
    if (!leaseStart) return false;
    const stayedLongEnough = leaseStart.slice(0, 10) <= cutoff;
    const ended = leaseEnd !== null && leaseEnd.slice(0, 10) <= today;
    return stayedLongEnough || ended;
  });

  return unreviewed?.id ?? null;
}

export async function fetchHasUnreviewedTenancy(
  apartmentId: string,
  tenantId: string,
): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tenancies")
    .select("id, reviews(id)")
    .eq("apartment_id", apartmentId)
    .eq("tenant_id", tenantId)
    .limit(10);

  if (error) throw error;

  return ((data ?? []) as unknown as { reviews: unknown }[]).some(
    (tenancy) => !tenancy.reviews || (Array.isArray(tenancy.reviews) && tenancy.reviews.length === 0),
  );
}

export async function fetchReviewTenancy(tenancyId: string): Promise<TenancyLease> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tenancies")
    .select("id, apartment_id, tenant_id, lease_start, lease_end")
    .eq("id", tenancyId)
    .single();

  if (error || !data) throw new Error("Unable to load stay duration.");

  return data as unknown as TenancyLease;
}

type HeaderRow = {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  street_address: string | null;
  barangay: string | null;
  city: string | null;
  average_rating: number | null;
  no_ratings: number | null;
  landlord: { first_name: string | null; last_name: string | null } | null;
  apartment_images: { url: string; is_cover: boolean | null }[] | null;
};

export async function fetchRateApartmentHeader(apartmentId: string): Promise<RateApartmentHeader> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("apartments")
    .select(
      `
        id,
        name,
        type,
        status,
        street_address,
        barangay,
        city,
        average_rating,
        no_ratings,
        landlord:landlord_id (first_name, last_name),
        apartment_images (url, is_cover)
      `,
    )
    .eq("id", apartmentId)
    .eq("is_hidden_by_admin", false)
    .is("deleted_at", null)
    .single();

  if (error || !data) throw new Error("We couldn't load this apartment's details.");

  const row = data as unknown as HeaderRow;
  const images = row.apartment_images ?? [];

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    street_address: row.street_address,
    barangay: row.barangay,
    city: row.city,
    average_rating: row.average_rating,
    no_ratings: row.no_ratings,
    landlordName:
      `${row.landlord?.first_name ?? ""} ${row.landlord?.last_name ?? ""}`.trim() ||
      "Unknown Landlord",
    coverImage:
      images.find((img) => img.is_cover)?.url ?? images[0]?.url ?? "/default/default-thumbnail.jpeg",
  };
}

export async function compressReviewImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, REVIEW_IMAGE_MAX_LONG_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Couldn't process that image. Please try another file.");

    ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", REVIEW_IMAGE_JPEG_QUALITY),
    );
    if (!blob) throw new Error("Couldn't process that image. Please try another file.");
    return blob;
  } finally {
    bitmap.close();
  }
}

export async function uploadReviewImages(
  tenantId: string,
  reviewId: string,
  images: File[],
): Promise<string[]> {
  const supabase = createClient();
  const paths: string[] = [];

  for (const image of images) {
    const blob = await compressReviewImage(image);
    const path = `${tenantId}/${reviewId}/${Date.now()}-${randomSuffix()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from(REVIEW_IMAGES_BUCKET)
      .upload(path, blob, { contentType: "image/jpeg" });

    if (uploadError) {
      // Roll back any images that DID upload before this one failed —
      // don't leave partial photo sets orphaned in storage.
      if (paths.length > 0) {
        await supabase.storage.from(REVIEW_IMAGES_BUCKET).remove(paths);
      }
      throw new Error(`Failed to upload photo: ${uploadError.message}`);
    }

    paths.push(path);
  }

  return paths;
}

export async function removeReviewImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase.storage.from(REVIEW_IMAGES_BUCKET).remove(paths);
  if (error) {
    console.warn("Cleanup failed for", paths, error.message);
  }
}

export type InsertReviewInput = {
  id: string;
  tenancyId: string;
  rating: number;
  comment: string;
  stayedDate: string;
  imagePaths: string[];
};

export async function insertReview(input: InsertReviewInput): Promise<string> {
  const supabase = createClient();

  // apartment_id and tenant_id are populated by the
  // sync_review_tenancy_fields BEFORE INSERT trigger from tenancy_id.
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      id: input.id,
      tenancy_id: input.tenancyId,
      rating: input.rating,
      comment: input.comment,
      stayed_date: input.stayedDate,
      image_paths: input.imagePaths,
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("You have already reviewed this stay.");
    }
    throw new Error(error?.message ?? "Failed to submit review.");
  }

  return (data as unknown as { id: string }).id;
}

type TenantReviewRow = {
  id: string;
  tenancy_id: string;
  tenant_id: string;
  rating: number;
  comment: string | null;
  stayed_date: string | null;
  image_paths: string[] | null;
};

function mapTenantReviewRow(row: TenantReviewRow): TenantApartmentReview {
  return {
    id: row.id,
    tenancyId: row.tenancy_id,
    tenantId: row.tenant_id,
    rating: Number(row.rating),
    comment: row.comment ?? "",
    stayedDate: row.stayed_date,
    imagePaths: row.image_paths ?? [],
  };
}

const TENANT_REVIEW_SELECT = "id, tenancy_id, tenant_id, rating, comment, stayed_date, image_paths";

export async function fetchTenantApartmentReview(
  apartmentId: string,
  tenantId: string,
): Promise<TenantApartmentReview | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(TENANT_REVIEW_SELECT)
    .eq("apartment_id", apartmentId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapTenantReviewRow(data as unknown as TenantReviewRow);
}

export async function fetchReviewById(reviewId: string): Promise<TenantApartmentReview> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(TENANT_REVIEW_SELECT)
    .eq("id", reviewId)
    .single();

  if (error || !data) throw new Error("We couldn't load this review.");

  return mapTenantReviewRow(data as unknown as TenantReviewRow);
}

export type UpdateReviewInput = {
  id: string;
  rating: number;
  comment: string;
  imagePaths: string[];
};

export async function updateReview(input: UpdateReviewInput): Promise<void> {
  const supabase = createClient();

  // Identity columns (tenant_id, apartment_id, tenancy_id) are never touched —
  // the RLS UPDATE policy and guard triggers stay satisfied.
  const { error } = await supabase
    .from("reviews")
    .update({
      rating: input.rating,
      comment: input.comment,
      image_paths: input.imagePaths,
    } as never)
    .eq("id", input.id);

  if (error) throw new Error(error.message ?? "Failed to save your changes.");
}
