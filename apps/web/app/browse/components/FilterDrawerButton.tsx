"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Button, Drawer, useOverlayState } from "@heroui/react";
import { IconAdjustmentsHorizontal, IconX } from "@tabler/icons-react";

import { useIsMobile } from "@/hooks/use-mobile";

import { FILTER_KEYS } from "../lib/browse-params";
import { FilterPanelSkeleton } from "./BrowsePageSkeleton";

// Drawer-only code path: the panel chunk loads when the drawer first
// opens, keeping it out of Browse's first download.
const FilterContainer = dynamic(() => import("./FilterContainer"), {
  ssr: true,
  loading: () => <FilterPanelSkeleton />,
});

type Props = {
  /** Omitted where the total isn't loaded (tenant discovery). */
  resultCount?: number;
  basePath?: string;
  /** Passed to the filter panel; see FilterContainer. */
  navigate?: (href: string) => void;
};

// Self-contained filter entry: compact button with active-count badge plus its
// drawer (bottom sheet on phones, right-hand panel from md up). Rendered inside
// the search row at every size; it is the only way to the filters.
export default function FilterDrawerButton({ resultCount, basePath = "/browse", navigate }: Props) {
  const isMobile = useIsMobile();
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
      <Button
        variant="tertiary"
        size="lg"
        isIconOnly
        className="relative shrink-0"
        onPress={() => setIsOpen(true)}
        aria-label="Open filters"
      >
        <IconAdjustmentsHorizontal size={18} />
        {activeCount > 0 && (
          <span className="absolute -right-1 -top-1 min-h-5 min-w-5 rounded-full bg-danger px-1 text-[11px] font-bold text-white flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <Drawer.Root state={drawerState}>
          <Drawer.Backdrop>
            <Drawer.Content placement={isMobile ? "bottom" : "right"}>
              <Drawer.Dialog
                className={
                  isMobile
                    ? "flex max-h-[85dvh] w-full flex-col rounded-t-2xl p-0"
                    : "flex h-full w-105 max-w-[90vw] flex-col p-0"
                }
              >
                {isMobile ? (
                  <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-300" aria-hidden="true" />
                ) : null}
                <div className="flex items-center justify-between border-b border-divider px-4 py-3">
                  <div className="flex min-w-0 items-baseline gap-3">
                    <h3 className="flex items-center gap-2 font-nunito text-base font-semibold">
                      <IconAdjustmentsHorizontal size={16} />
                      Filters
                      {activeCount > 0 && (
                        <span className="min-h-5 min-w-5 rounded-full bg-primary px-1 text-[11px] font-bold text-white flex items-center justify-center">
                          {activeCount}
                        </span>
                      )}
                    </h3>
                    {resultCount === undefined ? null : (
                      <p className="truncate text-sm text-muted-foreground" aria-live="polite">
                        {resultCount} results found
                      </p>
                    )}
                  </div>
                  <Button
                    isIconOnly
                    variant="ghost"
                    size="sm"
                    onPress={close}
                    aria-label="Close filters"
                  >
                    <IconX size={16} />
                  </Button>
                </div>
                {/* mx-0!: Drawer.Body carries a -3px side margin for focus rings, which
                    would push the pinned footer past the drawer's edges. */}
                <Drawer.Body className="mx-0! flex min-h-0 flex-1 flex-col overflow-hidden p-0">
                  <FilterContainer basePath={basePath} onApply={close} navigate={navigate} />
                </Drawer.Body>
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer.Root>
      )}
    </>
  );
}
