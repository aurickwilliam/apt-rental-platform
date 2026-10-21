import { Skeleton } from "@heroui/react";

function CardSkeleton() {
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-divider bg-surface">
      <Skeleton className="aspect-square h-auto w-full rounded-none" />
      <div className="flex flex-col gap-2 p-2">
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-4 w-10 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function BrowseCardsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      aria-label="Loading apartments"
      role="status"
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <section aria-hidden="true" className="min-w-0">
      <Skeleton className="mb-2 h-6 w-48 rounded-md sm:mb-3" />
      <div className="flex gap-3 overflow-hidden pb-2 sm:gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="w-44 shrink-0 sm:w-56">
            <CardSkeleton />
          </div>
        ))}
      </div>
    </section>
  );
}

export function BrowseSectionsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div aria-label="Loading curated sections" role="status" className="flex min-w-0 flex-col gap-6 sm:gap-8">
      {Array.from({ length: count }, (_, i) => (
        <SectionSkeleton key={i} />
      ))}
    </div>
  );
}

// Filter sidebar placeholder; also the fallback while the filter chunk loads.
export function FilterPanelSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-xl border bg-surface p-4 w-full">
      <Skeleton className="h-10 w-full rounded-full" />
      <Skeleton className="mt-2 h-10 w-full rounded-full" />
      <Skeleton className="mt-5 h-5 w-28 rounded-md" />
      <Skeleton className="mt-3 h-4 w-full rounded-md" />
      <Skeleton className="mt-2 h-4 w-5/6 rounded-md" />
      <Skeleton className="mt-2 h-4 w-4/6 rounded-md" />
      <Skeleton className="mt-5 h-5 w-24 rounded-md" />
      <Skeleton className="mt-3 h-9 w-full rounded-lg" />
    </div>
  );
}

// Streamed fallback for the filter rail: keeps the sidebar width and the
// mobile result-count row stable until the shared result query settles.
export function BrowseFilterRailSkeleton({
  stickyClassName = "md:top-20 md:max-h-[calc(100dvh-6rem)]",
}: {
  stickyClassName?: string;
}) {
  return (
    <>
      <div className="md:hidden mb-3 flex items-center justify-between gap-2" aria-hidden="true">
        <Skeleton className="h-5 w-28 rounded-md" />
      </div>
      <aside className={`hidden md:block md:w-64 lg:w-72 xl:w-80 shrink-0 self-start md:sticky md:overflow-y-auto ${stickyClassName}`}>
        <FilterPanelSkeleton />
      </aside>
    </>
  );
}

// The mobile filter entry is only usable once its count is known; this
// placeholder keeps the search row height without claiming a result count.
export function MobileFilterEntrySkeleton() {
  return <Skeleton className="size-11 shrink-0 rounded-full md:hidden" aria-hidden="true" />;
}

// Loading state for a searched / filtered / paged browse: the results page
// shows the filter sidebar and a flat grid, not curated section rows.
export function BrowseResultsPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6" aria-busy="true">
      <Skeleton className="h-12 w-full rounded-full md:hidden" />
      <Skeleton className="hidden h-52 w-full rounded-xl md:block" />

      <div className="mt-4 flex flex-col gap-4 md:flex-row">
        <aside className="hidden shrink-0 self-start md:block md:w-64 lg:w-72 xl:w-80">
          <FilterPanelSkeleton />
        </aside>
        <div className="w-full min-w-0 flex-1">
          <Skeleton className="mb-3 h-5 w-24 rounded-md md:hidden" />
          <BrowseCardsSkeleton />
        </div>
      </div>
    </div>
  );
}

// Full-page loading state for /browse and /tenant/browse: mirrors discovery
// mode (compact search on mobile, hero on desktop, full-width section rows,
// no filter sidebar) since that is the landing users watch load.
export default function BrowsePageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6" aria-busy="true">
      <Skeleton className="h-12 w-full rounded-full md:hidden" />
      <Skeleton className="hidden h-52 w-full rounded-xl md:block" />

      <div className="mt-4 flex flex-col gap-4 md:flex-row">
        <div className="w-full min-w-0 flex-1">
          <BrowseSectionsSkeleton />
        </div>
      </div>
    </div>
  );
}
