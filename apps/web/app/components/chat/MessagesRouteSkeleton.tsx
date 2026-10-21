import { Skeleton } from "@heroui/react";

/**
 * Shared Messages frame used by both portals. The same component is the
 * route-level loading state and the page's in-page Suspense fallback, so a
 * navigation never swaps one skeleton for a visibly different one.
 *
 * Mirrors the real master-detail layout: contact list on mobile/tablet and
 * both panes from `lg` up. It contains no private data.
 */
export default function MessagesRouteSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading messages"
      className="flex h-[calc(100dvh-5rem)] min-h-0 w-full overflow-hidden bg-card md:h-dvh"
    >
      <div className="flex w-full min-h-0 flex-col border-r border-border bg-card lg:w-80 lg:shrink-0 xl:w-88">
        <div className="border-b border-border px-5 py-4">
          <Skeleton className="h-5 w-32 rounded-md bg-grey-300!" />
          <Skeleton className="mt-2 h-3 w-48 rounded-md bg-grey-300!" />
        </div>
        <div className="flex flex-col gap-1 p-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl p-3">
              <Skeleton className="size-11 shrink-0 rounded-full bg-grey-300!" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-32 rounded-md bg-grey-300!" />
                <Skeleton className="h-3 w-44 rounded-md bg-grey-300!" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden min-w-0 flex-1 flex-col lg:flex">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Skeleton className="size-10 shrink-0 rounded-full bg-grey-300!" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-36 rounded-md bg-grey-300!" />
            <Skeleton className="h-3 w-52 rounded-md bg-grey-300!" />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-end gap-3 p-4">
          <Skeleton className="h-12 w-2/3 rounded-2xl bg-grey-300!" />
          <Skeleton className="ml-auto h-12 w-1/2 rounded-2xl bg-grey-300!" />
          <Skeleton className="h-12 w-3/5 rounded-2xl bg-grey-300!" />
          <Skeleton className="ml-auto h-16 w-2/5 rounded-2xl bg-grey-300!" />
        </div>
        <div className="border-t border-border p-3">
          <Skeleton className="h-11 w-full rounded-full bg-grey-300!" />
        </div>
      </div>
    </div>
  );
}
