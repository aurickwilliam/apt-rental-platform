"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { COLORS } from "@repo/constants";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AnalyticsMetrics } from "../types";
import { numberFormat } from "./analytics-format";
import Panel from "./Panel";

const reviewConfig = {
  approved: { label: "Approved · in period", color: COLORS.light.success },
  rejected: { label: "Rejected · in period", color: "var(--destructive)" },
  pending: { label: "Pending · now", color: COLORS.light.warning },
} satisfies ChartConfig;

interface VerificationActivityPanelProps {
  metrics: Pick<
    AnalyticsMetrics,
    "userVerifications" | "apartmentVerifications"
  >;
}

export default function VerificationActivityPanel({
  metrics,
}: VerificationActivityPanelProps) {
  const reviews = [
    { name: "Account verification", ...metrics.userVerifications },
    { name: "Listing verification", ...metrics.apartmentVerifications },
  ];
  return (
    <Panel
      title="Verification Activity"
      description="Approved and rejected in the selected period · pending in the queue now"
    >
      {reviews.some((row) => row.approved + row.rejected + row.pending > 0) ? (
        <ChartContainer config={reviewConfig} className="mt-4 h-48 w-full">
          <BarChart data={reviews} layout="vertical" accessibilityLayer>
            <CartesianGrid
              horizontal={false}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            <XAxis
              type="number"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={136}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => String(label)}
                  formatter={(value, _name, item) => (
                    <span className="flex w-full items-center justify-between gap-4">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        {
                          reviewConfig[
                            item.dataKey as keyof typeof reviewConfig
                          ]?.label
                        }
                      </span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {numberFormat.format(Number(value))}
                      </span>
                    </span>
                  )}
                />
              }
            />
            <ChartLegend
              content={
                <ChartLegendContent className="flex-wrap gap-x-3 gap-y-1 text-xs" />
              }
            />
            <Bar
              dataKey="approved"
              stackId="decisions"
              fill="var(--color-approved)"
            />
            <Bar
              dataKey="rejected"
              stackId="decisions"
              fill="var(--color-rejected)"
            />
            <Bar
              dataKey="pending"
              stackId="decisions"
              fill="var(--color-pending)"
            />
          </BarChart>
        </ChartContainer>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          No verification decisions in this period or requests pending now.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          {numberFormat.format(metrics.userVerifications.pending)}{" "}
          {metrics.userVerifications.pending === 1 ? "account" : "accounts"}{" "}
          awaiting review
        </span>
        <span>
          {numberFormat.format(metrics.apartmentVerifications.pending)}{" "}
          {metrics.apartmentVerifications.pending === 1
            ? "listing"
            : "listings"}{" "}
          awaiting review
        </span>
      </div>
      <Link
        href="/admin/verification"
        className="mt-3 inline-block rounded-sm text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Review queue <span aria-hidden="true">→</span>
      </Link>
    </Panel>
  );
}
