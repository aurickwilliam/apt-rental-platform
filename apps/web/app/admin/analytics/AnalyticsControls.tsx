"use client";

import { useRouter } from "next/navigation";
import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import DateRangeControl from "../dashboard/components/DateRangeControl";

const PERIODS = [7, 30, 90, "all"] as const;

interface AnalyticsControlsProps {
  from: string;
  to: string;
  today: string;
  selectedPeriod: number | "all" | null;
}

export default function AnalyticsControls({
  from,
  to,
  today,
  selectedPeriod,
}: AnalyticsControlsProps) {
  const router = useRouter();

  function selectPeriod(period: number | "all"): void {
    router.push(`/admin/analytics?days=${period}`);
  }

  function selectRange(nextFrom: string, nextTo: string): void {
    router.push(`/admin/analytics?from=${nextFrom}&to=${nextTo}`);
  }

  const historyDays = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86400000,
  ) + 1;

  return (
    <section
      aria-label="Analytics reporting period"
      className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
    >
      <DateRangeControl
        from={from}
        to={to}
        today={today}
        maxRangeDays={Math.max(366, historyDays)}
        onRangeChange={selectRange}
      />
      <ToggleButtonGroup
        aria-label="Quick reporting periods"
        selectionMode="single"
        selectedKeys={
          selectedPeriod ? new Set([String(selectedPeriod)]) : new Set<string>()
        }
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0];
          if (selected) selectPeriod(selected === "all" ? "all" : Number(selected));
        }}
        className="shrink-0 self-start sm:self-auto"
      >
        {PERIODS.map((period, index) => (
          <ToggleButton
            key={period}
            id={String(period)}
            className="px-3 py-2 font-nunito text-sm font-semibold"
          >
            {index > 0 ? <ToggleButtonGroup.Separator /> : null}
            {period === "all" ? "All Time" : `${period} days`}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </section>
  );
}
