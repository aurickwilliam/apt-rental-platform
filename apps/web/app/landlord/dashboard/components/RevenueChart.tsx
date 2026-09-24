"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { COLORS } from "@repo/constants";

import type { MonthlyRevenuePoint } from "../lib/get-dashboard-data";

const revenueConfig = {
  revenue: { label: "Revenue", color: COLORS.light.primary },
} satisfies ChartConfig;

type Props = {
  data: MonthlyRevenuePoint[];
};

export default function RevenueChart({ data }: Props) {
  return (
    <ChartContainer config={revenueConfig} className="h-[220px] w-full">
      <BarChart data={data} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => [`₱${Number(value).toLocaleString()}`, "Revenue"]}
            />
          }
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
