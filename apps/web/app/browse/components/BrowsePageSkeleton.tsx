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
