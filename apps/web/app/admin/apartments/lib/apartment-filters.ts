import { CAMANAVA_CITIES, type CamanavaCity } from "@repo/constants";
import {
  parseListParam,
  parseOption,
  type SortOption,
} from "@/lib/admin-filters";
import type { FilterOption } from "../../_components/filters/types";

export const LISTING_STATUSES = [
  "available",
  "occupied",
  "under_maintenance",
  "unverified",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const VERIFICATION_FILTERS = ["all", "verified", "unverified"] as const;
export type VerificationFilter = (typeof VERIFICATION_FILTERS)[number];

export const VISIBILITY_FILTERS = ["all", "visible", "hidden"] as const;
export type VisibilityFilter = (typeof VISIBILITY_FILTERS)[number];

/** Listings whose city is not one of the four CAMANAVA cities. */
export const OUTSIDE_CAMANAVA = "outside";
export type LocationFilter = CamanavaCity | typeof OUTSIDE_CAMANAVA;
export const LOCATION_FILTERS: readonly LocationFilter[] = [
  ...CAMANAVA_CITIES,
  OUTSIDE_CAMANAVA,
];

export const APARTMENT_SORT_KEYS = [
  "newest",
  "oldest",
  "name_asc",
  "name_desc",
  "rent_asc",
  "rent_desc",
] as const;
export type ApartmentSort = (typeof APARTMENT_SORT_KEYS)[number];

export const STATUS_OPTIONS: readonly FilterOption<ListingStatus>[] = [
  { id: "available", label: "Available" },
  { id: "occupied", label: "Occupied" },
  { id: "under_maintenance", label: "Under maintenance" },
  { id: "unverified", label: "Unverified" },
];

export const VERIFICATION_OPTIONS: readonly FilterOption<VerificationFilter>[] =
  [
    { id: "all", label: "All" },
    { id: "verified", label: "Verified" },
    { id: "unverified", label: "Unverified" },
  ];

export const VISIBILITY_OPTIONS: readonly FilterOption<VisibilityFilter>[] = [
  { id: "all", label: "All" },
  { id: "visible", label: "Visible" },
  { id: "hidden", label: "Hidden" },
];

export const LOCATION_OPTIONS: readonly FilterOption<LocationFilter>[] = [
  ...CAMANAVA_CITIES.map((city) => ({ id: city, label: city })),
  { id: OUTSIDE_CAMANAVA, label: "Outside CAMANAVA" },
];

// `column` ids match the sortable headers in ApartmentsTable.
export const APARTMENT_SORT_OPTIONS: readonly SortOption<ApartmentSort>[] = [
  { id: "newest", label: "Newest first", column: "joined", direction: "descending" },
  { id: "oldest", label: "Oldest first", column: "joined", direction: "ascending" },
  { id: "name_asc", label: "Name A–Z", column: "apartment", direction: "ascending" },
  { id: "name_desc", label: "Name Z–A", column: "apartment", direction: "descending" },
  { id: "rent_asc", label: "Rent: low to high", column: "rent", direction: "ascending" },
  { id: "rent_desc", label: "Rent: high to low", column: "rent", direction: "descending" },
];

export interface ApartmentFilters {
  q: string;
  statuses: ListingStatus[];
  verification: VerificationFilter;
  visibility: VisibilityFilter;
  locations: LocationFilter[];
  sort: ApartmentSort;
}

export interface ApartmentSearchParams {
  q?: string;
  status?: string;
  verification?: string;
  visibility?: string;
  location?: string;
  sort?: string;
  page?: string;
}

export function parseApartmentFilters(
  params: ApartmentSearchParams,
): ApartmentFilters {
  return {
    q: params.q?.trim() ?? "",
    statuses: parseListParam(params.status, LISTING_STATUSES),
    verification: parseOption(params.verification, VERIFICATION_FILTERS, "all"),
    visibility: parseOption(params.visibility, VISIBILITY_FILTERS, "all"),
    locations: parseListParam(params.location, LOCATION_FILTERS),
    sort: parseOption(params.sort, APARTMENT_SORT_KEYS, "newest"),
  };
}

/** URL params for a filter state; defaults are omitted to keep links short. */
export function apartmentFilterParams(filters: ApartmentFilters, page: number) {
  return {
    q: filters.q,
    status: filters.statuses,
    verification: filters.verification === "all" ? null : filters.verification,
    visibility: filters.visibility === "all" ? null : filters.visibility,
    location: filters.locations,
    sort: filters.sort === "newest" ? null : filters.sort,
    page: page > 1 ? page : null,
  };
}

/**
 * PostgREST `or` filter for the location selection. City names match
 * case-insensitively, the same way the admin listings-by-city analytics
 * buckets them; "outside" is any city that matches none of the four.
 */
export function locationOrFilter(locations: LocationFilter[]): string | null {
  if (!locations.length) return null;
  const clauses = locations
    .filter((location) => location !== OUTSIDE_CAMANAVA)
    .map((city) => `city.ilike.${city}`);
  if (locations.includes(OUTSIDE_CAMANAVA))
    clauses.push(
      `and(${CAMANAVA_CITIES.map((city) => `city.not.ilike.${city}`).join(",")})`,
    );
  return clauses.join(",");
}
