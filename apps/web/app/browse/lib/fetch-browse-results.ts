import { createClient } from "@repo/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

const MIN_BUDGET = 1000;
const MAX_BUDGET = 50000;
const MIN_SIZE = 10;
const MAX_SIZE = 300;

export const BROWSE_PAGE_SIZE = 25;

export interface BrowseApartment {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  isVerified: boolean;
  image: string;
}

export interface BrowseResults {
  apartments: BrowseApartment[];
  page: number;
  totalCount: number;
  pageSize: number;
}

// Shared browse query used by the public /browse page and the tenant-shell
// /tenant/browse route. Same filters, sorting, paging, and mapping.
export async function fetchBrowseResults(
  supabase: ServerSupabaseClient,
  params: Record<string, string>,
): Promise<BrowseResults> {
  let query = supabase.from("apartments").select(
    `id, name, barangay, city, monthly_rent, average_rating,
      no_bedrooms, no_bathrooms, area_sqm, is_verified,
      apartment_images(url, is_cover, created_at)`,
    { count: "exact" },
  );

  query = query.is('deleted_at', null).eq('is_hidden_by_admin', false);

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

  const page = Number(params.page ?? 1);
  const from = (page - 1) * BROWSE_PAGE_SIZE;
  const to = from + BROWSE_PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: apartments, error, count } = await query;
  if (error) console.error(error);

  const mapped = (apartments ?? []).map((apt) => ({
    id: apt.id,
    name: apt.name,
    location: apt.city,
    price: apt.monthly_rent,
    rating: apt.average_rating ?? 0,
    isVerified: apt.is_verified ?? false,
    image:
      apt.apartment_images?.find((img) => img.is_cover)?.url ??
      "/default/default-thumbnail.jpeg",
  }));

  return {
    apartments: mapped,
    page,
    totalCount: count ?? 0,
    pageSize: BROWSE_PAGE_SIZE,
  };
}
