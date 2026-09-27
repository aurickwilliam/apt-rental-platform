"use client";

import { Button, Chip, Separator, Modal, useOverlayState } from "@heroui/react";
import { SlidersHorizontal, X } from "lucide-react";
import type { PaymentHistoryFilter, PaymentStatus } from "../types";

const STATUS_OPTIONS: PaymentStatus[] = ["Paid", "Pending", "Failed", "Unpaid"];
const SORT_OPTIONS: PaymentHistoryFilter["sort"][] = ["Newest", "Oldest"];

interface PaymentHistoryFiltersProps {
  filters: PaymentHistoryFilter;
  onChange: (next: PaymentHistoryFilter) => void;
  availableYears: string[];
  currentYear: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount: number;
}

export default function PaymentHistoryFilters({
  filters,
  onChange,
  availableYears,
  currentYear,
  isOpen,
  onOpenChange,
  activeCount,
}: PaymentHistoryFiltersProps) {
  const toggle = (key: "years" | "statuses", value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [key]: next } as PaymentHistoryFilter);
  };

  const setSort = (v: PaymentHistoryFilter["sort"]) => onChange({ ...filters, sort: v });
  const clearAll = () => onChange({ years: [], statuses: [], sort: "Newest" });
  const close = () => onOpenChange(false);

  // Same overlay contract as the receipt modal on this page (useOverlayState +
  // state prop) — the documented first-class Modal API.
  const modalState = useOverlayState({
    isOpen,
    onOpenChange,
  });

  return (
    <>
      {/* Conditionally mounted: guarantees no backdrop residue. A stuck drawer
          backdrop was previously observed swallowing all clicks until refresh. */}
      {isOpen && (
        <Modal.Root state={modalState}>
          <Modal.Backdrop>
            <Modal.Container placement="center" size="sm">
              <Modal.Dialog className="rounded-2xl">
                <Modal.Header className="flex flex-row items-center justify-between">
                  <h3 className="text-base font-nunito font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <SlidersHorizontal size={16} /> Filters
                  </h3>
                  <div className="flex items-center gap-2">
                    {activeCount > 0 && (
                      <Button variant="ghost" size="sm" onPress={clearAll} className="text-danger text-xs">
                        Clear all
                      </Button>
                    )}
                    <Button isIconOnly variant="ghost" size="sm" onPress={close} aria-label="Close">
                      <X size={16} />
                    </Button>
                  </div>
                </Modal.Header>

                <Modal.Body className="space-y-6">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Year</p>
                    <div className="flex flex-wrap gap-2">
                      {availableYears.length === 0 ? (
                        <p className="text-xs text-zinc-400">No years available</p>
                      ) : (
                        availableYears.map((year) => {
                          const selected = filters.years.includes(year);
                          const label = year === currentYear ? "This Year" : year;
                          return (
                            <Chip
                              key={year}
                              variant="soft"
                              color={selected ? "accent" : "default"}
                              onClick={() => toggle("years", year)}
                              className="cursor-pointer text-[11px]"
                            >
                              {label}
                            </Chip>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Status</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((s) => {
                        const selected = filters.statuses.includes(s);
                        return (
                          <Chip
                            key={s}
                            variant="soft"
                            color={selected ? "accent" : "default"}
                            onClick={() => toggle("statuses", s)}
                            className="cursor-pointer text-[11px]"
                          >
                            {s}
                          </Chip>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Sort by</p>
                    <div className="flex flex-wrap gap-2">
                      {SORT_OPTIONS.map((s) => {
                        const selected = filters.sort === s;
                        return (
                          <Chip
                            key={s}
                            variant="soft"
                            color={selected ? "accent" : "default"}
                            onClick={() => setSort(s)}
                            className="cursor-pointer text-[11px]"
                          >
                            {s}
                          </Chip>
                        );
                      })}
                    </div>
                  </div>
                </Modal.Body>

                <Modal.Footer className="flex justify-center">
                  <Button className="w-full rounded-full font-nunito" onPress={close}>
                    Done
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal.Root>
      )}
    </>
  );
}
