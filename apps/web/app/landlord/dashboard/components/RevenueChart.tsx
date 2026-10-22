"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { formatPesoCompact, formatPesoDisplay, monthLabel } from "@repo/utils";
import type { MonthlyRevenuePoint } from "@repo/utils";

const revenueConfig = {
  amount: { label: "Revenue", color: "var(--primary)" },
} satisfies ChartConfig;

type Props = {
  data: MonthlyRevenuePoint[];
};

export default function RevenueChart({ data }: Props) {
  const chartData = data.map((point) => ({
    month: monthLabel(point.month),
    amount: point.amount,
  }));

  return (
    <ChartContainer config={revenueConfig} className="h-[220px] w-full">
      <BarChart data={chartData} barSize={24}>
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
              formatter={(value) => [formatPesoDisplay(Number(value)) || "₱ 0", "Revenue"]}
            />
          }
        />
        <Bar dataKey="amount" fill="var(--color-amount)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
