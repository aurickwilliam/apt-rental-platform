"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";

import { BROWSE_RAIL_CLASS, browseRailCardClass } from "../lib/browse-layout";
import { FILTER_KEYS } from "../lib/browse-params";
import FilterContainer from "./FilterContainer";

interface BrowseFilterRailProps {
  basePath?: string;
  /** Tenant portal: sticks to the top of the page; the public route clears its navbar. */
  fullWidth?: boolean;
}

/**
 * The filters beside searched, filtered and paged results, from md up: the same
 * panel as the drawer (options scroll, Search / Clear All stay pinned), so a
 * visitor can refine the list without leaving it. Below md the filter button in
 * the search bar opens the drawer instead.
 */
export default function BrowseFilterRail({ basePath = "/browse", fullWidth = false }: BrowseFilterRailProps) {
  const searchParams = useSearchParams();
  const activeCount = useMemo(
    () => FILTER_KEYS.filter((key) => searchParams.get(key)).length,
    [searchParams],
  );

  return (
    <aside aria-label="Filters" className={BROWSE_RAIL_CLASS}>
      <div className={browseRailCardClass(fullWidth)}>
        <div className="flex items-center gap-2 border-b border-divider px-4 py-3">
          <IconAdjustmentsHorizontal size={16} aria-hidden="true" />
          <h3 className="font-nunito text-base font-semibold">Filters</h3>
          {activeCount > 0 && (
            <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </div>
        <FilterContainer basePath={basePath} />
      </div>
    </aside>
  );
}
