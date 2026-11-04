"use client";

import { useState } from "react";
import { Button, Popover } from "@heroui/react";
import { IconFilter2 } from "@tabler/icons-react";
import { emptyHistoryFilters, historyFilterCount, HISTORY_DATE_OPTIONS, type MaintenanceHistoryFilters as HistoryFilters } from "@repo/utils/maintenance-history";
import SettingsSelect from "@/app/components/settings/SettingsSelect";
import SettingsMultiSelect from "@/app/components/settings/SettingsMultiSelect";
import { CATEGORIES } from "../data/maintenance-data";

interface MaintenanceHistoryFiltersProps {
  filters: HistoryFilters;
  onApply: (filters: HistoryFilters) => void;
  disabled: boolean;
}

export default function MaintenanceHistoryFilters({ filters, onApply, disabled }: MaintenanceHistoryFiltersProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const activeCount = historyFilterCount(filters);
  const groups = [
    { key: "statuses" as const, label: "Status", options: [{ value: "Resolved", label: "Resolved" }, { value: "Cancelled", label: "Cancelled" }] },
    { key: "urgencies" as const, label: "Urgency", options: [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }] },
  ];
  return (
    <Popover isOpen={open} onOpenChange={(next) => { if (next) setDraft(filters); setOpen(next); }}>
      <Button variant="secondary" isDisabled={disabled} aria-label={activeCount ? `Filter maintenance history, ${activeCount} ${activeCount === 1 ? "filter" : "filters"} applied` : "Filter maintenance history"}>
        <IconFilter2 size={18} aria-hidden="true" />
        Filters{activeCount ? ` (${activeCount})` : ""}
      </Button>
      <Popover.Content placement="bottom end" className="w-80 max-w-[calc(100vw-2rem)]">
        <Popover.Dialog aria-label="Filter maintenance history" className="space-y-4 p-4">
          <h3 className="font-nunito text-lg font-bold text-foreground">Filter maintenance history</h3>
          {groups.map(({ key, label, options }) => (
            <fieldset key={key} className="space-y-2">
              <legend className="font-nunito text-sm font-semibold text-foreground">{label}</legend>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                  <Button key={option.value} size="sm" variant={draft[key].includes(option.value) ? "primary" : "outline"}
                    aria-pressed={draft[key].includes(option.value)} aria-label={`${label}: ${option.label}`}
                    onPress={() => setDraft((previous) => ({ ...previous, [key]: previous[key].includes(option.value)
                      ? previous[key].filter((value) => value !== option.value) : [...previous[key], option.value] }))}>
                    {option.label}
                  </Button>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="space-y-2">
            <p className="font-nunito text-sm font-semibold text-foreground">Category</p>
            <SettingsMultiSelect label="Category" value={draft.categories} options={CATEGORIES.map((category) => ({ value: category.id, label: category.label }))}
              placeholder="All categories" className="w-full" onChange={(categories) => setDraft((previous) => ({ ...previous, categories }))} />
          </div>
          <div className="space-y-2">
            <p className="font-nunito text-sm font-semibold text-foreground">Reported date</p>
            <SettingsSelect label="Reported date" value={draft.reportedDate} options={HISTORY_DATE_OPTIONS} className="w-full"
              onChange={(value) => setDraft((previous) => ({ ...previous, reportedDate: HISTORY_DATE_OPTIONS.find((option) => option.value === value)?.value ?? "any" }))} />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" size="sm" onPress={() => setDraft(emptyHistoryFilters())}>Reset</Button>
            <Button variant="primary" size="sm" onPress={() => { onApply(draft); setOpen(false); }}>Apply filters</Button>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
