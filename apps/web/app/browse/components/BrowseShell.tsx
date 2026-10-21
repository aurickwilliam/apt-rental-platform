import { Suspense, type ReactNode } from "react";

import SearchContainer from "./SearchContainer";

interface BrowseShellProps {
  basePath?: string;
  /** Mobile filter entry rendered beside the search pill (results grid only). */
  filterButton?: ReactNode;
  /** Filter sidebar; omitted in discovery mode, where there is no filter panel. */
  filters?: ReactNode;
  /** Placeholder shown while `children` streams in. */
  fallback: ReactNode;
  children: ReactNode;
  /**
   * The tenant shell is a flex item of the portal layout and fills the width
   * beside the sidebar, so it is neither capped at max-w-7xl nor centered. The
   * public route keeps the capped, centered block sizing.
   */
  fullWidth?: boolean;
}

/**
 * Shared Browse frame: the search row and the results area. The results are
 * always wrapped in a Suspense boundary, so an async results section streams
 * in after the shell instead of blocking the whole route. Overflow clipping
 * keeps any inner min-content overflow (e.g. third-party control internals)
 * from widening the page; unlike hidden it does not create a scroll
 * container, so the sticky filter sidebar keeps working.
 */
export default function BrowseShell({
  basePath = "/browse",
  filterButton,
  filters,
  fallback,
  children,
  fullWidth = false,
}: BrowseShellProps) {
  return (
    <div
      className={`px-4 sm:px-6 py-4 overflow-x-clip ${fullWidth ? "w-full" : "max-w-7xl mx-auto"}`}
    >
      <Suspense>
        <SearchContainer basePath={basePath} filterButton={filterButton} />
      </Suspense>
      <div className="mt-4 flex flex-col md:flex-row gap-4">
        {filters}
        <div className="w-full min-w-0 flex-1 rounded-lg p-0">
          <Suspense fallback={fallback}>{children}</Suspense>
        </div>
      </div>
    </div>
  );
}
