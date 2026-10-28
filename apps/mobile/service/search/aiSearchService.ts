import { supabase } from "@repo/supabase";
import { CAMANAVA_CITIES } from "@repo/constants";
import {
  AVA_RESULT_LIMIT,
  avaFallbackAnswer,
  hasAvaQuestion,
  readAvaResponse,
  type AiSearchFilters,
  type AvaAnswer,
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

export interface AvaListings {
  listings: ApartmentCardProps[];
  total: number;
}

export async function askAva(turns: AvaTurn[]): Promise<AvaAnswer> {
  if (!hasAvaQuestion(turns)) return avaFallbackAnswer(turns);

  const { data, error } = await supabase.functions.invoke("ai-search", {
    body: { messages: turns },
  });

  if (error || !data) {
    console.error("Ava request failed:", error?.message ?? "empty response");
    return avaFallbackAnswer(turns);
  }

  return readAvaResponse(data, turns);
}

export async function fetchAvaListings(
  filters: AiSearchFilters,
  limit: number = AVA_RESULT_LIMIT,
): Promise<AvaListings> {
  // Same visibility guards as the search tab (`useSearchLogic`).
  let query = supabase
    .from("apartments")
    .select(APARTMENT_CARD_SELECT, { count: "estimated" })
    .is("deleted_at", null)
    .eq("is_hidden_by_admin", false)
    .in("status", ["available", "unverified"])
    .range(0, limit - 1);

  const cities = filters.cities.length > 0 ? filters.cities : [...CAMANAVA_CITIES];
  query = query.in("city", cities);

  if (filters.priceMin !== null) query = query.gte("monthly_rent", filters.priceMin);
  if (filters.priceMax !== null) query = query.lte("monthly_rent", filters.priceMax);
  if (filters.types.length > 0) query = query.in("type", filters.types);

  if (filters.bedrooms === "4+") query = query.gte("no_bedrooms", 4);
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

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as ApartmentCardRow[];
  return { listings: toApartmentCards(rows), total: count ?? rows.length };
}
