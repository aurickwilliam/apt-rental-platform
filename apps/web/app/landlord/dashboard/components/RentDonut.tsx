"use client";

import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { COLORS } from "@repo/constants";

import type { RentCollectionSlice } from "../lib/get-dashboard-data";
import ChartEmptyState from "./ChartEmptyState";

const rentConfig = {
  paid:    { label: "Paid",    color: COLORS.light.primary },
  pending: { label: "Pending", color: COLORS.light.secondary },
  overdue: { label: "Overdue", color: COLORS.light.danger },
} satisfies ChartConfig;

type Props = {
  data: RentCollectionSlice[];
  hasPayments: boolean;
};

export default function RentDonut({ data, hasPayments }: Props) {
  if (!hasPayments) {
    return (
      <ChartEmptyState
        title="No payment records yet"
        description="Rent collection will appear here once tenants start paying."
      />
    );
  }

  return (
    <ChartContainer config={rentConfig} className="h-[220px] w-full">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={`var(--color-${entry.name})`}
            />
          ))}
        </Pie>
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value) => [`${value} units`, ""]} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </PieChart>
    </ChartContainer>
  );
}
