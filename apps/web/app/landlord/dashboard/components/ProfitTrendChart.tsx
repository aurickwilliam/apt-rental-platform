"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ListBox, Select } from "@heroui/react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import {
  TREND_TIMEFRAMES,
  buildTrendSeries,
  formatPesoCompact,
  formatPesoDisplay,
  type MonthlyRevenuePoint,
  type TrendTimeframe,
} from "@repo/utils";

import ChartEmptyState from "./ChartEmptyState";

const profitConfig = {
  value: { label: "Profit", color: "var(--primary)" },
} satisfies ChartConfig;

type Props = {
  data: MonthlyRevenuePoint[];
  className?: string;
};

export default function ProfitTrendChart({ data, className = "" }: Props) {
  const [timeframe, setTimeframe] = useState<TrendTimeframe>("Monthly");

  const series = buildTrendSeries(data, timeframe);
  const hasRevenue = series.some((point) => point.value > 0);

  return (
    <div className={`rounded-3xl border border-border bg-card p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-nunito text-xl font-bold text-primary">Profit Trend</h3>
          <p className="text-sm text-muted-foreground">Track your profit over time</p>
        </div>

        <Select
          aria-label="Timeframe"
          value={timeframe}
          onChange={(key) => setTimeframe(key ? (String(key) as TrendTimeframe) : "Monthly")}
          className="w-36"
        >
          <Select.Trigger className="cursor-pointer">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {TREND_TIMEFRAMES.map((option) => (
                <ListBox.Item key={option} id={option} textValue={option}>
                  {option}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {hasRevenue ? (
        <ChartContainer config={profitConfig} className="h-[260px] w-full">
          <AreaChart data={series} margin={{ left: 4, right: 12, top: 8 }}>
            <defs>
              <linearGradient id="profitTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatPesoCompact(Number(value))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [formatPesoDisplay(Number(value)) || "₱ 0", "Profit"]}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={2.5}
              fill="url(#profitTrendGradient)"
              dot={{ r: 4, fill: "var(--color-value)", strokeWidth: 0 }}
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <ChartEmptyState
          title="No earnings yet"
          description="Your profit trend will appear here once payments come in."
        />
      )}
    </div>
  );
}
