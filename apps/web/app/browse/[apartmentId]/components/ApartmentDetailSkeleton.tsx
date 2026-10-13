import { Skeleton } from "@heroui/react";

function SpecRowSkeleton() {
  return (
    <div className="flex gap-2 items-center min-w-0">
      <Skeleton className="size-6 rounded-md shrink-0" />
      <Skeleton className="h-4 flex-1 rounded-md" />
    </div>
  );
}

function MiniCardSkeleton() {
  return (
    <div className="w-44 shrink-0 sm:w-56">
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
    </div>
  );
}

// Loading state for the apartment detail page: mirrors ApartmentDetailView
// (top bar, gallery, content + price rail, related row) so the shimmer
// resolves into the real layout instead of the browse card grid.
export default function ApartmentDetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading apartment details"
      aria-busy="true"
      className="max-w-7xl mx-auto p-4 sm:p-6 w-full min-w-0 overflow-x-clip"
    >
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-10 w-24 rounded-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="size-10 rounded-xl" />
          <Skeleton className="size-10 rounded-xl" />
        </div>
      </div>

      <div className="my-4">
        <div className="relative flex h-60 sm:h-96 lg:h-128 w-full gap-2 sm:gap-5 min-w-0">
          <Skeleton className="relative h-full w-2/3 rounded-2xl" />
          <div className="flex w-1/3 flex-col gap-2 sm:gap-5 min-w-0">
            <Skeleton className="min-h-0 flex-1 rounded-2xl" />
            <Skeleton className="min-h-0 flex-1 rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-5 min-w-0">
        <div className="w-full lg:w-2/3 min-w-0">
          <div className="min-w-0">
            <Skeleton className="h-8 w-2/3 rounded-lg" />
            <Skeleton className="mt-2 h-4 w-full rounded-md" />
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 sm:gap-6 mt-6 min-w-0">
            {Array.from({ length: 8 }, (_, i) => (
              <SpecRowSkeleton key={i} />
            ))}
          </div>

          <Skeleton className="my-6 sm:my-8 h-px w-full rounded-none" />

          <div>
            <Skeleton className="mb-2 h-5 w-32 rounded-md" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>
          </div>

          <Skeleton className="my-6 sm:my-8 h-px w-full rounded-none" />

          <div>
            <Skeleton className="mb-4 h-5 w-32 rounded-md" />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 min-w-0">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center gap-2 min-w-0">
                  <Skeleton className="size-5 rounded-md shrink-0" />
                  <Skeleton className="h-4 flex-1 rounded-md" />
                </div>
              ))}
            </div>
          </div>

          <Skeleton className="my-6 sm:my-8 h-px w-full rounded-none" />

          <div>
            <Skeleton className="mb-2 h-5 w-32 rounded-md" />
            <Skeleton className="h-64 sm:h-80 w-full rounded-lg" />
          </div>

          <Skeleton className="my-6 sm:my-8 h-px w-full rounded-none" />

          <div>
            <div className="flex items-center justify-between mb-5">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex gap-2 items-center min-w-0">
                  <Skeleton className="h-4 w-8 rounded-md shrink-0" />
                  <Skeleton className="h-3 flex-1 min-w-0 rounded-full" />
                  <Skeleton className="h-4 w-16 rounded-md shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/3 min-w-0 flex flex-col gap-4 sm:gap-5">
          <div className="rounded-xl border border-divider p-4 flex flex-col gap-3">
            <Skeleton className="h-8 w-1/2 rounded-lg" />
            <div className="flex flex-col gap-3 rounded-lg p-4 bg-muted">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>
            <Skeleton className="h-10 w-full rounded-full" />
            <Skeleton className="h-10 w-full rounded-full" />
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
        </div>
      </div>

      <div className="w-full mt-10">
        <Skeleton className="h-7 w-56 rounded-md" />
        <div className="mt-4 flex gap-3 overflow-hidden pb-4">
          {Array.from({ length: 4 }, (_, i) => (
            <MiniCardSkeleton key={i} />
          ))}
        </div>
      </div>

      <div className="h-24 lg:hidden" aria-hidden="true" />
    </div>
  );
}
