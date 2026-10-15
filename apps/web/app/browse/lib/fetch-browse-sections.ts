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
  no_bedrooms?: number | null;
  no_bathrooms?: number | null;
  area_sqm?: number | null;
  apartment_images?: Array<{
    url?: string | null;
    url_thumb?: string | null;
    is_cover?: boolean | null;
  }> | null;
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
  const cover = images.find((img) => img.is_cover) ?? images[0];
  return {
    id: apt.id,
    name: apt.name,
    location: [apt.barangay, apt.city].filter((v): v is string => Boolean(v)).join(", "),
    price: apt.monthly_rent ?? 0,
    rating: apt.average_rating ?? 0,
    isVerified: apt.is_verified ?? false,
    // Cards render small: prefer the thumbnail tier, fall back to full-size.
    image: cover?.url_thumb ?? cover?.url ?? DEFAULT_THUMBNAIL,
    bedrooms: apt.no_bedrooms ?? undefined,
    bathrooms: apt.no_bathrooms ?? undefined,
    areaSqm: apt.area_sqm ?? undefined,
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
      .eq("is_hidden_by_admin", false)
      .in("status", ["available", "unverified"]),
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
