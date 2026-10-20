"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { IconChevronRight } from "@tabler/icons-react";
import {
  financePerformanceValue,
  rankFinanceProperties,
  type PropertyPerformance as Property,
  type PropertyPerformanceMetric,
} from "@repo/utils";
import FinanceCard from "./FinanceCard";
import { financeMoney } from "./FinanceMoneyRow";

interface PropertyPerformanceProps {
  properties: Property[];
  onSelect: (id: string) => void;
  onViewAll?: () => void;
  full?: boolean;
}

export default function PropertyPerformance({
  properties,
  onSelect,
  onViewAll,
  full = false,
}: PropertyPerformanceProps) {
  const [metric, setMetric] = useState<PropertyPerformanceMetric>("collected");
  const ranked = rankFinanceProperties(properties, metric);
  const maximum = Math.max(
    1,
    ...ranked.map((property) =>
      Math.abs(financePerformanceValue(property, metric) ?? 0),
    ),
  );
  const visible = full ? ranked : ranked.slice(0, 3);
  return (
    <FinanceCard
      title="Property performance"
      description="Select a property to focus the whole report."
    >
      <div className="flex flex-wrap gap-2" aria-label="Performance metric">
        {(
          [
            ["collected", "Collected"],
            ["expenses", "Expenses"],
            ["net", "Net income"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={metric === value ? "secondary" : "ghost"}
            aria-pressed={metric === value}
            onPress={() => setMetric(value)}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        {visible.map((property) => {
          const amount = financePerformanceValue(property, metric);
          return (
            <Button
              key={property.id}
              className="finance-property"
              variant="ghost"
              aria-label={`${property.name}, ${metric}, ${amount === null ? "expenses not reviewed" : financeMoney(amount)}. Filter this property.`}
              onPress={() => onSelect(property.id)}
            >
              <div className="w-full space-y-2 text-left">
                <div className="flex flex-wrap items-start gap-2">
                  <span className="min-w-0 flex-1 whitespace-normal font-nunito font-semibold">
                    {property.name}
                  </span>
                  <span
                    className={`font-nunito font-bold tabular-nums ${amount !== null && amount < 0 ? "text-destructive" : "text-brand"}`}
                  >
                    {amount === null ? "Not reviewed" : financeMoney(amount)}
                  </span>
                  <IconChevronRight size={18} aria-hidden />
                </div>
                {amount !== null ? (
                  <div
                    className="h-2 overflow-hidden rounded-full bg-muted"
                    aria-hidden
                  >
                    <div
                      className={`h-full rounded-full ${amount < 0 ? "bg-destructive" : "bg-brand"}`}
                      style={{
                        width: `${(Math.abs(amount) / maximum) * 100}%`,
                      }}
                    />
                  </div>
                ) : null}
                {!property.reviewed ? (
                  <p className="whitespace-normal text-xs text-muted-foreground">
                    Expenses incomplete · net income unavailable
                  </p>
                ) : null}
              </div>
            </Button>
          );
        })}
        {!visible.length ? (
          <p className="py-4 text-sm text-muted-foreground">
            No property performance for this month.
          </p>
        ) : null}
      </div>
      {!full && properties.length > 3 ? (
        <Button variant="tertiary" size="sm" onPress={onViewAll}>
          View all {properties.length} properties
        </Button>
      ) : null}
    </FinanceCard>
  );
}
