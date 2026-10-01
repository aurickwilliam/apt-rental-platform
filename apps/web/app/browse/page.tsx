import { Suspense } from "react";
import { createClient } from "@repo/supabase/server";
import FilterContainer from "./components/FilterContainer";
import RenderApartments from "./components/RenderApartments";
import SearchContainer from "./components/SearchContainer";
import { fetchBrowseResults } from "./lib/fetch-browse-results";

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

  const { apartments: mapped, page, totalCount, pageSize } =
    await fetchBrowseResults(supabase, params);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <Suspense>
        <SearchContainer />
      </Suspense>
      <div className="mt-4 flex flex-col md:flex-row gap-3">
        <Suspense>
          <div className="md:w-1/4 self-start">
            <FilterContainer resultCount={totalCount} />
          </div>
        </Suspense>
        <div className="w-full md:w-3/4  rounded-lg p-0">
          <Suspense>
            <RenderApartments
              apartment={mapped}
              page={page}
              totalCount={totalCount}
              pageSize={pageSize}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
