import { createClient } from "@repo/supabase/server";

import {
  buildFillerRowSpecs,
  buildPersonalizedRowSpecs,
  hasMeaningfulPreferences,
  MIN_BROWSE_ROWS,
  rankCandidates,
  RECOMMENDATION_LIMIT,
  selectBrowseRows,
  type BrowseRowSpec,
} from "@/lib/recommendations";
import type { TenantPreferences } from "@/lib/tenant-preferences";

import { toBrowseApartment, type BrowseApartment } from "./browse-apartment";
import { applyBrowseFilters } from "./browse-query";
import type { BrowseSection } from "./fetch-browse-sections";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export const RECOMMENDED_SECTION_ID = "for_you";
export const RECOMMENDED_SECTION_TITLE = "Recommended for You";
export const RECOMMENDED_SECTION_SUBTITLE = "Based on your rental preferences.";

/** Candidates scored for the Recommended row; the best RECOMMENDATION_LIMIT survive. */
const RECOMMENDATION_POOL_SIZE = 200;

const ROW_COLUMNS = `id, name, barangay, city, monthly_rent, average_rating,
  no_bedrooms, no_bathrooms, area_sqm, is_verified, amenities,
  apartment_images(url, url_thumb, is_cover, created_at)`;

// Same visibility and cover-image rules as fetchBrowseResults, so a row card
// and a grid card for one listing look identical.
function listingsQuery(supabase: ServerSupabaseClient) {
  return supabase
    .from("apartments")
    .select(ROW_COLUMNS)
    .is("deleted_at", null)
    .eq("is_hidden_by_admin", false)
    .in("status", ["available", "unverified"])
    .order("is_cover", { foreignTable: "apartment_images", ascending: false })
    .order("created_at", { foreignTable: "apartment_images", ascending: true })
    .limit(1, { foreignTable: "apartment_images" });
}

function toSection(
  spec: Pick<BrowseRowSpec, "id" | "title" | "subtitle">,
  apartments: BrowseApartment[],
  seeAllHref: string | null,
): BrowseSection {
  return { id: spec.id, title: spec.title, subtitle: spec.subtitle, apartments, seeAllHref };
}

// Unrated listings sort last, unlike the grid's "most popular" order.
function sortRow<Q extends { order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): Q }>(
  query: Q,
  sort: BrowseRowSpec["sort"] = "rating",
): Q {
  switch (sort) {
    case "newest":
      return query.order("created_at", { ascending: false });
    case "price_asc":
      return query.order("monthly_rent", { ascending: true });
    case "size_desc":
      return query.order("area_sqm", { ascending: false, nullsFirst: false });
    default:
      return query.order("average_rating", { ascending: false, nullsFirst: false });
  }
}

async function fetchRow(
  supabase: ServerSupabaseClient,
  spec: BrowseRowSpec,
  basePath: string,
): Promise<BrowseSection | null> {
  let query = applyBrowseFilters(listingsQuery(supabase), spec.params);
  if (spec.bedroomRange) {
    query = query.gte("no_bedrooms", spec.bedroomRange.min);
    if (spec.bedroomRange.max !== null) query = query.lte("no_bedrooms", spec.bedroomRange.max);
  }
  if (spec.minRating !== undefined) query = query.gte("average_rating", spec.minRating);

  const { data, error } = await sortRow(query, spec.sort)
    .order("id", { ascending: true })
    .limit(RECOMMENDATION_LIMIT);
  if (error) {
    console.error(error);
    return null;
  }

  return toSection(
    spec,
    (data ?? []).map(toBrowseApartment),
    spec.seeAllQuery ? `${basePath}?${spec.seeAllQuery}` : null,
  );
}

async function fetchRecommendedRow(
  supabase: ServerSupabaseClient,
  prefs: TenantPreferences,
): Promise<BrowseSection | null> {
  let query = listingsQuery(supabase);
  // Chosen cities are a hard gate in scoreListing, so only pull those cities.
  if (prefs.selectedCities.length > 0) query = query.in("city", prefs.selectedCities);

  const { data, error } = await query
    .order("average_rating", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true })
    .limit(RECOMMENDATION_POOL_SIZE);
  if (error) {
    console.error(error);
    return null;
  }

  const pool = data ?? [];
  const ranked = rankCandidates(pool, prefs, RECOMMENDATION_LIMIT);
  const byId = new Map(pool.map((row) => [row.id, row]));
  const apartments = ranked
    .map((scored) => byId.get(scored.candidate.id))
    .filter((row): row is (typeof pool)[number] => row !== undefined)
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

  const [recommended, ...rows] = await Promise.all([
    fetchRecommendedRow(supabase, prefs),
    ...buildPersonalizedRowSpecs(prefs).map((spec) => fetchRow(supabase, spec, basePath)),
  ]);

  return [recommended, ...rows].filter(
    (section): section is BrowseSection => section !== null && section.apartments.length > 0,
  );
}

/**
 * Pads `sections` up to MIN_BROWSE_ROWS with filler rows (see
 * buildFillerRowSpecs), so the default page never looks sparse. `prefs` only
 * supplies chosen cities to gate the extra rows. Pass `includeCore: true`
 * when `sections` came from preferences and false when they are the fixed
 * rows, which already cover the core cohorts. Never trims or reorders
 * `sections`; an empty or failed filler row is simply skipped.
 */
export async function fillBrowseSections(
  supabase: ServerSupabaseClient,
  sections: BrowseSection[],
  prefs: TenantPreferences | null | undefined,
  { includeCore, basePath = "/browse" }: { includeCore: boolean; basePath?: string },
): Promise<BrowseSection[]> {
  if (sections.length >= MIN_BROWSE_ROWS) return sections;

  const rows = await Promise.all(
    buildFillerRowSpecs(prefs, { includeCore }).map((spec) => fetchRow(supabase, spec, basePath)),
  );
  const filler = rows.filter(
    (section): section is BrowseSection => section !== null && section.apartments.length > 0,
  );
  return selectBrowseRows(sections, filler);
}
