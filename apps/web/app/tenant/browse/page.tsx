import { Suspense } from "react";
import { requirePortalViewer } from "@/lib/server-identity";

import { createClient } from "@repo/supabase/server";

import {
  BrowseCardsSkeleton,
  BrowseFilterRailSkeleton,
  BrowseSectionsSkeleton,
  MobileFilterEntrySkeleton,
} from "@/app/browse/components/BrowsePageSkeleton";
import BrowseDiscoveryContent from "@/app/browse/components/BrowseDiscoveryContent";
import BrowseFilters from "@/app/browse/components/BrowseFilters";
import BrowseShell from "@/app/browse/components/BrowseShell";
import MobileFilterButton from "@/app/browse/components/MobileFilterButton";
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
const FILTER_STICKY_CLASS = "md:top-4 md:max-h-[calc(100dvh-2rem)]";

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

  // Filtered/search/paged state: the rail, mobile filter entry and grid all
  // need the same result count. React's request-scoped cache lets each stream
  // independently while the shared query runs once.
  return (
    <BrowseShell
      basePath={BASE_PATH}
      filterButton={
        <Suspense fallback={<MobileFilterEntrySkeleton />}>
          <BrowseMobileFilterEntry supabase={supabase} params={params} />
        </Suspense>
      }
      filters={
        <Suspense
          fallback={<BrowseFilterRailSkeleton stickyClassName={FILTER_STICKY_CLASS} />}
        >
          <BrowseFilterRail supabase={supabase} params={params} />
        </Suspense>
      }
      fallback={<BrowseCardsSkeleton />}
      fullWidth
    >
      <BrowseGridContent supabase={supabase} params={params} />
    </BrowseShell>
  );
}

async function BrowseMobileFilterEntry({
  supabase,
  params,
}: {
  supabase: ServerSupabaseClient;
  params: Record<string, string>;
}) {
  const { totalCount } = await loadBrowseResults(supabase, params);
  return <MobileFilterButton resultCount={totalCount} basePath={BASE_PATH} />;
}

async function BrowseFilterRail({
  supabase,
  params,
}: {
  supabase: ServerSupabaseClient;
  params: Record<string, string>;
}) {
  const { totalCount } = await loadBrowseResults(supabase, params);
  return (
    <BrowseFilters
      resultCount={totalCount}
      basePath={BASE_PATH}
      stickyClassName={FILTER_STICKY_CLASS}
    />
  );
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
    <RenderApartments
      apartment={results.apartments}
      page={results.page}
      totalCount={results.totalCount}
      pageSize={results.pageSize}
      basePath={BASE_PATH}
    />
  );
}
