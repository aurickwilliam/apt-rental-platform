import { createClient } from "@repo/supabase/server";

import type { TenantPreferences } from "@/lib/tenant-preferences";

import { fetchBrowseResults } from "../lib/fetch-browse-results";
import { fetchDiscoverySections } from "../lib/fetch-browse-sections";
import { buildRecommendedSection } from "../lib/fetch-recommended";
import BrowseFilters from "./BrowseFilters";
import BrowseSectionsList from "./BrowseSectionsList";
import RenderApartments from "./RenderApartments";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface BrowseDiscoveryContentProps {
  supabase: ServerSupabaseClient;
  basePath?: string;
  /** Portal tenant preferences; re-ranks the fetched pool only. */
  preferences?: TenantPreferences | null;
}

/**
 * The slow half of Browse: curated discovery sections, or the flat grid when
 * the sections RPC returns nothing. Kept as its own async server component so
 * the authorized page shell can render while these reads are still running.
 * Personalized sections reuse the already-fetched pool (no extra query).
 */
export default async function BrowseDiscoveryContent({
  supabase,
  basePath = "/browse",
  preferences = null,
}: BrowseDiscoveryContentProps) {
  const sections = await fetchDiscoverySections(supabase, basePath);
  const recommended = buildRecommendedSection(sections, preferences);
  const sectionsWithRecommended = recommended ? [recommended, ...sections] : sections;

  if (sectionsWithRecommended.length > 0) {
    return <BrowseSectionsList sections={sectionsWithRecommended} basePath={basePath} />;
  }

  // Empty/failed sections fall back to the filtered grid, exactly like the
  // eager page did. The search row's filter button already covers phones.
  const { apartments, page, totalCount, pageSize } = await fetchBrowseResults(supabase, {});
  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <BrowseFilters resultCount={totalCount} basePath={basePath} stickyClassName="md:top-4 md:max-h-[calc(100dvh-2rem)]" />
      <div className="w-full min-w-0 flex-1 rounded-lg p-0">
        <RenderApartments
          apartment={apartments}
          page={page}
          totalCount={totalCount}
          pageSize={pageSize}
          basePath={basePath}
        />
      </div>
    </div>
  );
}
