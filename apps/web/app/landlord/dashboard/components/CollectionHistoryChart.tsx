"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import {
  formatPesoCompact,
  formatPesoDisplay,
  monthLabel,
  summarizeCollection,
  type CollectionMonthPoint,
} from "@repo/utils";

import ChartEmptyState from "./ChartEmptyState";

const collectionConfig = {
  collected: { label: "Collected", color: "var(--primary)" },
  unpaid: { label: "Unpaid", color: "var(--warning)" },
} satisfies ChartConfig;

type Props = {
  data: CollectionMonthPoint[];
  className?: string;
};

export default function CollectionHistoryChart({ data, className = "" }: Props) {
  const { percent } = summarizeCollection(data);
  const hasBilledRent = data.some((point) => point.collected + point.unpaid > 0);
  const chartData = data.map((point) => ({
    month: monthLabel(point.month),
    collected: point.collected,
    unpaid: point.unpaid,
  }));

  return (
    <div className={`rounded-3xl border border-border bg-card p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-nunito text-xl font-bold text-primary">Rent Collection</h3>
          <p className="text-sm text-muted-foreground">
            Collected vs unpaid rent, last 6 months
          </p>
        </div>
        {hasBilledRent ? (
          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            {percent}% collected
          </span>
        ) : null}
      </div>

      {hasBilledRent ? (
        <ChartContainer config={collectionConfig} className="h-[260px] w-full">
          <BarChart data={chartData} barSize={36} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatPesoCompact(Number(value))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    formatPesoDisplay(Number(value)) || "₱ 0",
                    name === "unpaid" ? "Unpaid" : "Collected",
                  ]}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="collected" stackId="rent" fill="var(--color-collected)" />
            <Bar
              dataKey="unpaid"
              stackId="rent"
              fill="var(--color-unpaid)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      ) : (
        <ChartEmptyState
          title="No rent billed yet"
          description="Once rent comes due, collected and unpaid amounts show up here."
        />
      )}
    </div>
  );
}
