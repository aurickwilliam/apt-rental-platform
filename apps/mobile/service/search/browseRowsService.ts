import { supabase } from "@repo/supabase";
import {
  BROWSE_ROW_LIMIT,
  rankCandidates,
  recommendationReasons,
  type BrowseRowCriteria,
  type BrowseRowPreferences,
  type BrowseRowSort,
  type BrowseRowSpec,
} from "@repo/utils";

import type { ApartmentCardProps } from "@/components/cards/ApartmentCard";
import {
  APARTMENT_CARD_SELECT,
  toApartmentCards,
  type ApartmentCardRow,
} from "./apartmentCards";

/**
 * Listings scored for the Recommended row. Scoring reads only a few light
 * columns, so the pool is wide enough that a good match is not lost to a rating
 * cut; only the winners are fetched with photos.
 */
export const RECOMMENDATION_POOL_SIZE = 1000;
const POOL_SELECT = "id, city, monthly_rent, no_bedrooms, max_occupants, amenities, is_verified, average_rating";

// The tenant's accessibility need maps to the `wheelchair` amenity on mobile.
const SCORE_OPTIONS = { wheelchairAmenity: true } as const;

// Public visibility and cover-photo rules, as in the search tab: not deleted,
// not admin-hidden, open for rent; one cover image per card.
function cardQuery() {
  return supabase
    .from("apartments")
    .select(APARTMENT_CARD_SELECT)
    .is("deleted_at", null)
    .eq("is_hidden_by_admin", false)
    .in("status", ["available", "unverified"])
    .order("is_cover", { foreignTable: "apartment_images", ascending: false })
    .order("created_at", { foreignTable: "apartment_images", ascending: true })
    .limit(1, { foreignTable: "apartment_images" });
}

function applyCriteria<Q extends ReturnType<typeof cardQuery>>(query: Q, c: BrowseRowCriteria): Q {
  let next = query;
  if (c.cities && c.cities.length > 0) next = next.in("city", c.cities) as Q;
  if (c.priceMin !== undefined) next = next.gte("monthly_rent", c.priceMin) as Q;
  if (c.priceMax !== undefined) next = next.lte("monthly_rent", c.priceMax) as Q;
  if (c.bedroomMin !== undefined) next = next.gte("no_bedrooms", c.bedroomMin) as Q;
  if (c.bedroomMax !== undefined) next = next.lte("no_bedrooms", c.bedroomMax) as Q;
  if (c.verified) next = next.eq("is_verified", true) as Q;
  if (c.types && c.types.length > 0) next = next.in("type", c.types) as Q;
  if (c.sizeMin !== undefined) next = next.gte("area_sqm", c.sizeMin) as Q;
  if (c.furnishing) next = next.eq("furnished_type", c.furnishing) as Q;
  if (c.amenities && c.amenities.length > 0) next = next.contains("amenities", c.amenities) as Q;
  if (c.minRating !== undefined) next = next.gte("average_rating", c.minRating) as Q;
  return next;
}

// Unrated listings sort last for ratings and sizes; every order breaks ties by id.
function applySort<Q extends ReturnType<typeof cardQuery>>(query: Q, sort: BrowseRowSort): Q {
  switch (sort) {
    case "newest":
      return query.order("created_at", { ascending: false }).order("id", { ascending: true }) as Q;
    case "price_asc":
      return query.order("monthly_rent", { ascending: true }).order("id", { ascending: true }) as Q;
    case "size_desc":
      return query
        .order("area_sqm", { ascending: false, nullsFirst: false })
        .order("id", { ascending: true }) as Q;
    default:
      return query
        .order("average_rating", { ascending: false, nullsFirst: false })
        .order("id", { ascending: true }) as Q;
  }
}

interface RowPage {
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}

/** A row's apartments: the first page for the Explore row, later pages for See All. */
export async function fetchBrowseRowCards(
  spec: Pick<BrowseRowSpec, "criteria" | "sort">,
  { limit = BROWSE_ROW_LIMIT, offset = 0, signal }: RowPage = {},
): Promise<ApartmentCardProps[]> {
  let query = applySort(applyCriteria(cardQuery(), spec.criteria), spec.sort).range(
    offset,
    offset + limit - 1,
  );
  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) throw error;
  return toApartmentCards((data ?? []) as unknown as ApartmentCardRow[]);
}

/**
 * The tenant's best matches: score a wide pool of light rows, then fetch only
 * the winners with photos, restored to ranked order. Empty when nothing scores.
 */
export async function fetchRecommendedCards(
  prefs: BrowseRowPreferences,
  limit: number = BROWSE_ROW_LIMIT,
  signal?: AbortSignal,
): Promise<ApartmentCardProps[]> {
  let poolQuery = supabase
    .from("apartments")
    .select(POOL_SELECT)
    .is("deleted_at", null)
    .eq("is_hidden_by_admin", false)
    .in("status", ["available", "unverified"]);
  // Chosen cities are a hard gate in scoreListing, so only pull those cities.
  if (prefs.selectedCities.length > 0) poolQuery = poolQuery.in("city", prefs.selectedCities);
  poolQuery = poolQuery.order("id", { ascending: true }).limit(RECOMMENDATION_POOL_SIZE);
  if (signal) poolQuery = poolQuery.abortSignal(signal);

  const { data: pool, error } = await poolQuery;
  if (error) throw error;

  const ids = rankCandidates(pool ?? [], prefs, limit, SCORE_OPTIONS).map((s) => s.candidate.id);
  if (ids.length === 0) return [];

  let cardsQuery = cardQuery().in("id", ids);
  if (signal) cardsQuery = cardsQuery.abortSignal(signal);
  const { data: cards, error: cardError } = await cardsQuery;
  if (cardError) throw cardError;

  // The card read has no order: restore the ranking.
  const byId = new Map(((cards ?? []) as unknown as ApartmentCardRow[]).map((card) => [card.id, card]));
  const ordered = ids
    .map((id) => byId.get(id))
    .filter((card): card is ApartmentCardRow => card !== undefined);
  const candidates = new Map((pool ?? []).map((candidate) => [candidate.id, candidate]));
  return toApartmentCards(ordered).map((card) => {
    const candidate = candidates.get(card.id);
    return { ...card, reasons: candidate ? recommendationReasons(candidate, prefs) : [] };
  });
}
