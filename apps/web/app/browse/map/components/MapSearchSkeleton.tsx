import { Skeleton } from "@heroui/react";

import { MAP_LIST_GRID_CLASS } from "../../lib/browse-layout";
import { BrowseCardsSkeleton } from "../../components/BrowsePageSkeleton";

interface MapSearchSkeletonProps {
  /** Same desktop height the loaded split view uses. */
  heightClassName: string;
}

// Route and in-page loading state for the map search: the top row, the list
// column with its heading and cards, and the map column. Carries no counts or
// listing details.
export default function MapSearchSkeleton({ heightClassName }: MapSearchSkeletonProps) {
  return (
    <div className="w-full px-4 py-4 sm:px-6" aria-busy="true">
      <div aria-hidden="true" className="mb-4 flex items-center gap-2">
        <Skeleton className="h-11 w-11 shrink-0 rounded-xl sm:w-24" />
        <Skeleton className="h-[38px] min-w-0 flex-1 rounded-full" />
        <Skeleton className="size-11 shrink-0 rounded-full" />
      </div>

      <div className={`grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] ${heightClassName}`}>
        <div className="min-h-0 min-w-0 overflow-hidden">
          <div aria-hidden="true" className="mb-4 flex min-h-8 items-center">
            <Skeleton className="h-6 w-56 rounded-md" />
          </div>
          <BrowseCardsSkeleton count={6} className={MAP_LIST_GRID_CLASS} />
        </div>
        <div
          aria-hidden="true"
          className="hidden min-h-0 min-w-0 overflow-hidden rounded-2xl border border-border lg:block"
        >
          <Skeleton className="size-full rounded-none" />
        </div>
      </div>
    </div>
  );
}
