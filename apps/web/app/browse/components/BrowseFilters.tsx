"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Drawer, useOverlayState } from "@heroui/react";
import { SlidersHorizontal, X } from "lucide-react";

import FilterContainer from "./FilterContainer";

type Props = {
  resultCount: number;
  basePath?: string;
  // Sticky offset for the desktop sidebar. The public /browse shell has a
  // sticky h-16 navbar (needs top-20); the tenant shell has no top navbar
  // (needs top-4, otherwise an 80px gap hangs above the stuck panel).
  stickyClassName?: string;
};

const FILTER_KEYS = [
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

export default function BrowseFilters({
  resultCount,
  basePath = "/browse",
  stickyClassName = "md:top-20 md:max-h-[calc(100dvh-6rem)]",
}: Props) {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const activeCount = useMemo(() => {
    let count = 0;
    for (const key of FILTER_KEYS) {
      if (searchParams.get(key)) count += 1;
    }
    return count;
  }, [searchParams]);

  const drawerState = useOverlayState({
    isOpen,
    onOpenChange: setIsOpen,
  });

  const close = () => setIsOpen(false);

  return (
    <>
      {/* Mobile filter trigger — hidden on md+ where the sidebar takes over */}
      <div className="md:hidden mb-3 flex items-center gap-2">
        <Button
          variant="secondary"
          className="flex-1 relative"
          onPress={() => setIsOpen(true)}
          aria-label="Open filters"
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 min-h-5 min-w-5 rounded-full bg-primary px-1 text-[11px] font-bold text-white flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>
        <p className="shrink-0 text-sm text-default-500" aria-live="polite">
          {resultCount} result{resultCount === 1 ? "" : "s"}
        </p>
      </div>

      {/* Mobile drawer — conditionally mounted so no backdrop lingers */}
      {isOpen && (
        <Drawer.Root state={drawerState}>
          <Drawer.Backdrop>
            <Drawer.Content placement="left">
              <Drawer.Dialog className="flex h-full w-[340px] max-w-[90vw] flex-col p-0">
                <div className="flex items-center justify-between border-b border-divider px-4 py-3">
                  <h3 className="flex items-center gap-2 text-base font-medium">
                    <SlidersHorizontal size={16} />
                    Filters
                    {activeCount > 0 && (
                      <span className="min-h-5 min-w-5 rounded-full bg-primary px-1 text-[11px] font-bold text-white flex items-center justify-center">
                        {activeCount}
                      </span>
                    )}
                  </h3>
                  <Button
                    isIconOnly
                    variant="ghost"
                    size="sm"
                    onPress={close}
                    aria-label="Close filters"
                  >
                    <X size={16} />
                  </Button>
                </div>
                <Drawer.Body className="flex-1 overflow-y-auto p-3">
                  <FilterContainer
                    resultCount={resultCount}
                    basePath={basePath}
                    onApply={close}
                  />
                </Drawer.Body>
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer.Root>
      )}

      {/* Desktop sidebar — hidden below md */}
      <aside className={`hidden md:block md:w-72 lg:w-80 shrink-0 self-start md:sticky md:overflow-y-auto ${stickyClassName}`}>
        <FilterContainer resultCount={resultCount} basePath={basePath} />
      </aside>
    </>
  );
}
