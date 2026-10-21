"use client";

import { useState } from "react";
import { Button, Popover, Tabs } from "@heroui/react";
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconRefresh,
} from "@tabler/icons-react";
import {
  financeMonthLabel,
  financeRentIndicator,
  shiftFinanceMonth,
  type FinanceProperty,
  type FinanceScope,
} from "@repo/utils";

import SettingsSelect from "@/app/components/settings/SettingsSelect";
import { useFinanceIncomeMonths } from "@/hooks/use-landlord-finances";
import type {
  FinanceTab,
  LandlordFinanceRouteParams,
} from "@/lib/landlord-finance-params";

const ALL_PROPERTIES = "all";

interface ReportControlsProps {
  properties: FinanceProperty[];
  scope: FinanceScope;
  currentMonth: string;
  tab: FinanceTab;
  /** Controls stay visible but disabled until the report is ready. */
  disabled: boolean;
  refreshing: boolean;
  onChange: (patch: Partial<LandlordFinanceRouteParams>) => void;
  onRefresh: () => void;
}

/** Report month picker: year stepper plus a 12-month grid with rent dots. */
function MonthPicker({
  scope,
  currentMonth,
  disabled,
  onSelect,
}: Pick<ReportControlsProps, "scope" | "currentMonth" | "disabled"> & {
  onSelect: (month: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(scope.month.slice(0, 4)));
  const indicators = useFinanceIncomeMonths(
    currentMonth,
    scope.apartmentId,
    open,
  );
  const oldest = shiftFinanceMonth(currentMonth, -23);
  return (
    <Popover
      isOpen={open}
      onOpenChange={(next) => {
        // Each opening starts at the applied month's year.
        if (next) setYear(Number(scope.month.slice(0, 4)));
        setOpen(next);
      }}
    >
      <Button
        variant="outline"
        size="sm"
        isDisabled={disabled}
        aria-label={`Report month: ${financeMonthLabel(scope.month)}`}
      >
        <IconCalendar size={16} aria-hidden />
        {financeMonthLabel(scope.month)}
      </Button>
      <Popover.Content placement="bottom start" className="w-72">
        <Popover.Dialog aria-label="Choose report month" className="space-y-3 p-3">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-brand" aria-hidden />
            Rent collected
          </p>
          {indicators.error ? (
            <div role="alert" className="text-sm">
              <p>
                Could not load rent indicators. You can still choose a month.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => void indicators.refresh()}
              >
                Retry rent indicators
              </Button>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              aria-label="Previous year"
              isDisabled={year <= Number(oldest.slice(0, 4))}
              onPress={() => setYear(year - 1)}
            >
              <IconChevronLeft size={18} />
            </Button>
            <h3 className="font-nunito text-base font-bold">{year}</h3>
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              aria-label="Next year"
              isDisabled={year >= Number(currentMonth.slice(0, 4))}
              onPress={() => setYear(year + 1)}
            >
              <IconChevronRight size={18} />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2" aria-label="Report months">
            {Array.from({ length: 12 }, (_, index) => {
              const month = `${year}-${String(index + 1).padStart(2, "0")}`;
              const status = financeRentIndicator(
                month,
                currentMonth,
                indicators.data,
                !!indicators.error || indicators.loading,
              );
              const selected = month === scope.month;
              const available = status !== "outside report range";
              return (
                <Button
                  key={month}
                  size="sm"
                  variant={selected ? "primary" : "tertiary"}
                  isDisabled={!available}
                  aria-pressed={selected}
                  aria-label={`Month: ${financeMonthLabel(month)}, ${status}`}
                  onPress={() => {
                    setOpen(false);
                    if (!selected) onSelect(month);
                  }}
                >
                  {available && indicators.loading && !indicators.data ? (
                    <span
                      className={`size-2 animate-pulse rounded-full motion-reduce:animate-none ${selected ? "bg-white/50" : "bg-muted"}`}
                      aria-hidden
                    />
                  ) : status === "rent collected" ? (
                    <span
                      className={`size-2 rounded-full ${selected ? "bg-white" : "bg-brand"}`}
                      aria-hidden
                    />
                  ) : null}
                  {financeMonthLabel(month).slice(0, 3)}
                </Button>
              );
            })}
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

/**
 * The report's scope row: property, month and refresh on the left, the three
 * report tabs on the right. Scope changes apply immediately and live in the
 * URL, so there is no draft to apply or cancel.
 */
export default function ReportControls({
  properties,
  scope,
  currentMonth,
  tab,
  disabled,
  refreshing,
  onChange,
  onRefresh,
}: ReportControlsProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3"
      data-fab-clearance
    >
      <div className="flex flex-wrap items-center gap-2">
        <SettingsSelect
          label="Property"
          className="w-52"
          isDisabled={disabled || !properties.length}
          value={scope.apartmentId ?? ALL_PROPERTIES}
          options={[
            { value: ALL_PROPERTIES, label: "All properties" },
            ...properties.map((property) => ({
              value: property.id,
              label: property.name,
            })),
          ]}
          onChange={(value) =>
            onChange({ apartmentId: value === ALL_PROPERTIES ? null : value })
          }
        />
        <MonthPicker
          scope={scope}
          currentMonth={currentMonth}
          disabled={disabled || !properties.length}
          onSelect={(month) => onChange({ month })}
        />
        <Button
          variant="outline"
          size="sm"
          isIconOnly
          aria-label="Refresh"
          isDisabled={disabled}
          isPending={refreshing}
          onPress={onRefresh}
        >
          <IconRefresh size={16} aria-hidden />
        </Button>
      </div>
      <Tabs
        className="w-auto"
        selectedKey={tab}
        onSelectionChange={(key) => onChange({ tab: String(key) as FinanceTab })}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="Finance report tabs">
            <Tabs.Tab id="overview">
              <span>Overview</span>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="expenses">
              <span>Expenses</span>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="budget">
              <span>Budget</span>
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
    </div>
  );
}
