"use client";

import { useState } from "react";
import { Button, SearchField, Tabs } from "@heroui/react";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
} from "@tabler/icons-react";
import {
  financeMonthLabel,
  financeRentIndicator,
  shiftFinanceMonth,
  type FinanceProperty,
  type FinanceScope,
} from "@repo/utils";
import { useFinanceIncomeMonths } from "@/hooks/use-landlord-finances";
import FinanceModal from "./FinanceModal";

interface FinanceFilterModalProps {
  applied: FinanceScope;
  currentMonth: string;
  properties: FinanceProperty[];
  onApply: (scope: FinanceScope) => void;
  onClose: () => void;
}

export default function FinanceFilterModal({
  applied,
  currentMonth,
  properties,
  onApply,
  onClose,
}: FinanceFilterModalProps) {
  const [draft, setDraft] = useState(applied);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState(Number(applied.month.slice(0, 4)));
  const [tab, setTab] = useState("property");
  const indicators = useFinanceIncomeMonths(
    currentMonth,
    draft.apartmentId,
    true,
  );
  const oldest = shiftFinanceMonth(currentMonth, -23);
  const matches = properties.filter((property) =>
    property.name
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  const options = [{ id: null, name: "All properties" }, ...matches];
  const propertyName =
    properties.find((property) => property.id === draft.apartmentId)?.name ??
    "All properties";
  return (
    <FinanceModal
      title="Filters"
      description="Choose the property and month for your report."
      onClose={onClose}
      footer={
        <>
          <p aria-live="polite" className="text-sm">
            {propertyName} · {financeMonthLabel(draft.month)}
          </p>
          <div className="flex gap-3">
            <Button variant="tertiary" className="flex-1" onPress={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onPress={() => onApply(draft)}>
              Apply filters
            </Button>
          </div>
        </>
      }
    >
      <Button
        variant="ghost"
        size="sm"
        onPress={() => {
          setDraft({ month: currentMonth, apartmentId: null });
          setSearch("");
          setYear(Number(currentMonth.slice(0, 4)));
        }}
      >
        Reset
      </Button>
      <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(String(key))}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Filter by">
            <Tabs.Tab id="property">
              <span>Property</span>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="month">
              <span>Month</span>
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id="property" className="space-y-3 pt-4">
          <SearchField
            value={search}
            onChange={setSearch}
            aria-label="Search properties"
          >
            <SearchField.Group>
              <SearchField.SearchIcon>
                <IconSearch size={18} />
              </SearchField.SearchIcon>
              <SearchField.Input placeholder="Search properties" />
              <SearchField.ClearButton aria-label="Clear property search" />
            </SearchField.Group>
          </SearchField>
          <div className="space-y-2" aria-label="Properties">
            {options.map((property) => (
              <Button
                key={property.id ?? "all"}
                variant={
                  property.id === draft.apartmentId ? "secondary" : "ghost"
                }
                className="finance-choice"
                aria-pressed={property.id === draft.apartmentId}
                aria-label={`Property: ${property.name}`}
                onPress={() => setDraft({ ...draft, apartmentId: property.id })}
              >
                <span className="min-w-0 flex-1 whitespace-normal text-left">
                  {property.name}
                </span>
                {property.id === draft.apartmentId ? (
                  <IconCheck size={18} aria-hidden />
                ) : null}
              </Button>
            ))}
            {search.trim() && !matches.length ? (
              <p className="py-4 text-sm text-muted-foreground">
                No matching properties.
              </p>
            ) : null}
          </div>
        </Tabs.Panel>
        <Tabs.Panel id="month" className="space-y-4 pt-4">
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
              aria-label="Previous year"
              isDisabled={year <= Number(oldest.slice(0, 4))}
              onPress={() => setYear(year - 1)}
            >
              <IconChevronLeft size={20} />
            </Button>
            <h3 className="font-nunito text-lg font-bold">{year}</h3>
            <Button
              isIconOnly
              variant="ghost"
              aria-label="Next year"
              isDisabled={year >= Number(currentMonth.slice(0, 4))}
              onPress={() => setYear(year + 1)}
            >
              <IconChevronRight size={20} />
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
              const selected = month === draft.month;
              const available = status !== "outside report range";
              return (
                <Button
                  key={month}
                  variant={selected ? "primary" : "tertiary"}
                  isDisabled={!available}
                  aria-pressed={selected}
                  aria-label={`Month: ${financeMonthLabel(month)}, ${status}`}
                  onPress={() => setDraft({ ...draft, month })}
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
        </Tabs.Panel>
      </Tabs>
    </FinanceModal>
  );
}
