// Filters, text search and sorting shared by every Browse read (the paged list
// and the map viewport), so the two can never filter differently. The builders
// are generic over the PostgREST query: each call returns the same builder.
interface BrowseQuery<Self> {
  in(column: string, values: readonly string[]): Self;
  gte(column: string, value: number | boolean): Self;
  lte(column: string, value: number | boolean): Self;
  eq(column: string, value: number | boolean): Self;
  contains(column: string, value: readonly string[]): Self;
  or(filters: string): Self;
  order(column: string, options?: { ascending?: boolean }): Self;
}

const MIN_BUDGET = 1000;
const MAX_BUDGET = 50000;
const MIN_SIZE = 10;
const MAX_SIZE = 300;

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
    query = query.or(
      `name.ilike.%${params.search}%,city.ilike.%${params.search}%,barangay.ilike.%${params.search}%`,
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
      query = query.order('average_rating', { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  query = query.order('id', { ascending: true });

  return query;
}
