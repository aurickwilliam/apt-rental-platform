import { createClient } from "@repo/supabase/server";

import { fetchBrowseResults } from "../lib/fetch-browse-results";
import { fetchDiscoverySections } from "../lib/fetch-browse-sections";
import { loadRecommendedSection } from "../lib/fetch-recommended";
import type { RecommendationClient } from "@/lib/recommendations";
import BrowseResultsBar from "./BrowseResultsBar";
import BrowseSectionsList from "./BrowseSectionsList";
import RenderApartments from "./RenderApartments";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface BrowseDiscoveryContentProps {
  supabase: ServerSupabaseClient;
  basePath?: string;
  /** Original saved blob, not default-filled parser values. */
  preferences?: unknown;
}

/**
 * The slow half of Browse: curated discovery sections, or the flat grid when
 * the sections RPC returns nothing. Kept as its own async server component so
 * the authorized page shell can render while these reads are still running.
 * Personalized and generic reads run independently, in parallel.
 */
export default async function BrowseDiscoveryContent({
  supabase,
  basePath = "/browse",
  preferences = null,
}: BrowseDiscoveryContentProps) {
  const [sections, recommended] = await Promise.all([
    fetchDiscoverySections(supabase, basePath),
    loadRecommendedSection(supabase as unknown as RecommendationClient, preferences),
  ]);
  const sectionsWithRecommended = recommended ? [recommended, ...sections] : sections;

  if (sections.length > 0) {
    // Retire previews when their ranking/reason snapshot changes without
    // serializing the tenant's full saved preference blob into a React key.
    return <BrowseSectionsList
      key={JSON.stringify([recommended?.recommendationStatus, recommended?.recommendationReasons])}
      sections={sectionsWithRecommended}
      basePath={basePath}
    />;
  }

  // Empty/failed sections fall back to the filtered grid, exactly like the
  // eager page did. Filters stay reachable through the search row's filter button.
  const { apartments, page, totalCount, pageSize } = await fetchBrowseResults(supabase, {});
  return (
    <>
      {recommended ? <BrowseSectionsList sections={[recommended]} basePath={basePath} /> : null}
      <BrowseResultsBar resultCount={totalCount} basePath={basePath} />
      <RenderApartments
        apartment={apartments}
        page={page}
        totalCount={totalCount}
        pageSize={pageSize}
        basePath={basePath}
      />
    </>
  );
}
