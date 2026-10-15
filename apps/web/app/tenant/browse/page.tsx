import { redirect } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@repo/supabase/server";

import BrowseFilters from "@/app/browse/components/BrowseFilters";
import BrowseSectionsList from "@/app/browse/components/BrowseSectionsList";
import { BrowseCardsSkeleton, BrowseSectionsSkeleton } from "@/app/browse/components/BrowsePageSkeleton";
import MobileFilterButton from "@/app/browse/components/MobileFilterButton";
import RenderApartments from "@/app/browse/components/RenderApartments";
import SearchContainer from "@/app/browse/components/SearchContainer";
import { fetchBrowseResults } from "@/app/browse/lib/fetch-browse-results";
import { fetchBrowseSections, isDefaultBrowseParams } from "@/app/browse/lib/fetch-browse-sections";
import { buildRecommendedSection } from "@/app/browse/lib/fetch-recommended";
import { parseTenantPreferences } from "@/lib/tenant-preferences";

type PageProps = {
  searchParams: Promise<Record<string, string>>;
};

// Per-request by nature: `searchParams` drives filtering, sorting, and paging.
// See the note in app/browse/page.tsx.
export const dynamic = "force-dynamic";

export default async function TenantBrowsePage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("users")
    .select("id, roles, preferences")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!(profile as unknown as { roles: string[] } | null)?.roles.includes("tenant")) {
    redirect("/browse");
  }

  const params = await searchParams;

  // Default state (no search, filters, or paging) shows curated discovery
  // sections. Anything filtered, searched, or paged shows the flat grid.
  // An empty/failed sections RPC falls back to the grid.
  const showSections = isDefaultBrowseParams(params);
  const { sections, totalCount: sectionsTotal } = showSections
    ? await fetchBrowseSections(supabase, "/tenant/browse")
    : { sections: [], totalCount: 0 };
  // Personalization re-ranks the already-fetched pool only. Raw saved
  // budgets are used as-is (never clamped, never turned into filters).
  const recommended = showSections
    ? buildRecommendedSection(
        sections,
        parseTenantPreferences(
          (profile as unknown as { preferences?: unknown } | null)?.preferences ?? null,
        ),
      )
    : null;
  const sectionsWithRecommended = recommended
    ? [recommended, ...sections]
    : sections;
  const useSections = showSections && sectionsWithRecommended.length > 0;

  const { apartments: mapped, page, totalCount, pageSize } = useSections
    ? { apartments: [], page: 1, totalCount: sectionsTotal, pageSize: 0 }
    : await fetchBrowseResults(supabase, params);

  return (
    // overflow-x-clip keeps any inner min-content overflow (e.g. third-party
    // control internals) from widening the page. Unlike hidden it does not
    // create a scroll container, so the sticky filter sidebar keeps working.
    // w-full is load-bearing: this root is a flex item of the tenant
    // layout's flex-column main, where mx-auto alone disables stretch
    // sizing and lets the root balloon to max-w-7xl on narrow screens.
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 overflow-x-clip">
      <Suspense>
        <SearchContainer
          basePath="/tenant/browse"
          filterButton={
            !useSections ? (
              <MobileFilterButton resultCount={totalCount} basePath="/tenant/browse" />
            ) : undefined
          }
        />
      </Suspense>
      <div className="mt-4 flex flex-col md:flex-row gap-4">
        {/* Filters only exist outside discovery mode: text search, See All,
            or any filter switches to the grid, which brings this panel. */}
        {!useSections && (
          <Suspense>
            <BrowseFilters
              resultCount={totalCount}
              basePath="/tenant/browse"
              stickyClassName="md:top-4 md:max-h-[calc(100dvh-2rem)]"
            />
          </Suspense>
        )}
        <div className="w-full min-w-0 flex-1 rounded-lg p-0">
          <Suspense
            fallback={
              useSections ? <BrowseSectionsSkeleton /> : <BrowseCardsSkeleton />
            }
          >
            {useSections ? (
              <BrowseSectionsList sections={sectionsWithRecommended} basePath="/tenant/browse" />
            ) : (
              <RenderApartments
                apartment={mapped}
                page={page}
                totalCount={totalCount}
                pageSize={pageSize}
                basePath="/tenant/browse"
              />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
