import { cache } from "react";
import { createClient } from "@repo/supabase/server";

import { BROWSE_CARD_COLUMNS, toBrowseApartment, type BrowseApartment } from "./browse-apartment";

export type { BrowseApartment };
import {
  applyBrowseFilters,
  applyBrowseSort,
  applyCoverImageOrder,
  applyVisibleListings,
} from "./browse-query";

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
  let query = supabase.from("apartments").select(BROWSE_CARD_COLUMNS, { count: "exact" });

  query = applyCoverImageOrder(applyVisibleListings(query));

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
