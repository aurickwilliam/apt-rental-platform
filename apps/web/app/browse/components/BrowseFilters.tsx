"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import { FilterPanelSkeleton } from "./BrowsePageSkeleton";

type Props = {
  resultCount: number;
  basePath?: string;
  // Sticky offset for the desktop sidebar. The public /browse shell has a
  // sticky h-16 navbar (needs top-20); the tenant shell has no top navbar
  // (needs top-4, otherwise an 80px gap hangs above the stuck panel).
  stickyClassName?: string;
};

export const FILTER_KEYS = [
  "locations",
  "price_min",
  "price_max",
  "apt_types",
  "bedrooms",
  "bathrooms",
  "size_min",
  "size_max",
  "furnishing",
  "floor_level",
  "lease",
  "amenities",
  "sort",
  "verified",
] as const;

// The filter panel (sliders, checkbox/radio groups, drawer form) is the
// heaviest client code on Browse. Keep it in a separate chunk while
// preserving server rendering; the aside keeps its width while loading.
const FilterContainer = dynamic(() => import("./FilterContainer"), {
  ssr: true,
  loading: () => <FilterPanelSkeleton />,
});

export default function BrowseFilters({
  resultCount,
  basePath = "/browse",
  stickyClassName = "md:top-20 md:max-h-[calc(100dvh-6rem)]",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCount = useMemo(() => {
    let count = 0;
    for (const key of FILTER_KEYS) {
      if (searchParams.get(key)) count += 1;
    }
    return count;
  }, [searchParams]);

  // Mobile clear-all: drops filters and text search, like the panel's Clear All.
  const clearAll = () => {
    router.replace(basePath);
  };

  return (
    <>
      {/* Mobile result summary — the filter button itself lives in the
          search row (FilterDrawerButton). Hidden on md+ where the sidebar
          takes over. */}
      <div className="md:hidden mb-3 flex items-center justify-between gap-2">
        <p className="shrink-0 text-sm text-default-500" aria-live="polite">
          {resultCount} result{resultCount === 1 ? "" : "s"}
        </p>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-danger"
            onPress={clearAll}
            aria-label="Clear all filters"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Desktop sidebar — hidden below md. `data-fab-clearance` keeps the
          floating notifications bell off the filter controls. */}
      <aside data-fab-clearance="browse-filters" className={`hidden md:block md:w-64 lg:w-72 xl:w-80 shrink-0 self-start md:sticky md:overflow-y-auto ${stickyClassName}`}>
        <FilterContainer resultCount={resultCount} basePath={basePath} />
      </aside>
    </>
  );
}
