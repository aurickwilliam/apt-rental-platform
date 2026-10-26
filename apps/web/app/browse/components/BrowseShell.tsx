import { Suspense, type ReactNode } from "react";

import { BROWSE_BODY_CLASS, browseFrameClass } from "../lib/browse-layout";
import SearchContainer from "./SearchContainer";

interface BrowseShellProps {
  basePath?: string;
  /** Filter entry rendered beside the search pill. */
  filterButton?: ReactNode;
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
  fallback,
  children,
  fullWidth = false,
}: BrowseShellProps) {
  return (
    <div className={browseFrameClass(fullWidth)}>
      <Suspense>
        <SearchContainer basePath={basePath} filterButton={filterButton} mapHref={`${basePath}/map`} />
      </Suspense>
      <div className={BROWSE_BODY_CLASS}>
        <div className="w-full min-w-0 flex-1 rounded-lg p-0">
          <Suspense fallback={fallback}>{children}</Suspense>
        </div>
      </div>
    </div>
  );
}
