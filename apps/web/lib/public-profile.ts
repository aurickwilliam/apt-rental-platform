/**
 * Shared, framework-free rules for the public landlord / tenant profile pages
 * (mobile parity: `app/profile/landlord/[landlordId]`, `app/profile/tenant/[tenantId]`).
 */

import type { TenantReviewRecord } from "@repo/utils";

import type { PublicProfilePastStay, PublicProfileReview } from "@/app/components/profile/public/types";

export type ProfileViewerPortal = "public" | "tenant" | "landlord";

/** Most listings one profile read returns; the page shows eight until expanded. */
export const PROFILE_LISTING_LIMIT = 24;
/** Newest reviews rendered on the profile; the rest live on the reviews page. */
export const PROFILE_REVIEW_LIMIT = 5;
/** Reviews per page on a landlord's dedicated reviews page. */
export const PROFILE_REVIEWS_PAGE_SIZE = 20;

export type ProfileReviewSort = "recent" | "highest" | "lowest";

export const PROFILE_REVIEW_SORT_LABELS: Record<ProfileReviewSort, string> = {
  recent: "Most Recent",
  highest: "Highest Rating",
  lowest: "Lowest Rating",
};

/** URL value → supported sort, defaulting to newest first. */
export function parseProfileReviewSort(value: string | null | undefined): ProfileReviewSort {
  return value === "highest" || value === "lowest" ? value : "recent";
}

/** Total pages for a review count; always at least one so "Page 1 of 1" renders. */
export function profileReviewPageCount(totalCount: number): number {
  return Math.max(1, Math.ceil(Math.max(0, totalCount) / PROFILE_REVIEWS_PAGE_SIZE));
}

/** Keeps a requested page inside the real range (page 0, NaN and page 99 included). */
export function clampProfileReviewPage(page: number, totalCount: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.min(Math.max(1, Math.trunc(page)), profileReviewPageCount(totalCount));
}

const PORTAL_ROUTE_PREFIX: Record<ProfileViewerPortal, string> = {
  public: "/browse",
  tenant: "/tenant",
  landlord: "/landlord",
};

/**
 * Where a landlord's profile lives for a viewer: public browse, the tenant portal or the landlord portal.
 * `apartmentId` is the listing the visitor came from; the profile's Message button then continues that
 * apartment's conversation instead of starting a general inquiry (mobile's `apartmentId` route param).
 */
export function landlordProfileHref(portal: ProfileViewerPortal, landlordId: string, apartmentId?: string | null): string {
  const base = `${PORTAL_ROUTE_PREFIX[portal]}/landlords/${encodeURIComponent(landlordId)}`;
  return apartmentId ? `${base}?apartmentId=${encodeURIComponent(apartmentId)}` : base;
}

const PROFILE_APARTMENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The `?apartmentId=` of a profile URL, or null when it is missing, repeated or not a UUID. */
export function parseProfileApartmentId(value: string | string[] | undefined): string | null {
  return typeof value === "string" && PROFILE_APARTMENT_ID_PATTERN.test(value) ? value : null;
}

/** The landlord's full reviews page inside the same portal shell. */
export function landlordReviewsHref(
  portal: ProfileViewerPortal,
  landlordId: string,
  { page = 1, sort = "recent" }: { page?: number; sort?: ProfileReviewSort } = {},
): string {
  const base = `${landlordProfileHref(portal, landlordId)}/reviews`;
  const params = new URLSearchParams();
  if (sort !== "recent") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

/** A tenant profile is only viewable from the landlord portal. */
export function tenantProfileHref(tenantId: string): string {
  return `${PORTAL_ROUTE_PREFIX.landlord}/tenants/${encodeURIComponent(tenantId)}`;
}

/** The apartment detail route that matches the portal the viewer is browsing in. */
export function apartmentHref(portal: ProfileViewerPortal, apartmentId: string): string {
  const base = `${PORTAL_ROUTE_PREFIX[portal]}${portal === "public" ? "" : "/browse"}`;
  return `${base}/${encodeURIComponent(apartmentId)}`;
}

export function profileDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback: string,
): string {
  return `${firstName ?? ""} ${lastName ?? ""}`.trim() || fallback;
}

export function profileLocation(
  city: string | null | undefined,
  province: string | null | undefined,
): string | null {
  return [city, province].map((part) => part?.trim()).filter(Boolean).join(", ") || null;
}

/** "2024" style member-since label from a created-at timestamp, in Manila time. */
export function memberSinceYear(createdAt: string | null | undefined): string | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-PH", { year: "numeric", timeZone: "Asia/Manila" }).format(date);
}

/** Review ratings per 1–5 bucket, used by the profile rating breakdown. */
export interface ReviewRatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface ReviewRatingSummary {
  /** Mean of the ratings that were counted; null when there are none. */
  average: number | null;
  count: number;
  distribution: ReviewRatingDistribution;
}

/**
 * Mean and 1–5 distribution of a landlord's review ratings. Ratings outside
 * 1–5 and missing values are ignored, so unrated rows never pull the mean down.
 * The profile shows the review mean (not an average of listing averages) so the
 * headline figure always matches the review cards underneath it.
 */
export function summarizeReviewRatings(
  ratings: ReadonlyArray<number | null | undefined>,
): ReviewRatingSummary {
  const distribution: ReviewRatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let count = 0;

  for (const value of ratings) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 1 || value > 5) continue;
    const bucket = Math.round(value) as 1 | 2 | 3 | 4 | 5;
    distribution[bucket] += 1;
    total += value;
    count += 1;
  }

  return {
    average: count === 0 ? null : Math.round((total / count) * 10) / 10,
    count,
    distribution,
  };
}

export interface ListingVerificationSummary {
  verified: number;
  total: number;
}

/** How many of a landlord's listed apartments passed APT verification. */
export function summarizeListingVerification(
  flags: ReadonlyArray<boolean | null | undefined>,
): ListingVerificationSummary {
  return {
    verified: flags.filter((flag) => flag === true).length,
    total: flags.length,
  };
}

const STAY_MONTH_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "Asia/Manila",
});

/** "Jan 2024 - Mar 2025" for a finished stay; "Present" while it has no end date. */
export function formatStayRange(leaseStart: string | null, leaseEnd: string | null): string {
  const format = (iso: string) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : STAY_MONTH_FORMAT.format(date);
  };
  const start = leaseStart ? format(leaseStart) : null;
  if (!start) return "Dates not available";
  const end = leaseEnd ? format(leaseEnd) : null;
  return `${start} - ${end ?? "Present"}`;
}

/** A tenancy row as the tenant profile reads it, with its apartment and that apartment's landlord. */
export interface PastStayRow {
  id: string;
  lease_start: string | null;
  lease_end: string | null;
  apartments: {
    id: string;
    name: string;
    barangay: string | null;
    city: string | null;
    is_hidden_by_admin: boolean | null;
    landlord: { id: string; first_name: string | null; last_name: string | null } | null;
  } | null;
}

/** Everything a past-stay card shows, minus the photo (which needs the image rows) and the viewer's rating. */
export function toPastStay(
  row: PastStayRow,
): Omit<PublicProfilePastStay, "thumbnailUrl" | "canRate" | "myReview"> {
  const apartment = row.apartments;
  const months = stayDurationMonths(row.lease_start, row.lease_end);
  return {
    id: row.id,
    apartmentName: apartment?.name ?? "Apartment",
    apartmentId: apartment && !apartment.is_hidden_by_admin ? apartment.id : null,
    location: [apartment?.barangay, apartment?.city].filter(Boolean).join(", "),
    stayPeriod: formatStayRange(row.lease_start, row.lease_end),
    durationLabel: months === null ? null : formatDurationMonths(months),
    landlord: apartment?.landlord
      ? {
          id: apartment.landlord.id,
          name: profileDisplayName(apartment.landlord.first_name, apartment.landlord.last_name, "Landlord"),
        }
      : null,
  };
}

/** Apartment statuses that appear in a landlord's public listing grid. */
export const LISTED_APARTMENT_STATUSES: readonly string[] = ["available", "unverified"];

export interface UnitSummary {
  total: number;
  available: number;
  occupied: number;
}

/** Occupancy snapshot of a landlord's apartments from their `apartments.status` values. */
export function summarizeUnits(statuses: readonly string[]): UnitSummary {
  return {
    total: statuses.length,
    available: statuses.filter((status) => LISTED_APARTMENT_STATUSES.includes(status)).length,
    occupied: statuses.filter((status) => status === "occupied").length,
  };
}

/** Distinct cities, most listings first (ties alphabetical), capped for display. */
export function coveredCities(cities: ReadonlyArray<string | null | undefined>, limit = 6): string[] {
  const counts = new Map<string, number>();
  for (const city of cities) {
    const name = city?.trim();
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name]) => name);
}

const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30.4375;

/** Whole months between lease start and end; null when either date is missing or reversed. */
export function stayDurationMonths(leaseStart: string | null, leaseEnd: string | null): number | null {
  if (!leaseStart || !leaseEnd) return null;
  const start = new Date(leaseStart).getTime();
  const end = new Date(leaseEnd).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.max(1, Math.round((end - start) / MS_PER_DAY / DAYS_PER_MONTH));
}

/** "8 months", "1 year", "2 years 3 months". */
export function formatDurationMonths(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (rest > 0 || years === 0) parts.push(`${rest} ${rest === 1 ? "month" : "months"}`);
  return parts.join(" ");
}

export interface StayHistorySummary {
  completedStays: number;
  longestStayMonths: number | null;
}

export function summarizeStayHistory(durationsInMonths: ReadonlyArray<number | null>): StayHistorySummary {
  const known = durationsInMonths.filter((value): value is number => value !== null);
  return {
    completedStays: durationsInMonths.length,
    longestStayMonths: known.length > 0 ? Math.max(...known) : null,
  };
}

/** A landlord's rating of a tenant as a profile review card; the stay line needs the apartment or its dates. */
export function toTenantRatingCard(record: TenantReviewRecord): PublicProfileReview {
  return {
    id: record.id,
    reviewerName: record.landlordName,
    reviewerAvatar: record.landlordAvatarUrl ?? undefined,
    date: record.createdAt,
    text: record.comment,
    rating: record.rating,
    apartmentName: record.apartmentName,
    stayPeriod: record.leaseStart ? formatStayRange(record.leaseStart, record.leaseEnd) : undefined,
    isMine: record.isMine,
  };
}

/** The signed-in landlord's own ratings by tenancy, so a past stay can offer "Edit" instead of "Rate". */
export function ownTenantRatingsByTenancy(
  records: readonly TenantReviewRecord[],
): Map<string, { rating: number; comment: string | null }> {
  return new Map(
    records
      .filter((record) => record.isMine)
      .map((record) => [record.tenancyId, { rating: record.rating, comment: record.comment || null }]),
  );
}
