"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ListBox, Select } from "@heroui/react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import {
  formatPesoCompact,
  formatPesoDisplay,
  monthLabel,
  type PropertyRevenue,
} from "@repo/utils";

import ChartEmptyState from "./ChartEmptyState";

const ROW_HEIGHT = 34;

const revenueConfig = {
  amount: { label: "Revenue", color: "var(--primary)" },
} satisfies ChartConfig;

type Props = {
  revenueByProperty: PropertyRevenue[];
  /** "YYYY-MM" keys, oldest first, that can be selected. */
  monthKeys: string[];
};

function monthOptionLabel(monthKey: string): string {
  return `${monthLabel(monthKey)} ${monthKey.slice(0, 4)}`;
}

export default function PropertyRevenueChart({ revenueByProperty, monthKeys }: Props) {
  const latestMonth = monthKeys[monthKeys.length - 1] ?? "";
  // Open on the latest month that has earnings so the first view isn't empty.
  const defaultMonth =
    [...monthKeys]
      .reverse()
      .find((monthKey) =>
        revenueByProperty.some((property) =>
          property.months.some((month) => month.month === monthKey && month.amount > 0),
        ),
      ) ?? latestMonth;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  // Earners first, so properties with no revenue trail instead of hiding them.
  const rows = useMemo(
    () =>
      revenueByProperty
        .map((property) => ({
          name: property.apartmentName,
          amount:
            property.months.find((month) => month.month === selectedMonth)?.amount ?? 0,
        }))
        .sort((a, b) => b.amount - a.amount),
    [revenueByProperty, selectedMonth],
  );
  const hasEarnings = rows.some((row) => row.amount > 0);

  return (
    <div className="space-y-4">
      <Select
        aria-label="Month"
        value={selectedMonth}
        onChange={(key) => setSelectedMonth(key ? String(key) : latestMonth)}
        className="max-w-48"
      >
        <Select.Trigger className="cursor-pointer">
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {[...monthKeys].reverse().map((monthKey) => (
              <ListBox.Item
                key={monthKey}
                id={monthKey}
                textValue={monthOptionLabel(monthKey)}
              >
                {monthOptionLabel(monthKey)}
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      {hasEarnings ? (
        <ChartContainer
          config={revenueConfig}
          className="w-full"
          style={{ height: Math.max(rows.length, 3) * ROW_HEIGHT + 24 }}
        >
          <BarChart data={rows} layout="vertical" barSize={16} margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatPesoCompact(Number(value))}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [formatPesoDisplay(Number(value)) || "₱ 0", "Revenue"]}
                />
              }
            />
            <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ChartContainer>
      ) : (
        <ChartEmptyState
          title="No earnings this month"
          description="Try another month. Collections appear here once tenants pay."
        />
      )}
    </div>
  );
}
