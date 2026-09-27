"use client";

import { useCallback, useRef, useState } from "react";
import { createClient } from "@repo/supabase/browser";
import type { TrendPoint } from "../lib/get-dashboard-data";
import { TrendChart } from "./DashboardCharts";
import DateRangeControl from "./DateRangeControl";

interface DashboardTrendsProps {
  from: string;
  to: string;
  today: string;
  initialTrends: TrendPoint[];
  reportingPeriodError?: string;
}

function rangeKey(from: string, to: string): string {
  return `${from}:${to}`;
}

function updateRangeInUrl(from: string, to: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  window.history.replaceState(window.history.state, "", url);
}

export default function DashboardTrends({
  from,
  to,
  today,
  initialTrends,
  reportingPeriodError,
}: DashboardTrendsProps) {
  const initialKey = rangeKey(from, to);
  const trendsByRange = useRef(
    new Map<string, TrendPoint[]>([[initialKey, initialTrends]]),
  );
  const [trends, setTrends] = useState<TrendPoint[]>(initialTrends);
  const [activeRange, setActiveRange] = useState(initialKey);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRangeChange = useCallback(
    async (nextFrom: string, nextTo: string) => {
      const nextKey = rangeKey(nextFrom, nextTo);
      if (nextKey === activeRange) return;

      updateRangeInUrl(nextFrom, nextTo);
      setActiveRange(nextKey);
      setError(null);

      const cached = trendsByRange.current.get(nextKey);
      if (cached) {
        setTrends(cached);
        return;
      }

      setIsLoading(true);
      const supabase = createClient();
      const { data, error: queryError } = await supabase.rpc(
        "get_admin_dashboard_trends",
        { p_from: nextFrom, p_to: nextTo },
      );
      setIsLoading(false);

      if (queryError) {
        console.error("Admin dashboard trends failed", queryError);
        setError("Unable to update trends. Try another reporting period.");
        return;
      }

      const nextTrends = data ?? [];
      trendsByRange.current.set(nextKey, nextTrends);
      setTrends(nextTrends);
    },
    [activeRange],
  );

  return (
    <section aria-labelledby="trends-heading">
      <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="trends-heading" className="font-nunito text-xl font-bold">
            Platform trends
          </h2>
          <p className="text-sm text-muted-foreground">
            Activity in the selected period · Philippine time
          </p>
        </div>
        <DateRangeControl
          from={from}
          to={to}
          today={today}
          onRangeChange={handleRangeChange}
          errorMessage={reportingPeriodError}
        />
      </div>

      {error ? (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="relative">
        {isLoading ? (
          <p className="absolute right-0 top-0 text-xs text-muted-foreground">
            Updating trends…
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          <TrendChart
            data={trends}
            dataKey="users"
            title="New users"
            description="Accounts registered"
          />
          <TrendChart
            data={trends}
            dataKey="apartments"
            title="New apartments"
            description="Listings created"
            variant="bar"
          />
          <TrendChart
            data={trends}
            dataKey="reviews"
            title="Reviews completed"
            description="User and apartment decisions"
          />
        </div>
      </div>
    </section>
  );
}
