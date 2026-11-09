import { supabase } from "@repo/supabase";
import {
  BROWSE_ROW_LIMIT,
  MIN_BROWSE_ROWS,
  buildFillerRowSpecs,
  buildPersonalizedRowSpecs,
  hasMeaningfulPreferences,
  selectBrowseRows,
  type BrowseRowPreferences,
  type BrowseRowSpec,
} from "@repo/utils";

import type { ApartmentCardProps } from "@/components/cards/ApartmentCard";
import { transformApartments } from "./sectionCards";
import { fetchBrowseRowCards, fetchRecommendedCards } from "./browseRowsService";

/** One row on the Explore tab. Rows built from a spec carry it for See All. */
export interface DiscoverySection {
  id: string;
  title: string;
  subtitle?: string;
  apartments: ApartmentCardProps[];
  spec?: BrowseRowSpec;
}

export const RECOMMENDED_SECTION_ID = "for_you";
const RECOMMENDED_SECTION_TITLE = "Recommended for You";
const RECOMMENDED_SECTION_SUBTITLE = "Based on your rental preferences.";

// Filler rows fetched beyond the number the base rows are expected to need,
// because some may come back empty.
const FILLER_BUFFER = 2;

const DEFAULT_CITY = "CAMANAVA";

interface DiscoveryRequest {
  selectedCity: string;
  committedSearch: string;
  preferences: BrowseRowPreferences | null;
  signal?: AbortSignal;
}

function withApartments(sections: (DiscoverySection | null)[]): DiscoverySection[] {
  return sections.filter(
    (section): section is DiscoverySection => section !== null && section.apartments.length > 0,
  );
}

// A failed row is dropped without hiding the others.
async function fetchSpecSection(spec: BrowseRowSpec, signal?: AbortSignal): Promise<DiscoverySection | null> {
  try {
    const apartments = await fetchBrowseRowCards(spec, { signal });
    return { id: spec.id, title: spec.title, subtitle: spec.subtitle, apartments, spec };
  } catch (error) {
    console.error(`Browse row "${spec.id}" failed:`, error);
    return null;
  }
}

async function fetchSpecSections(specs: BrowseRowSpec[], signal?: AbortSignal): Promise<DiscoverySection[]> {
  return withApartments(await Promise.all(specs.map((spec) => fetchSpecSection(spec, signal))));
}

async function fetchRecommendedSection(
  prefs: BrowseRowPreferences,
  signal?: AbortSignal,
): Promise<DiscoverySection | null> {
  try {
    const apartments = await fetchRecommendedCards(prefs, BROWSE_ROW_LIMIT, signal);
    return {
      id: RECOMMENDED_SECTION_ID,
      title: RECOMMENDED_SECTION_TITLE,
      subtitle: RECOMMENDED_SECTION_SUBTITLE,
      apartments,
    };
  } catch (error) {
    console.error("Recommended row failed:", error);
    return null;
  }
}

async function fetchPersonalizedSections(
  prefs: BrowseRowPreferences,
  signal?: AbortSignal,
): Promise<DiscoverySection[]> {
  return withApartments(
    await Promise.all([
      fetchRecommendedSection(prefs, signal),
      ...buildPersonalizedRowSpecs(prefs).map((spec) => fetchSpecSection(spec, signal)),
    ]),
  );
}

/** The fixed rows: one batched RPC. Throws when the RPC fails so the tab can show the error. */
export async function fetchFixedSections({
  selectedCity,
  committedSearch,
  signal,
}: Omit<DiscoveryRequest, "preferences">): Promise<DiscoverySection[]> {
  let request = supabase.rpc("get_search_sections", {
    p_city: selectedCity,
    p_search: committedSearch || undefined,
    p_limit: BROWSE_ROW_LIMIT,
  });
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;

  const raw = (data as { sections?: { id: string; title: string; apartments?: unknown[] }[] } | null)?.sections ?? [];
  return raw.map((section) => ({
    id: section.id,
    title:
      section.id === "verified" && selectedCity !== DEFAULT_CITY
        ? `Verified in ${selectedCity}`
        : section.id === "near_you" && selectedCity !== DEFAULT_CITY
          ? `Near ${selectedCity}`
          : section.title,
    apartments: transformApartments(section.apartments ?? []),
  }));
}

/**
 * The Explore tab's default rows. A tenant with meaningful saved preferences
 * gets rows built from them, padded to MIN_BROWSE_ROWS with filler rows; a
 * tenant who skipped them, or whose preferences match nothing, gets the fixed
 * rows plus extras. Any other city or search shows just the fixed rows.
 *
 * The base rows and the filler rows load together. The filler needs only the
 * row ids and count, so it never waits for the base. Only if the first batch
 * leaves the page short does a second batch run.
 */
export async function loadDiscoverySections(request: DiscoveryRequest): Promise<DiscoverySection[]> {
  const { selectedCity, committedSearch, preferences, signal } = request;
  const isDefault = selectedCity === DEFAULT_CITY && committedSearch.trim() === "";
  if (!isDefault) return fetchFixedSections(request);

  if (preferences && hasMeaningfulPreferences(preferences)) {
    const expected = 1 + buildPersonalizedRowSpecs(preferences).length;
    const fillerSpecs = buildFillerRowSpecs(preferences, { includeCore: true });
    const firstBatch = expected >= MIN_BROWSE_ROWS ? 0 : MIN_BROWSE_ROWS - expected + FILLER_BUFFER;

    const [personalized, filler] = await Promise.all([
      fetchPersonalizedSections(preferences, signal),
      fetchSpecSections(fillerSpecs.slice(0, firstBatch), signal),
    ]);

    if (personalized.length > 0) {
      const rows = selectBrowseRows(personalized, filler);
      const rest = fillerSpecs.slice(firstBatch);
      if (rows.length >= MIN_BROWSE_ROWS || rest.length === 0) return rows;

      const more = await fetchSpecSections(rest, signal);
      return selectBrowseRows(personalized, [...filler, ...more]);
    }
  }

  const [fixed, extras] = await Promise.all([
    fetchFixedSections(request),
    fetchSpecSections(buildFillerRowSpecs(null, { includeCore: false }), signal),
  ]);
  return fixed.length > 0 ? selectBrowseRows(fixed, extras) : [];
}
