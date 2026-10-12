import { createClient } from "@repo/supabase/server";

import type { BrowseApartment } from "./fetch-browse-results";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

const SECTION_LIMIT = 8;
const DEFAULT_THUMBNAIL = "/default/default-thumbnail.jpeg";

export interface BrowseSection {
  id: string;
  title: string;
  apartments: BrowseApartment[];
  /** Filtered-grid URL for See All, or null when no filter matches the cohort. */
  seeAllHref: string | null;
}

export interface BrowseSectionsResult {
  sections: BrowseSection[];
  totalCount: number;
}

interface SectionRow {
  id: string;
  name: string;
  barangay?: string | null;
  city?: string | null;
  monthly_rent?: number | null;
  average_rating?: number | null;
  is_verified?: boolean | null;
  apartment_images?: Array<{
    url?: string | null;
    is_cover?: boolean | null;
  }> | null;
}

// Default browse = no search text, no filters, first page. Mirrors the mobile
// search tab, which only shows curated sections in this state.
const FILTER_KEYS = [
  "search",
  "locations",
  "price_min",
  "price_max",
  "apt_types",
  "bedrooms",
  "bathrooms",
  "size_min",
  "size_max",
  "furnishing",
  "floor_level",
  "lease",
  "amenities",
  "sort",
  "verified",
] as const;

export function isDefaultBrowseParams(params: Record<string, string>): boolean {
  if (params.page && params.page !== "1") return false;
  return !FILTER_KEYS.some((key) => {
    const value = params[key];
    return value != null && value !== "";
  });
}

// Cohort → filtered-grid mapping for See All. Cohorts without a filter
// equivalent (near_you, all_results) return null and render no chevron.
function seeAllQuery(sectionId: string): string | null {
  switch (sectionId) {
    case "verified":
      return "verified=1";
    case "budget_low":
      return "price_max=10000";
    case "studio":
      return "apt_types=Studio";
    case "top_rated":
      return "sort=most_popular";
    case "spacious":
      return "size_min=60";
    default:
      return null;
  }
}

function mapRow(apt: SectionRow): BrowseApartment {
  const images = apt.apartment_images ?? [];
  return {
    id: apt.id,
    name: apt.name,
    location: apt.city ?? "",
    price: apt.monthly_rent ?? 0,
    rating: apt.average_rating ?? 0,
    isVerified: apt.is_verified ?? false,
    image:
      images.find((img) => img.is_cover)?.url ??
      images[0]?.url ??
      DEFAULT_THUMBNAIL,
  };
}

// Curated discovery sections via the batched get_search_sections RPC (one
// round trip for all cohorts). CAMANAVA covers the same four cities as the
// web location filter. On RPC failure returns no sections so callers fall
// back to the filtered grid.
export async function fetchBrowseSections(
  supabase: ServerSupabaseClient,
  basePath = "/browse",
): Promise<BrowseSectionsResult> {
  const [sectionsRes, countRes] = await Promise.all([
    supabase.rpc("get_search_sections", {
      p_city: "CAMANAVA",
      p_limit: SECTION_LIMIT,
    }),
    supabase
      .from("apartments")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("is_hidden_by_admin", false),
  ]);

  const totalCount = countRes.count ?? 0;

  if (sectionsRes.error) {
    console.error(sectionsRes.error);
    return { sections: [], totalCount };
  }

  const raw = (sectionsRes.data as { sections?: Array<{ id: string; title: string; apartments?: SectionRow[] }> } | null)?.sections ?? [];

  const sections: BrowseSection[] = raw
    .map((section) => {
      const query = seeAllQuery(section.id);
      return {
        id: section.id,
        title: section.title,
        apartments: (section.apartments ?? []).map(mapRow),
        seeAllHref: query ? `${basePath}?${query}` : null,
      };
    })
    .filter((section) => section.apartments.length > 0);

  return { sections, totalCount };
}
