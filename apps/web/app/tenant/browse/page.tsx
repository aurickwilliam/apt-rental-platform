import { Suspense } from "react";
import { requirePortalViewer } from "@/lib/server-identity";

import { createClient } from "@repo/supabase/server";

import {
  BrowseResultsGridSkeleton,
  BrowseSectionsSkeleton,
  FilterEntrySkeleton,
} from "@/app/browse/components/BrowsePageSkeleton";
import BrowseDiscoveryContent from "@/app/browse/components/BrowseDiscoveryContent";
import BrowseResultsBar from "@/app/browse/components/BrowseResultsBar";
import FilterDrawerButton from "@/app/browse/components/FilterDrawerButton";
import BrowseShell from "@/app/browse/components/BrowseShell";
import RenderApartments from "@/app/browse/components/RenderApartments";
import {
  loadBrowseResults,
  type BrowseResults,
} from "@/app/browse/lib/fetch-browse-results";
import { isDefaultBrowseParams } from "@/app/browse/lib/browse-params";
import { parseTenantPreferences } from "@/lib/tenant-preferences";

type PageProps = {
  searchParams: Promise<Record<string, string>>;
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

const BASE_PATH = "/tenant/browse";

// Per-request by nature: `searchParams` drives filtering, sorting, and paging.
// See the note in app/browse/page.tsx.
export const dynamic = "force-dynamic";

export default async function TenantBrowsePage({ searchParams }: PageProps) {
  const { supabase, profile } = await requirePortalViewer("tenant");

  const params = await searchParams;

  // Default state (no search, filters, or paging) shows curated discovery
  // sections. Anything filtered, searched, or paged shows the flat grid.
  if (isDefaultBrowseParams(params)) {
    // The shell and search controls no longer wait on the discovery reads:
    // sections (or their grid fallback) stream into the boundary below.
    return (
      <BrowseShell
        basePath={BASE_PATH}
        // No total is loaded in discovery, so the drawer omits the count.
        filterButton={<FilterDrawerButton basePath={BASE_PATH} />}
        fallback={
          <div className="w-full min-w-0 flex-1 rounded-lg p-0">
            <BrowseSectionsSkeleton />
          </div>
        }
        fullWidth
      >
        <BrowseDiscoveryContent
          supabase={supabase}
          basePath={BASE_PATH}
          preferences={parseTenantPreferences(
            (profile as unknown as { preferences?: unknown } | null)?.preferences ?? null,
          )}
        />
      </BrowseShell>
    );
  }

  // Filtered/search/paged state: the filter entry and grid both need the same
  // result count. React's request-scoped cache lets each stream
  // independently while the shared query runs once.
  return (
    <BrowseShell
      basePath={BASE_PATH}
      filterButton={
        <Suspense fallback={<FilterEntrySkeleton />}>
          <BrowseFilterEntry supabase={supabase} params={params} />
        </Suspense>
      }
      fallback={<BrowseResultsGridSkeleton />}
      fullWidth
    >
      <BrowseGridContent supabase={supabase} params={params} />
    </BrowseShell>
  );
}

async function BrowseFilterEntry({
  supabase,
  params,
}: {
  supabase: ServerSupabaseClient;
  params: Record<string, string>;
}) {
  const { totalCount } = await loadBrowseResults(supabase, params);
  return <FilterDrawerButton resultCount={totalCount} basePath={BASE_PATH} />;
}

async function BrowseGridContent({
  supabase,
  params,
}: {
  supabase: ServerSupabaseClient;
  params: Record<string, string>;
}) {
  const results: BrowseResults = await loadBrowseResults(supabase, params);
  return (
    <>
      <BrowseResultsBar resultCount={results.totalCount} basePath={BASE_PATH} />
      <RenderApartments
        apartment={results.apartments}
        page={results.page}
        totalCount={results.totalCount}
        pageSize={results.pageSize}
        basePath={BASE_PATH}
      />
    </>
  );
}
