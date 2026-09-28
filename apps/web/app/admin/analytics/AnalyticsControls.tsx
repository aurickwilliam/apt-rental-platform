"use client";

import { useRouter } from "next/navigation";
import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import DateRangeControl from "../dashboard/components/DateRangeControl";

const PERIODS = [7, 30, 90] as const;

interface AnalyticsControlsProps {
  from: string;
  to: string;
  today: string;
  selectedDays: number | null;
}

export default function AnalyticsControls({
  from,
  to,
  today,
  selectedDays,
}: AnalyticsControlsProps) {
  const router = useRouter();

  function selectPeriod(days: number): void {
    router.push(`/admin/analytics?days=${days}`);
  }

  function selectRange(nextFrom: string, nextTo: string): void {
    router.push(`/admin/analytics?from=${nextFrom}&to=${nextTo}`);
  }

  return (
    <section
      aria-label="Analytics reporting period"
      className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
    >
      <DateRangeControl
        from={from}
        to={to}
        today={today}
        maxRangeDays={366}
        onRangeChange={selectRange}
      />
      <ToggleButtonGroup
        aria-label="Quick reporting periods"
        selectionMode="single"
        selectedKeys={
          selectedDays ? new Set([String(selectedDays)]) : new Set<string>()
        }
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0];
          if (selected) selectPeriod(Number(selected));
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
            {period} days
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </section>
  );
}
