import { createClient } from "@repo/supabase/server";
import { BROWSE_ROW_LIMIT } from "@repo/utils";

import { toBrowseApartment, type BrowseApartment, type BrowseApartmentRow } from "./browse-apartment";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;


export interface BrowseSection {
  id: string;
  title: string;
  /** Short supporting copy rendered under the title when present. */
  subtitle?: string | null;
  apartments: BrowseApartment[];
  /** Filtered-grid URL for See All, or null when no filter matches the cohort. */
  seeAllHref: string | null;
}

export interface BrowseSectionsResult {
  sections: BrowseSection[];
  totalCount: number;
}

interface SectionRow extends Omit<BrowseApartmentRow, "monthly_rent"> {
  monthly_rent?: number | null;
}

// Cohort → filtered-grid mapping for See All. Cohorts without a filter
// equivalent (near_you, top_rated, all_results) return null and render no chevron.
function seeAllQuery(sectionId: string): string | null {
  switch (sectionId) {
    case "verified":
      return "verified=1";
    case "budget_low":
      return "price_max=10000";
    case "studio":
      return "apt_types=Studio";
    // Top rated has no match in the drawer: it has no rating filter, and its
    // most-popular sort puts unrated listings first.
    case "spacious":
      return "size_min=60";
    default:
      return null;
  }
}

// Curated discovery sections via the batched get_search_sections RPC (one
// round trip for all cohorts). CAMANAVA covers the same four cities as the
// web location filter. On RPC failure returns no sections so callers fall
// back to the filtered grid.
export async function fetchBrowseSections(
  supabase: ServerSupabaseClient,
  basePath = "/browse",
): Promise<BrowseSectionsResult> {
  const [sections, countRes] = await Promise.all([
    fetchDiscoverySections(supabase, basePath),
    supabase
      .from("apartments")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("is_hidden_by_admin", false)
      .in("status", ["available", "unverified"]),
  ]);

  return { sections, totalCount: countRes.count ?? 0 };
}

/** Discovery renders cohorts, not pagination: don't wait for an unused count. */
export async function fetchDiscoverySections(
  supabase: ServerSupabaseClient,
  basePath = "/browse",
): Promise<BrowseSection[]> {
  const sectionsRes = await supabase.rpc("get_search_sections", {
    p_city: "CAMANAVA",
    p_limit: BROWSE_ROW_LIMIT,
  });

  if (sectionsRes.error) {
    console.error(sectionsRes.error);
    return [];
  }

  const raw = (sectionsRes.data as { sections?: Array<{ id: string; title: string; apartments?: SectionRow[] }> } | null)?.sections ?? [];

  const sections: BrowseSection[] = raw
    .map((section) => {
      const query = seeAllQuery(section.id);
      return {
        id: section.id,
        title: section.title,
        apartments: (section.apartments ?? []).map((apt) =>
          toBrowseApartment({ ...apt, monthly_rent: apt.monthly_rent ?? 0 }),
        ),
        seeAllHref: query ? `${basePath}?${query}` : null,
      };
    })
    .filter((section) => section.apartments.length > 0);

  return sections;
}
