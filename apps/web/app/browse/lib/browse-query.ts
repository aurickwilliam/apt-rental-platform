// Filters, text search and sorting shared by every Browse read (the paged list
// and the map viewport), so the two can never filter differently. The builders
// are generic over the PostgREST query: each call returns the same builder.
export interface BrowseQuery<Self> {
  in(column: string, values: readonly string[]): Self;
  gte(column: string, value: number | boolean): Self;
  lte(column: string, value: number | boolean): Self;
  eq(column: string, value: number | boolean): Self;
  contains(column: string, value: readonly string[]): Self;
  or(filters: string): Self;
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): Self;
}

// Visibility and cover-photo rules every Browse listing read shares (the paged
// list and the Browse rows), so a card looks the same wherever it appears.
interface ListingQuery<Self> {
  is(column: string, value: null): Self;
  eq(column: string, value: boolean): Self;
  in(column: string, values: readonly string[]): Self;
  order(column: string, options?: { ascending?: boolean; foreignTable?: string }): Self;
  limit(count: number, options?: { foreignTable?: string }): Self;
}

/** Only listings the public may see: not deleted, not admin-hidden, open for rent. */
export function applyVisibleListings<Q extends ListingQuery<Q>>(query: Q): Q {
  return query
    .is("deleted_at", null)
    .eq("is_hidden_by_admin", false)
    .in("status", ["available", "unverified"]);
}

/**
 * Cards only ever read the cover image: order covers first and fetch one image
 * row per apartment instead of the whole gallery. Needs `apartment_images` in
 * the select.
 */
export function applyCoverImageOrder<Q extends ListingQuery<Q>>(query: Q): Q {
  return query
    .order("is_cover", { foreignTable: "apartment_images", ascending: false })
    .order("created_at", { foreignTable: "apartment_images", ascending: true })
    .limit(1, { foreignTable: "apartment_images" });
}

const MIN_BUDGET = 1000;
export const MAX_BUDGET = 50000;
const MIN_SIZE = 10;
const MAX_SIZE = 300;

/**
 * A contains-pattern for `.or()`. The text is quoted so commas and brackets
 * are not read as filter syntax, and `%` / `_` match literally.
 */
export function searchPattern(text: string): string {
  const likeSafe = text.replace(/[\\%_]/g, (char) => `\\${char}`);
  const quoted = `%${likeSafe}%`.replace(/[\\"]/g, (char) => `\\${char}`);
  return `"${quoted}"`;
}

export function applyBrowseFilters<Q extends BrowseQuery<Q>>(
  initial: Q,
  params: Record<string, string>,
): Q {
  let query = initial;

  // SearchContainer filters
  // Locations
  if (params.locations) {
    query = query.in("city", params.locations.split(","));
  }

  // Price range
  if (params.price_min && Number(params.price_min) > MIN_BUDGET)
    query = query.gte('monthly_rent', Number(params.price_min));

  if (params.price_max && Number(params.price_max) < MAX_BUDGET)
    query = query.lte('monthly_rent', Number(params.price_max));

  // Apartment types
  if (params.apt_types) {
    const types = params.apt_types.split(",");
    query = query.in("type", types);
  }

  // FilterContainer filters

  // Bedrooms
  if (params.bedrooms) {
    if (params.bedrooms === "4+") query = query.gte("no_bedrooms", 4);
    else query = query.eq("no_bedrooms", Number(params.bedrooms));
  }

  // Bathrooms
  if (params.bathrooms) {
    if (params.bathrooms === "4+") query = query.gte("no_bathrooms", 4);
    else query = query.eq("no_bathrooms", Number(params.bathrooms));
  }

  // Size range
  if (params.size_min && Number(params.size_min) > MIN_SIZE)
    query = query.gte('area_sqm', Number(params.size_min));
  if (params.size_max && Number(params.size_max) < MAX_SIZE)
    query = query.lte('area_sqm', Number(params.size_max));

  // Furnishing
  if (params.furnishing) {
    query = query.in("furnished_type", params.furnishing.split(","));
  }

  // Floor level
  if (params.floor_level) query = query.in('floor_level', params.floor_level.split(','));

  // Lease Duration
  if (params.lease) {
    query = query.in('lease_duration', params.lease.split(','));
  }

  // Amenities
  if (params.amenities) {
    query = query.contains("amenities", params.amenities.split(","));
  }

  // Verified listings only
  if (params.verified === "1") {
    query = query.eq("is_verified", true);
  }

  // Text search by name or location
  if (params.search) {
    const pattern = searchPattern(params.search);
    query = query.or(
      `name.ilike.${pattern},city.ilike.${pattern},barangay.ilike.${pattern}`,
    );
  }

  return query;
}

export function applyBrowseSort<Q extends BrowseQuery<Q>>(
  initial: Q,
  params: Record<string, string>,
): Q {
  let query = initial;

  // Sorting
  switch (params.sort) {
    case "price_asc":
      query = query.order("monthly_rent", { ascending: true });
      break;
    case "price_desc":
      query = query.order("monthly_rent", { ascending: false });
      break;
    case "most_popular":
      // Unrated listings go last; descending order would put them first.
      query = query.order("average_rating", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  query = query.order('id', { ascending: true });

  return query;
}
