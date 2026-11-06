import { createClient } from "@repo/supabase/server";

import {
  BROWSE_ROW_LIMIT,
  buildPersonalizedRowSpecs,
  hasMeaningfulPreferences,
  type BrowseRowSpec,
} from "@repo/utils";

import type { TenantPreferences } from "@/lib/tenant-preferences";

import { BROWSE_CARD_COLUMNS, toBrowseApartment, type BrowseApartment } from "./browse-apartment";
import {
  applyBrowseFilters,
  applyBrowseSort,
  applyCoverImageOrder,
  applyVisibleListings,
  type BrowseQuery,
} from "./browse-query";
import { toDrawerRow } from "./browse-row-drawer";
import type { BrowseSection } from "./fetch-browse-sections";
import { RECOMMENDED_SECTION_ID } from "./recommended-section";
import { rankRecommendationCandidates } from "./recommendation-ranking";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export { RECOMMENDED_SECTION_ID } from "./recommended-section";
export const RECOMMENDED_SECTION_TITLE = "Recommended for You";
export const RECOMMENDED_SECTION_SUBTITLE = "Based on your rental preferences.";

/**
 * Listings scored for the Recommended row. Scoring reads only a few light
 * columns, so the pool is wide enough that a good match is not lost to a
 * rating cut; only the winners are fetched with photos.
 */
const RECOMMENDATION_POOL_SIZE = 1000;
const POOL_COLUMNS = "id, city, monthly_rent, no_bedrooms, amenities, is_verified, average_rating";

function cardQuery(supabase: ServerSupabaseClient) {
  return applyCoverImageOrder(
    applyVisibleListings(supabase.from("apartments").select(BROWSE_CARD_COLUMNS)),
  );
}

function toSection(
  spec: Pick<BrowseRowSpec, "id" | "title" | "subtitle">,
  apartments: BrowseApartment[],
  seeAllHref: string | null,
): BrowseSection {
  return { id: spec.id, title: spec.title, subtitle: spec.subtitle, apartments, seeAllHref };
}

function withApartments(sections: (BrowseSection | null)[]): BrowseSection[] {
  return sections.filter(
    (section): section is BrowseSection => section !== null && section.apartments.length > 0,
  );
}

// Reuses the grid's sorts where they match; unrated listings sort last for
// ratings, unlike the grid's "most popular" order.
function sortRow<Q extends BrowseQuery<Q>>(query: Q, sort: BrowseRowSpec["sort"]): Q {
  switch (sort) {
    case "newest":
      return applyBrowseSort(query, {});
    case "price_asc":
      return applyBrowseSort(query, { sort: "price_asc" });
    case "size_desc":
      return query
        .order("area_sqm", { ascending: false, nullsFirst: false })
        .order("id", { ascending: true });
    default:
      return query
        .order("average_rating", { ascending: false, nullsFirst: false })
        .order("id", { ascending: true });
  }
}

async function fetchRow(
  supabase: ServerSupabaseClient,
  spec: BrowseRowSpec,
  basePath: string,
): Promise<BrowseSection | null> {
  const row = toDrawerRow(spec);
  let query = applyBrowseFilters(cardQuery(supabase), row.params);
  if (row.bedroomRange) {
    query = query.gte("no_bedrooms", row.bedroomRange.min);
    if (row.bedroomRange.max !== null) query = query.lte("no_bedrooms", row.bedroomRange.max);
  }
  if (row.priceRange) {
    query = query.gte("monthly_rent", row.priceRange.min).lte("monthly_rent", row.priceRange.max);
  }
  if (row.minRating !== undefined) query = query.gte("average_rating", row.minRating);

  const { data, error } = await sortRow(query, spec.sort).limit(BROWSE_ROW_LIMIT);
  if (error) {
    console.error(error);
    return null;
  }

  return toSection(
    spec,
    (data ?? []).map(toBrowseApartment),
    row.seeAllQuery ? `${basePath}?${row.seeAllQuery}` : null,
  );
}

async function fetchRecommendedRow(
  supabase: ServerSupabaseClient,
  prefs: TenantPreferences,
): Promise<BrowseSection | null> {
  // Web-only eligibility, before the bounded candidate read. Shared scoring
  // stays unchanged (mobile still uses its existing soft budget behavior).
  // The default/full budget is unanswered in the existing preference contract.
  const budget = buildPersonalizedRowSpecs(prefs).find((spec) => spec.id === "budget")?.criteria;
  const constrain = <Q extends BrowseQuery<Q>>(query: Q): Q => {
    if (prefs.selectedCities.length > 0) query = query.in("city", prefs.selectedCities);
    if (budget?.priceMin !== undefined) query = query.gte("monthly_rent", budget.priceMin);
    if (budget?.priceMax !== undefined) query = query.lte("monthly_rent", budget.priceMax);
    return query;
  };
  const poolQuery = constrain(applyVisibleListings(supabase.from("apartments").select(POOL_COLUMNS)));

  const { data: pool, error } = await poolQuery
    .order("id", { ascending: true })
    .limit(RECOMMENDATION_POOL_SIZE);
  if (error) {
    console.error(error);
    return null;
  }

  const ids = rankRecommendationCandidates(pool ?? [], prefs).map((s) => s.candidate.id);
  if (ids.length === 0) return null;

  // Recheck eligibility when reading the winners: a listing's price/city may
  // have changed after the pool read. Do not replace lost winners with outsiders.
  const { data: cards, error: cardError } = await constrain(cardQuery(supabase)).in("id", ids);
  if (cardError) {
    console.error(cardError);
    return null;
  }

  // The card read has no order: restore the ranking.
  const byId = new Map((cards ?? []).map((card) => [card.id, card]));
  const apartments = ids
    .map((id) => byId.get(id))
    .filter((card): card is NonNullable<typeof card> => card !== undefined)
    .map(toBrowseApartment);
  if (apartments.length === 0) return null;

  return toSection(
    {
      id: RECOMMENDED_SECTION_ID,
      title: RECOMMENDED_SECTION_TITLE,
      subtitle: RECOMMENDED_SECTION_SUBTITLE,
    },
    apartments,
    null,
  );
}

/**
 * Browse rows built from the tenant's saved preferences: the scored
 * "Recommended for You" row, then one row per answered preference. Returns an
 * empty list when preferences are missing or skipped, so the caller can show
 * the fixed discovery rows instead. Rows run in parallel; a failed or empty
 * row is dropped without hiding the others.
 */
export async function fetchPersonalizedSections(
  supabase: ServerSupabaseClient,
  prefs: TenantPreferences | null | undefined,
  basePath = "/browse",
): Promise<BrowseSection[]> {
  if (!prefs || !hasMeaningfulPreferences(prefs)) return [];

  return withApartments(
    await Promise.all([
      fetchRecommendedRow(supabase, prefs),
      ...buildPersonalizedRowSpecs(prefs).map((spec) => fetchRow(supabase, spec, basePath)),
    ]),
  );
}

/**
 * Runs filler rows (see buildFillerRowSpecs) in parallel. An empty or failed
 * row is skipped, so callers can count the result toward the row minimum.
 */
export async function fetchFillerSections(
  supabase: ServerSupabaseClient,
  specs: BrowseRowSpec[],
  basePath = "/browse",
): Promise<BrowseSection[]> {
  return withApartments(await Promise.all(specs.map((spec) => fetchRow(supabase, spec, basePath))));
}
