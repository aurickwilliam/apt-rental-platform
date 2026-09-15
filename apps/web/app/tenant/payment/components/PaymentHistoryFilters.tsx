"use client";

import { Button, Chip, Separator, Drawer } from "@heroui/react";
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

  return (
    <>
      <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
        <Drawer.Backdrop />
        <Drawer.Content placement="right" className="max-w-[420px] w-[92vw] z-50">
          <Drawer.Dialog className="bg-white dark:bg-zinc-900 rounded-l-2xl shadow-xl flex flex-col h-full">
            <Drawer.Header className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <SlidersHorizontal size={16} /> Filters
              </h3>
              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <Button variant="ghost" size="sm" onPress={clearAll} className="text-danger text-xs">
                    Clear all
                  </Button>
                )}
                <Button isIconOnly variant="ghost" size="sm" onPress={() => onOpenChange(false)} aria-label="Close">
                  <X size={16} />
                </Button>
              </div>
            </Drawer.Header>

            <Drawer.Body className="px-5 py-5 space-y-6 overflow-y-auto">
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
                          variant={selected ? "primary" : "secondary"}
                          color={selected ? "accent" : "default"}
                          onClick={() => toggle("years", year)}
                          className="cursor-pointer"
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
                        variant={selected ? "primary" : "secondary"}
                        color={selected ? "accent" : "default"}
                        onClick={() => toggle("statuses", s)}
                        className="cursor-pointer"
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
                        variant={selected ? "primary" : "secondary"}
                        color={selected ? "accent" : "default"}
                        onClick={() => setSort(s)}
                        className="cursor-pointer"
                      >
                        {s}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            </Drawer.Body>

            <Drawer.Footer className="p-5 border-t border-zinc-100 dark:border-zinc-800">
              <Button className="w-full" onPress={() => onOpenChange(false)}>
                Done
              </Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer>
    </>
  );
}


