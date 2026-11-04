import { createClient } from "@repo/supabase/server";

import {
  buildFillerRowSpecs,
  buildPersonalizedRowSpecs,
  hasMeaningfulPreferences,
  MIN_BROWSE_ROWS,
  selectBrowseRows,
} from "@repo/utils";

import type { TenantPreferences } from "@/lib/tenant-preferences";

import { fetchDiscoverySections, type BrowseSection } from "./fetch-browse-sections";
import { fetchFillerSections, fetchPersonalizedSections } from "./fetch-personalized-sections";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Filler rows fetched beyond the number the base rows are expected to need,
// because some may come back empty.
const FILLER_BUFFER = 2;

/**
 * Extra rows that pad the fixed discovery rows to MIN_BROWSE_ROWS. They do not
 * depend on the fixed rows, so callers start them beside the fixed read.
 */
export function fetchFixedRowExtras(
  supabase: ServerSupabaseClient,
  basePath = "/browse",
): Promise<BrowseSection[]> {
  return fetchFillerSections(supabase, buildFillerRowSpecs(null, { includeCore: false }), basePath);
}

/**
 * The default Browse page's rows. A tenant with meaningful saved preferences
 * gets rows built from them, padded to MIN_BROWSE_ROWS with filler rows; a
 * tenant who skipped them, a signed-out visitor, or a tenant whose
 * preferences match nothing gets the fixed rows plus extras. Empty when
 * nothing has apartments, so the caller can fall back to the grid.
 *
 * The base rows and the filler rows load together. The filler needs only the
 * row ids and count, so it never waits for the base. Only if the first batch
 * leaves the page short does a second batch run.
 */
export async function loadDiscoverySections(
  supabase: ServerSupabaseClient,
  prefs: TenantPreferences | null | undefined,
  basePath = "/browse",
): Promise<BrowseSection[]> {
  if (prefs && hasMeaningfulPreferences(prefs)) {
    const expected = 1 + buildPersonalizedRowSpecs(prefs).length;
    const fillerSpecs = buildFillerRowSpecs(prefs, { includeCore: true });
    const firstBatch = expected >= MIN_BROWSE_ROWS ? 0 : MIN_BROWSE_ROWS - expected + FILLER_BUFFER;

    const [personalized, filler] = await Promise.all([
      fetchPersonalizedSections(supabase, prefs, basePath),
      fetchFillerSections(supabase, fillerSpecs.slice(0, firstBatch), basePath),
    ]);

    if (personalized.length > 0) {
      const rows = selectBrowseRows(personalized, filler);
      const rest = fillerSpecs.slice(firstBatch);
      if (rows.length >= MIN_BROWSE_ROWS || rest.length === 0) return rows;

      const more = await fetchFillerSections(supabase, rest, basePath);
      return selectBrowseRows(personalized, [...filler, ...more]);
    }
  }

  const [fixed, extras] = await Promise.all([
    fetchDiscoverySections(supabase, basePath),
    fetchFixedRowExtras(supabase, basePath),
  ]);
  return fixed.length > 0 ? selectBrowseRows(fixed, extras) : [];
}
