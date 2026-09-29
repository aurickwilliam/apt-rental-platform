"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import { CAMANAVA_CITIES } from "@repo/constants";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ListingCityCount } from "../types";
import { numberFormat } from "./analytics-format";
import Panel from "./Panel";

const cityConfig = {
  value: { label: "Listings", color: "var(--primary)" },
} satisfies ChartConfig;

interface ListingsByCityPanelProps {
  listingsByCity: ListingCityCount[] | null;
}

export default function ListingsByCityPanel({
  listingsByCity,
}: ListingsByCityPanelProps) {
  const cityCounts = new Map(
    listingsByCity?.map((row) => [row.city, row.listing_count]),
  );
  const cityBars = CAMANAVA_CITIES.map((name) => ({
    name,
    value: cityCounts.get(name) ?? 0,
  })).sort((a, b) => b.value - a.value);
  const unmatchedCityCount = cityCounts.get("Other") ?? 0;
  return (
    <Panel
      title="Listings by City"
      description="Current listing distribution across CAMANAVA."
    >
      {listingsByCity === null ? (
        <p
          className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground"
          role="status"
        >
          City distribution is unavailable. Refresh and try again.
        </p>
      ) : cityBars.some((row) => row.value > 0) ? (
        <>
          <ChartContainer config={cityConfig} className="mt-4 h-56 w-full">
            <BarChart
              data={cityBars}
              layout="vertical"
              accessibilityLayer
              margin={{ top: 4, right: 30, left: 0, bottom: 0 }}
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
                width={86}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) =>
                      String(payload[0]?.payload?.name ?? "")
                    }
                    formatter={(value) => (
                      <span className="flex w-full justify-between gap-4">
                        <span className="text-muted-foreground">Listings</span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {numberFormat.format(Number(value))}
                        </span>
                      </span>
                    )}
                  />
                }
              />
              <Bar
                dataKey="value"
                name="Listings"
                fill="var(--color-value)"
                maxBarSize={24}
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
          <p className="sr-only">
            {cityBars
              .map((row) => `${row.name}: ${row.value} listings.`)
              .join(" ")}
          </p>
        </>
      ) : (
        <p
          className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground"
          role="status"
        >
          No listings recorded in the four CAMANAVA cities.
        </p>
      )}
      {listingsByCity !== null && unmatchedCityCount > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {numberFormat.format(unmatchedCityCount)}{" "}
          {unmatchedCityCount === 1 ? "listing has" : "listings have"} a city
          outside these four labels and{" "}
          {unmatchedCityCount === 1 ? "is" : "are"} not shown.
        </p>
      ) : null}
    </Panel>
  );
}
