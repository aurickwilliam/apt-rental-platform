"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { COLORS } from "@repo/constants";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AnalyticsMetrics, AnalyticsTrend } from "../types";
import { bucketDateLabel, numberFormat, shortDate } from "./analytics-format";
import Panel from "./Panel";

const growthConfig = {
  users: { label: "New users", color: "var(--primary)" },
  apartments: { label: "New listings", color: COLORS.light.secondary },
} satisfies ChartConfig;

interface PlatformGrowthPanelProps {
  metrics: Pick<AnalyticsMetrics, "users" | "apartments">;
  trends: AnalyticsTrend[] | null;
  period: string;
}

export default function PlatformGrowthPanel({
  metrics,
  trends,
  period,
}: PlatformGrowthPanelProps) {
  return (
    <Panel
      title="Platform Growth"
      description="New accounts and listings during the selected reporting period."
      headerAccessory={
        <div
          className="flex flex-wrap gap-x-4 gap-y-1 font-nunito text-sm font-bold text-primary"
          aria-label="Growth totals for this period"
        >
          <span>
            {numberFormat.format(metrics.users.new)} new{" "}
            {metrics.users.new === 1 ? "user" : "users"}
          </span>
          <span>
            {numberFormat.format(metrics.apartments.new)} new{" "}
            {metrics.apartments.new === 1 ? "listing" : "listings"}
          </span>
        </div>
      }
    >
      <p className="mt-2 text-xs text-muted-foreground">{period} (UTC)</p>
      {trends?.length ? (
        <>
          <ChartContainer
            config={growthConfig}
            className="mt-4 h-64 w-full sm:h-72"
          >
            <LineChart
              data={trends}
              accessibilityLayer
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="bucket_start"
                tickFormatter={shortDate}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <ChartTooltip
                cursor={{ stroke: "var(--border)" }}
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => (
                      <span className="flex w-full items-center justify-between gap-4">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          {
                            growthConfig[
                              item.dataKey as keyof typeof growthConfig
                            ]?.label
                          }
                        </span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {numberFormat.format(Number(value))}
                        </span>
                      </span>
                    )}
                    labelFormatter={(_, payload) => {
                      const row = payload[0]?.payload as
                        AnalyticsTrend | undefined;
                      return bucketDateLabel(row);
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                dataKey="users"
                name="New users"
                type="linear"
                stroke="var(--color-users)"
                strokeWidth={2}
                dot={trends.length === 1}
                activeDot={{ r: 5 }}
              />
              <Line
                dataKey="apartments"
                name="New listings"
                type="linear"
                stroke="var(--color-apartments)"
                strokeWidth={2}
                dot={trends.length === 1}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
          <p className="sr-only">
            {trends
              .map(
                (point) =>
                  `${shortDate(point.bucket_start)} to ${shortDate(point.bucket_end)}: ${point.users} users, ${point.apartments} listings.`,
              )
              .join(" ")}
          </p>
        </>
      ) : (
        <p
          className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground"
          role="status"
        >
          {trends === null
            ? "Growth trend unavailable; period totals are shown above."
            : "No growth data for this period."}
        </p>
      )}
    </Panel>
  );
}
