"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AnalyticsMetrics } from "../types";
import { numberFormat } from "./analytics-format";
import Panel from "./Panel";

const applicationConfig = {
  value: { label: "Count", color: "var(--primary)" },
} satisfies ChartConfig;

interface ApplicationsTenanciesPanelProps {
  metrics: Pick<AnalyticsMetrics, "applications" | "tenancies">;
}

export default function ApplicationsTenanciesPanel({
  metrics,
}: ApplicationsTenanciesPanelProps) {
  const applicationActivity = [
    {
      name: "Applications submitted",
      value: metrics.applications.new,
      scope: "Period",
    },
    {
      name: "Approved applications",
      value: metrics.applications.approved,
      scope: "Period",
    },
    { name: "New tenancies", value: metrics.tenancies.new, scope: "Period" },
    {
      name: "Active tenancies",
      value: metrics.tenancies.active,
      scope: "Current",
    },
  ];
  return (
    <Panel
      title="Applications & Tenancies"
      description="Application and tenancy activity for the selected period. Active tenancies represent the current state."
    >
      <ChartContainer config={applicationConfig} className="mt-4 h-52 w-full">
        <BarChart
          data={applicationActivity}
          layout="vertical"
          accessibilityLayer
          margin={{ top: 4, right: 28, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            allowDecimals={false}
            domain={[0, (max: number) => Math.max(1, max + 1)]}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            width={160}
            tick={({ x, y, payload }) => (
              <g transform={`translate(${x},${y})`}>
                <text
                  x={-8}
                  y={-4}
                  textAnchor="end"
                  className="fill-foreground"
                  fontSize={11}
                >
                  {payload.value}
                </text>
                <text
                  x={-8}
                  y={10}
                  textAnchor="end"
                  className="fill-muted-foreground"
                  fontSize={10}
                >
                  {payload.value === "Active tenancies" ? "Current" : "Period"}
                </text>
              </g>
            )}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) =>
                  String(payload[0]?.payload?.name ?? "")
                }
                formatter={(value, _name, item) => (
                  <span className="flex w-full justify-between gap-4 text-foreground">
                    <span className="text-muted-foreground">
                      {item.payload.scope}
                    </span>
                    <span className="font-mono font-medium tabular-nums">
                      {numberFormat.format(Number(value))}
                    </span>
                  </span>
                )}
              />
            }
          />
          <Bar
            dataKey="value"
            name="Count"
            fill="var(--color-value)"
            maxBarSize={18}
            radius={[0, 4, 4, 0]}
          >
            <LabelList
              dataKey="value"
              position="right"
              className="fill-foreground"
              fontSize={11}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
      <p className="mt-3 text-xs text-muted-foreground">
        Approved applications were submitted in the period and are approved now.
        These counts are independent and should not be interpreted as a
        conversion funnel.
      </p>
    </Panel>
  );
}
