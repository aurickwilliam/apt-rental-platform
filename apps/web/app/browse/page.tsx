import { Suspense } from "react";
import { createClient } from "@repo/supabase/server";
import BrowseFilters from "./components/BrowseFilters";
import BrowseSectionsList from "./components/BrowseSectionsList";
import RenderApartments from "./components/RenderApartments";
import SearchContainer from "./components/SearchContainer";
import { fetchBrowseResults } from "./lib/fetch-browse-results";
import { fetchBrowseSections, isDefaultBrowseParams } from "./lib/fetch-browse-sections";

type PageProps = {
  searchParams: Promise<Record<string, string>>;
};

// This route is inherently per-request: `searchParams` drives filtering,
// sorting, and paging, so it can never be statically generated. Declaring it
// keeps the route out of the build-time prerender list, where rendering it
// could otherwise fail the whole production build.
export const dynamic = "force-dynamic";

export default async function BrowsePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // Default state (no search, filters, or paging) shows curated discovery
  // sections. Anything filtered, searched, or paged shows the flat grid.
  // An empty/failed sections RPC falls back to the grid.
  const showSections = isDefaultBrowseParams(params);
  const { sections, totalCount: sectionsTotal } = showSections
    ? await fetchBrowseSections(supabase, "/browse")
    : { sections: [], totalCount: 0 };
  const useSections = showSections && sections.length > 0;

  const { apartments: mapped, page, totalCount, pageSize } = useSections
    ? { apartments: [], page: 1, totalCount: sectionsTotal, pageSize: 0 }
    : await fetchBrowseResults(supabase, params);

  return (
    // overflow-x-clip keeps any inner min-content overflow (e.g. third-party
    // control internals) from widening the page. Unlike hidden it does not
    // create a scroll container, so the sticky filter sidebar keeps working.
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 overflow-x-clip">
      <Suspense>
        <SearchContainer />
      </Suspense>
      <div className="mt-4 flex flex-col md:flex-row gap-4">
        <Suspense>
          <BrowseFilters resultCount={totalCount} />
        </Suspense>
        <div className="w-full min-w-0 flex-1 rounded-lg p-0">
          <Suspense>
            {useSections ? (
              <BrowseSectionsList sections={sections} />
            ) : (
              <RenderApartments
                apartment={mapped}
                page={page}
                totalCount={totalCount}
                pageSize={pageSize}
              />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
