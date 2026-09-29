"use client";

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
import type { AnalyticsMetrics, AnalyticsTrend } from "../types";
import { bucketDateLabel, numberFormat, shortDate } from "./analytics-format";
import Panel from "./Panel";

const roleConfig = {
  tenants: { label: "Tenant", color: "var(--primary)" },
  landlords: { label: "Landlord", color: COLORS.light.secondary },
} satisfies ChartConfig;

interface NewUsersByRolePanelProps {
  metrics: Pick<AnalyticsMetrics, "users">;
  trends: AnalyticsTrend[] | null;
  period: string;
}

export default function NewUsersByRolePanel({
  metrics,
  trends,
  period,
}: NewUsersByRolePanelProps) {
  return (
    <Panel
      title="New Users by Role"
      description="New registrations grouped by their current roles."
      headerAccessory={
        <div
          className="flex flex-wrap gap-x-4 gap-y-1 font-nunito text-sm font-bold text-primary"
          aria-label="New registrations by role this period"
        >
          <span>{numberFormat.format(metrics.users.newTenants)} tenant</span>
          <span>
            {numberFormat.format(metrics.users.newLandlords)} landlord
          </span>
        </div>
      }
    >
      <p className="mt-2 text-xs text-muted-foreground">
        {period} (UTC) · Users with multiple roles may appear in more than one
        category.
      </p>
      {trends?.length ? (
        <>
          <ChartContainer
            config={roleConfig}
            className="mt-4 h-64 w-full sm:h-72"
          >
            <BarChart
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
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) =>
                      bucketDateLabel(
                        payload[0]?.payload as AnalyticsTrend | undefined,
                      )
                    }
                    formatter={(value, _name, item) => (
                      <span className="flex w-full items-center justify-between gap-4">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          {
                            roleConfig[item.dataKey as keyof typeof roleConfig]
                              ?.label
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
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="tenants"
                name="Tenant"
                stackId="roles"
                fill="var(--color-tenants)"
                maxBarSize={24}
              />
              <Bar
                dataKey="landlords"
                name="Landlord"
                stackId="roles"
                fill="var(--color-landlords)"
                maxBarSize={24}
              />
            </BarChart>
          </ChartContainer>
          <p className="sr-only">
            {trends
              .map(
                (point) =>
                  `${bucketDateLabel(point)}: ${point.tenants} tenants, ${point.landlords} landlords.`,
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
            ? "Role trend unavailable; period totals are shown above."
            : "No registration data for this period."}
        </p>
      )}
    </Panel>
  );
}
