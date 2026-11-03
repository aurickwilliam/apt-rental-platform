import { createClient } from "@repo/supabase/server";

import type { TenantPreferences } from "@/lib/tenant-preferences";

import { fetchBrowseResults } from "../lib/fetch-browse-results";
import { loadDiscoverySections } from "../lib/fetch-browse-discovery";
import BrowseResultsBar from "./BrowseResultsBar";
import BrowseSectionsList from "./BrowseSectionsList";
import RenderApartments from "./RenderApartments";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface BrowseDiscoveryContentProps {
  supabase: ServerSupabaseClient;
  basePath?: string;
  /** Portal tenant preferences; null or skipped shows the fixed rows. */
  preferences?: TenantPreferences | null;
}

/**
 * The slow half of Browse: rows built from the tenant's saved preferences, or
 * the fixed discovery rows when there are none, or the flat grid when both
 * come back empty. Kept as its own async server component so the authorized
 * page shell can render while these reads are still running.
 */
export default async function BrowseDiscoveryContent({
  supabase,
  basePath = "/browse",
  preferences = null,
}: BrowseDiscoveryContentProps) {
  const sections = await loadDiscoverySections(supabase, preferences, basePath);

  if (sections.length > 0) {
    return <BrowseSectionsList sections={sections} basePath={basePath} />;
  }

  // Empty/failed sections fall back to the filtered grid, exactly like the
  // eager page did. Filters stay reachable through the search row's filter button.
  const { apartments, page, totalCount, pageSize } = await fetchBrowseResults(supabase, {});
  return (
    <>
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
