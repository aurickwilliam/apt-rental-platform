"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { numberFormat, percentFormat } from "./analytics-format";

interface StatusDonutProps {
  data: { name: string; value: number }[];
  config: ChartConfig;
  total: number;
  centerLabel: string;
  showPercent?: boolean;
  className?: string;
  chartClassName?: string;
}

export default function StatusDonut({
  data,
  config,
  total,
  centerLabel,
  showPercent = false,
  className = "",
  chartClassName = "",
}: StatusDonutProps) {
  return (
    <div
      className={`mt-4 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-10 ${className}`}
    >
      <div className={`relative size-52 shrink-0 ${chartClassName}`}>
        <ChartContainer config={config} className="size-full">
          <PieChart accessibilityLayer>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={72}
              stroke="none"
            >
              {data.map((item) => (
                <Cell key={item.name} fill={`var(--color-${item.name})`} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => (
                    <span className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {config[name]?.label}
                      </span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {numberFormat.format(Number(value))} (
                        {percentFormat.format(Number(value) / total)})
                      </span>
                    </span>
                  )}
                />
              }
            />
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-nunito text-3xl font-bold tabular-nums text-foreground">
            {numberFormat.format(total)}
          </span>
          <span className="text-xs text-muted-foreground">{centerLabel}</span>
        </div>
      </div>
      <dl className="w-full max-w-64 space-y-2 text-sm">
        {data.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-6"
          >
            <dt className="flex items-center gap-2 text-muted-foreground">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: config[item.name]?.color }}
              />
              {config[item.name]?.label}
            </dt>
            <dd className="font-nunito font-bold tabular-nums">
              {numberFormat.format(item.value)}
              {showPercent ? (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {percentFormat.format(item.value / total)}
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
