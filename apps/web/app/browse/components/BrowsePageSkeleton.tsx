import { Skeleton } from "@heroui/react";

import {
  BROWSE_BODY_CLASS,
  BROWSE_GRID_CLASS,
  BROWSE_HERO_CLASS,
  BROWSE_SEARCH_ROW_CLASS,
  browseFrameClass,
} from "../lib/browse-layout";

// Title/location widths cycle so a row of placeholders reads as real listings
// instead of a stamped pattern. Deterministic: server and client render alike.
const TITLE_WIDTHS = ["w-3/4", "w-2/3", "w-4/5", "w-3/5"] as const;
const LOCATION_WIDTHS = ["w-1/2", "w-2/5", "w-3/5"] as const;

function CardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-transparent bg-surface">
      <Skeleton className="aspect-square h-auto w-full rounded-xl" />
      {/* Line boxes match the loaded card (22.5px title, 16px location, 39px
          footer after the card's 12px gap) so the grid doesn't jump. */}
      <div className="p-2">
        <div className="flex h-[22.5px] items-center">
          <Skeleton className={`h-[15px] ${TITLE_WIDTHS[index % TITLE_WIDTHS.length]} rounded-md`} />
        </div>
        <div className="flex h-4 items-center">
          <Skeleton className={`h-3 ${LOCATION_WIDTHS[index % LOCATION_WIDTHS.length]} rounded-md`} />
        </div>
      </div>
      <div className="mt-3 flex h-[39px] items-center justify-between p-2">
        <Skeleton className="h-[15px] w-16 rounded-md" />
        <Skeleton className="h-4 w-10 rounded-md" />
      </div>
    </div>
  );
}

export function BrowseCardsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      aria-label="Loading apartments"
      role="status"
      className={BROWSE_GRID_CLASS}
    >
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}

function SectionSkeleton({ sectionIndex }: { sectionIndex: number }) {
  return (
    <section aria-hidden="true" className="min-w-0">
      {/* Mirrors the loaded header: a 28px title line and the "See All" link. */}
      <div className="mb-2 flex h-7 items-center justify-between gap-2 sm:mb-3">
        <Skeleton className="h-5 w-40 rounded-md sm:w-48" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>
      <div className="flex gap-3 overflow-hidden pb-2 sm:gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="w-44 shrink-0 sm:w-56">
            <CardSkeleton index={sectionIndex + i} />
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
        <SectionSkeleton key={i} sectionIndex={i} />
      ))}
    </div>
  );
}

// Filter panel placeholder, shown in the drawer while the filter chunk loads.
// Follows the loaded panel: option groups split by separators in a scroll
// area, with the Search / Clear actions pinned below.
export function FilterPanelSkeleton() {
  return (
    <div aria-hidden="true" className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-hidden px-4 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>

        <hr className="my-5 border-divider" />

        <Skeleton className="mb-3 h-4 w-16 rounded-md" />
        <div className="flex flex-col gap-3">
          {["w-28", "w-20", "w-24", "w-32"].map((width, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="size-4 shrink-0 rounded" />
              <Skeleton className={`h-4 ${width} rounded-md`} />
            </div>
          ))}
        </div>

        <Skeleton className="mb-3 mt-6 h-4 w-20 rounded-md" />
        <div className="flex flex-wrap gap-2">
          {["w-16", "w-24", "w-20", "w-14", "w-24"].map((width, i) => (
            <Skeleton key={i} className={`h-8 ${width} rounded-full`} />
          ))}
        </div>

        <hr className="my-5 border-divider" />

        <Skeleton className="mb-3 h-4 w-16 rounded-md" />
        <Skeleton className="h-10 w-full rounded-lg" />

        <Skeleton className="mb-3 mt-6 h-4 w-20 rounded-md" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="flex shrink-0 gap-2 border-t border-divider px-4 py-3">
        <Skeleton className="h-10 min-w-0 flex-1 rounded-full" />
        <Skeleton className="h-10 w-24 shrink-0 rounded-full" />
      </div>
    </div>
  );
}

// The filter entry sits in the search row at every size. This placeholder keeps
// the row geometry until it is ready, without claiming a result count.
// Translucent white so it reads on the primary hero it sits in.
export function FilterEntrySkeleton() {
  return <Skeleton className="size-11 shrink-0 rounded-full bg-white/30!" aria-hidden="true" />;
}

// Search hero placeholder: the same primary banner as the loaded page, with
// shimmer in place of the headline, tagline and search pill so nothing
// interactive appears before it works.
function BrowseHeroSkeleton({ withFilterEntry = false }: { withFilterEntry?: boolean }) {
  return (
    <div aria-hidden="true" className={BROWSE_HERO_CLASS}>
      <Skeleton className="mx-auto hidden h-[30px] w-3/4 max-w-md rounded-lg bg-white/30! sm:h-[37.5px] md:block lg:h-[45px]" />
      <Skeleton className="mx-auto hidden h-5 w-full max-w-lg rounded-md bg-white/20! md:block" />
      <div className={BROWSE_SEARCH_ROW_CLASS}>
        <Skeleton className="h-[38px] min-w-0 flex-1 rounded-full bg-white/60!" />
        {withFilterEntry ? <FilterEntrySkeleton /> : null}
      </div>
    </div>
  );
}

interface BrowsePageSkeletonProps {
  /** Tenant portal: fill the width beside the sidebar instead of the capped, centered public frame. */
  fullWidth?: boolean;
}

// Results area of a searched / filtered / paged browse: the results bar's count
// line, then the flat grid. Filters live in the drawer, so there is no rail.
export function BrowseResultsGridSkeleton() {
  return (
    <>
      <div aria-hidden="true" className="mb-3 flex h-8 items-center">
        <Skeleton className="h-5 w-24 rounded-md" />
      </div>
      <BrowseCardsSkeleton />
    </>
  );
}

// Loading state for a searched / filtered / paged browse.
export function BrowseResultsPageSkeleton({ fullWidth = false }: BrowsePageSkeletonProps) {
  return (
    <div className={browseFrameClass(fullWidth)} aria-busy="true">
      <BrowseHeroSkeleton withFilterEntry />

      <div className={BROWSE_BODY_CLASS}>
        <div className="w-full min-w-0 flex-1 rounded-lg p-0">
          <BrowseResultsGridSkeleton />
        </div>
      </div>
    </div>
  );
}

// Full-page loading state for /browse and /tenant/browse: mirrors discovery
// mode (search hero, full-width section rows, no filter sidebar) since that is
// the landing users watch load.
export default function BrowsePageSkeleton({ fullWidth = false }: BrowsePageSkeletonProps) {
  return (
    <div className={browseFrameClass(fullWidth)} aria-busy="true">
      <BrowseHeroSkeleton withFilterEntry />

      <div className={BROWSE_BODY_CLASS}>
        <div className="w-full min-w-0 flex-1 rounded-lg p-0">
          <BrowseSectionsSkeleton />
        </div>
      </div>
    </div>
  );
}
