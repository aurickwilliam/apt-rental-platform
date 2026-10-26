import { cache } from "react";
import { createClient } from "@repo/supabase/server";

import { toBrowseApartment, type BrowseApartment } from "./browse-apartment";

export type { BrowseApartment };
import { applyBrowseFilters, applyBrowseSort } from "./browse-query";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export const BROWSE_PAGE_SIZE = 25;

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
      apartment_images(url, url_thumb, is_cover, created_at)`,
    { count: "exact" },
  );

  query = query
    .is('deleted_at', null)
    .eq('is_hidden_by_admin', false)
    .in("status", ["available", "unverified"]);

  // Cards only ever read the cover image: order covers first and fetch one
  // image row per apartment instead of the whole gallery.
  query = query
    .order("is_cover", { foreignTable: "apartment_images", ascending: false })
    .order("created_at", { foreignTable: "apartment_images", ascending: true })
    .limit(1, { foreignTable: "apartment_images" });

  query = applyBrowseFilters(query, params);
  query = applyBrowseSort(query, params);

  const page = Number(params.page ?? 1);
  const from = (page - 1) * BROWSE_PAGE_SIZE;
  const to = from + BROWSE_PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: apartments, error, count } = await query;
  if (error) console.error(error);

  const mapped = (apartments ?? []).map(toBrowseApartment);

  return {
    apartments: mapped,
    page,
    totalCount: count ?? 0,
    pageSize: BROWSE_PAGE_SIZE,
  };
}

/**
 * Request-scoped dedupe for the shell pieces that need the same result count
 * (filter rail, mobile filter entry) and the grid. React clears this cache
 * after the request, so it is not a data cache and never survives navigation.
 */
export const loadBrowseResults = cache(fetchBrowseResults);
