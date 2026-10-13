"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Drawer, useOverlayState } from "@heroui/react";
import { IconAdjustmentsHorizontal, IconX } from "@tabler/icons-react";

import FilterContainer from "./FilterContainer";
import { FILTER_KEYS } from "./BrowseFilters";

type Props = {
  resultCount: number;
  basePath?: string;
};

// Self-contained mobile filter entry: compact button with active-count badge
// plus its bottom-sheet drawer. Rendered inside the search row (md:hidden).
export default function MobileFilterButton({ resultCount, basePath = "/browse" }: Props) {
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
        className="relative shrink-0 md:hidden"
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
            <Drawer.Content placement="bottom">
              <Drawer.Dialog className="flex max-h-[85dvh] w-full flex-col rounded-t-2xl p-0">
                <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-300" aria-hidden="true" />
                <div className="flex items-center justify-between border-b border-divider px-4 py-3">
                  <h3 className="flex items-center gap-2 text-base font-medium">
                    <IconAdjustmentsHorizontal size={16} />
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
                    <IconX size={16} />
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
    </>
  );
}
