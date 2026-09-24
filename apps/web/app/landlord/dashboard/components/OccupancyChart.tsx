"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { COLORS } from "@repo/constants";

import ChartEmptyState from "./ChartEmptyState";

const occupancyConfig = {
  rate: { label: "Occupancy %", color: COLORS.light.primary },
} satisfies ChartConfig;

export interface OccupancyPoint {
  month: string;
  rate: number;
}

type Props = {
  /** Null until occupancy history is tracked — no historical snapshots exist yet. */
  data: OccupancyPoint[] | null;
};

export default function OccupancyChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <ChartEmptyState
        title="No occupancy history yet"
        description="Trends will appear here once occupancy is tracked over time."
      />
    );
  }

  return (
    <ChartContainer config={occupancyConfig} className="h-[200px] w-full">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="var(--color-rate)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--color-rate)" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => `${v}%`}
          domain={[0, 100]}
        />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value) => [`${value}%`, "Occupancy"]} />}
        />
        <Area
          type="monotone"
          dataKey="rate"
          stroke="var(--color-rate)"
          strokeWidth={2}
          fill="url(#occupancyGradient)"
          dot={{ fill: "var(--color-rate)", r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
