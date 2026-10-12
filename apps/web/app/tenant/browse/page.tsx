import { redirect } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@repo/supabase/server";

import BrowseFilters from "@/app/browse/components/BrowseFilters";
import RenderApartments from "@/app/browse/components/RenderApartments";
import SearchContainer from "@/app/browse/components/SearchContainer";
import { fetchBrowseResults } from "@/app/browse/lib/fetch-browse-results";

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
    .select("id, roles")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!(profile as unknown as { roles: string[] } | null)?.roles.includes("tenant")) {
    redirect("/browse");
  }

  const params = await searchParams;
  const { apartments: mapped, page, totalCount, pageSize } =
    await fetchBrowseResults(supabase, params);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <Suspense>
        <SearchContainer basePath="/tenant/browse" />
      </Suspense>
      <div className="mt-4 flex flex-col md:flex-row gap-4">
        <Suspense>
          <BrowseFilters
            resultCount={totalCount}
            basePath="/tenant/browse"
            stickyClassName="md:top-4 md:max-h-[calc(100dvh-2rem)]"
          />
        </Suspense>
        <div className="w-full min-w-0 flex-1 rounded-lg p-0">
          <Suspense>
            <RenderApartments
              apartment={mapped}
              page={page}
              totalCount={totalCount}
              pageSize={pageSize}
              basePath="/tenant/browse"
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
