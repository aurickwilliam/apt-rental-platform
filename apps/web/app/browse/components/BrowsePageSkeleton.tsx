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

function SidebarSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="hidden w-72 shrink-0 self-start rounded-xl border border-divider bg-surface p-4 md:block lg:w-80"
    >
      <Skeleton className="h-10 w-full rounded-full" />
      <div className="mt-4 flex flex-col gap-2.5">
        <Skeleton className="h-5 w-24 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-2/3 rounded-md" />
        <Skeleton className="mt-2 h-5 w-20 rounded-md" />
        <Skeleton className="h-8 w-full rounded-lg" />
        <Skeleton className="h-5 w-28 rounded-md" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Full-page loading state for /browse and /tenant/browse: mirrors the page
// anatomy (compact search on mobile, hero on desktop, sidebar + cards).
export default function BrowsePageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6" aria-busy="true">
      <Skeleton className="h-12 w-full rounded-full md:hidden" />
      <Skeleton className="hidden h-52 w-full rounded-xl md:block" />

      <div className="mt-4 flex flex-col gap-4 md:flex-row">
        <div className="mb-3 md:hidden">
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
        <SidebarSkeleton />
        <div className="w-full min-w-0 flex-1">
          <BrowseCardsSkeleton />
        </div>
      </div>
    </div>
  );
}
