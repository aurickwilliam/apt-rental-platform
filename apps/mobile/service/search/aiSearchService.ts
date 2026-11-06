import { supabase } from "@repo/supabase";
import { CAMANAVA_CITIES } from "@repo/constants";
import {
  AVA_RESULT_LIMIT,
  avaFallbackAnswer,
  buildAvaRequest,
  readAvaResponse,
  shouldAskAvaModel,
  type AiSearchFilters,
  type AvaAnswer,
  type AvaFound,
  type AvaTurn,
} from "@repo/utils";

import { type ApartmentCardProps } from "@/components/cards/ApartmentCard";
import {
  APARTMENT_CARD_SELECT,
  toApartmentCards,
  type ApartmentCardRow,
} from "@/service/search/apartmentCards";

// Client for the `ai-search` edge function (Ava, the APT Virtual Assistant).
// Reading the answer and the keyword fallback are shared with the web in
// `@repo/utils` (`avaChat.ts`); this service only makes the calls. Listings
// are searched here with the app's own client, so RLS decides what appears.

// The card columns plus what the distance ranking and captions need.
const AVA_LISTING_SELECT = `latitude, longitude, amenities, ${APARTMENT_CARD_SELECT}`;
// Large candidate pools skip the photo rows; shown listings are re-read by id.
const AVA_LIGHT_SELECT = `id, name, barangay, city, average_rating, monthly_rent, no_bedrooms,
  no_bathrooms, area_sqm, is_verified, latitude, longitude, amenities`;

interface AvaListingRow extends ApartmentCardRow {
  latitude: number | null;
  longitude: number | null;
  amenities: string[] | null;
}

// The sign-in can expire while the screen stays open, which the function
// answers with a 401. Refresh once and retry before giving up.
const isUnauthorized = (error: unknown) =>
  (error as { context?: { status?: number } } | null)?.context?.status === 401;

export async function askAva(turns: AvaTurn[]): Promise<AvaAnswer> {
  // Questions about the saved preferences are answered on the device, never sent.
  if (!shouldAskAvaModel(turns)) return avaFallbackAnswer(turns);

  const body = buildAvaRequest(turns);
  let { data, error } = await supabase.functions.invoke("ai-search", { body });

  if (error && isUnauthorized(error)) {
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError) ({ data, error } = await supabase.functions.invoke("ai-search", { body }));
    if (error && isUnauthorized(error)) {
      console.error("Ava request failed: the session expired.");
      return avaFallbackAnswer(turns, "session");
    }
  }

  if (error || !data) {
    console.error("Ava request failed:", error?.message ?? "empty response");
    return avaFallbackAnswer(turns);
  }

  return readAvaResponse(data, turns);
}

export async function fetchAvaListings(
  filters: AiSearchFilters,
  limit: number = AVA_RESULT_LIMIT,
  excludeIds: string[] = [],
  options: { light?: boolean; ids?: string[] } = {},
): Promise<AvaFound<ApartmentCardProps>[]> {
  // Same visibility guards as the search tab (`useSearchLogic`).
  let query = supabase
    .from("apartments")
    .select((options.light ? AVA_LIGHT_SELECT : AVA_LISTING_SELECT) as string)
    .is("deleted_at", null)
    .eq("is_hidden_by_admin", false)
    .in("status", ["available", "unverified"])
    .range(0, limit - 1);

  if (excludeIds.length > 0) query = query.not("id", "in", `(${excludeIds.join(",")})`);

  // Exactly these listings, in full: the filters below do not apply.
  if (options.ids) {
    const { data, error } = await query.in("id", options.ids);
    if (error) throw error;
    return toFound((data ?? []) as unknown as AvaListingRow[]);
  }

  const cities = filters.cities.length > 0 ? filters.cities : [...CAMANAVA_CITIES];
  query = query.in("city", cities);

  if (filters.priceMin !== null) query = query.gte("monthly_rent", filters.priceMin);
  if (filters.priceMax !== null) query = query.lte("monthly_rent", filters.priceMax);
  if (filters.types.length > 0) query = query.in("type", filters.types);

  if (filters.bedrooms !== null && filters.bedroomsMax !== null) {
    // "One or two bedrooms": a range, not a single count.
    const min = filters.bedrooms === "4+" ? 4 : Number(filters.bedrooms);
    query = query.gte("no_bedrooms", min).lte("no_bedrooms", filters.bedroomsMax);
  } else if (filters.bedrooms === "4+") query = query.gte("no_bedrooms", 4);
  else if (filters.bedrooms !== null) query = query.eq("no_bedrooms", Number(filters.bedrooms));

  if (filters.bathrooms === "4+") query = query.gte("no_bathrooms", 4);
  else if (filters.bathrooms !== null) query = query.eq("no_bathrooms", Number(filters.bathrooms));

  if (filters.furnishing.length > 0) query = query.in("furnished_type", filters.furnishing);
  if (filters.amenities.length > 0) query = query.contains("amenities", filters.amenities);
  if (filters.verifiedOnly) query = query.eq("is_verified", true);

  // The keyword is already limited to letters, digits, spaces and hyphens.
  if (filters.keyword !== null) {
    query = query.or(
      `name.ilike.%${filters.keyword}%,barangay.ilike.%${filters.keyword}%,city.ilike.%${filters.keyword}%`,
    );
  }

  switch (filters.sort) {
    case "price_asc":
      query = query.order("monthly_rent", { ascending: true });
      break;
    case "price_desc":
      query = query.order("monthly_rent", { ascending: false });
      break;
    case "most_popular":
      query = query.order("average_rating", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }
  query = query.order("id", { ascending: true });

  const { data, error } = await query;
  if (error) throw error;

  return toFound((data ?? []) as unknown as AvaListingRow[]);
}

function toFound(rows: AvaListingRow[]): AvaFound<ApartmentCardProps>[] {
  const cards = toApartmentCards(rows);
  return rows.map((row, index) => ({
    card: cards[index],
    candidate: {
      id: row.id,
      monthlyRent: row.monthly_rent,
      bedrooms: row.no_bedrooms,
      amenities: row.amenities ?? [],
      latitude: row.latitude,
      longitude: row.longitude,
      city: row.city,
    },
  }));
}

/**
 * Re-reads listings Ava showed in a saved chat, by id, with the same visibility
 * rules as a fresh search. Listings that were deleted, hidden or taken are
 * absent, so a reopened chat never shows a stale listing.
 */
export async function fetchAvaListingsByIds(
  ids: string[],
): Promise<Map<string, ApartmentCardProps>> {
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from("apartments")
    .select(APARTMENT_CARD_SELECT)
    .in("id", ids)
    .is("deleted_at", null)
    .eq("is_hidden_by_admin", false)
    .in("status", ["available", "unverified"]);
  if (error) throw error;

  const rows = (data ?? []) as unknown as ApartmentCardRow[];
  const cards = toApartmentCards(rows);
  return new Map(rows.map((row, index) => [row.id, cards[index]]));
}
