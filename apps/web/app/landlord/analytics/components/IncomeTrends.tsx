"use client";

import { useState } from "react";
import { Button, ButtonGroup } from "@heroui/react";
import {
  IconCalendarMonth,
  IconCalendarStats,
  IconCalendarWeek,
} from "@tabler/icons-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  financeIncome,
  financeMonthLabel,
  financeTrendWindow,
  toggleFinanceTrendSeries,
  type FinanceMonth,
  type FinanceTrendSeries,
} from "@repo/utils";
import FinanceCard from "./FinanceCard";
import FinanceMoneyRow, { financeMoney } from "./FinanceMoneyRow";

export default function IncomeTrends({
  months,
  onViewExpenses,
}: {
  months: FinanceMonth[];
  onViewExpenses: (month: string) => void;
}) {
  const [range, setRange] = useState(6);
  const [series, setSeries] = useState<FinanceTrendSeries>({
    collected: true,
    expenses: true,
    net: false,
  });
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const { points, allReviewed, hasActivity } = financeTrendWindow(
    months,
    range,
  );
  const selected =
    points.find((point) => point.month === selectedMonth) ?? points.at(-1);
  const chart = points.map((point) => ({
    ...point,
    expenses: point.operating + point.capital,
    net: financeIncome(point),
    label: financeMonthLabel(point.month).slice(0, 3),
  }));
  return (
    <FinanceCard
      title="Income trends"
      description="Cash collected and recorded spending. Select a month on the chart to inspect its figures."
      action={
        <ButtonGroup aria-label="Trend range">
          {(
            [
              [3, IconCalendarWeek],
              [6, IconCalendarMonth],
              [12, IconCalendarStats],
            ] as const
          ).map(([value, Icon]) => (
            <Button
              size="sm"
              key={value}
              variant="outline"
              className={range === value ? "finance-range-selected" : ""}
              aria-pressed={range === value}
              onPress={() => setRange(value)}
            >
              <Icon size={16} aria-hidden />
              {value}M
            </Button>
          ))}
        </ButtonGroup>
      }
    >
      {!hasActivity ? (
        <div className="py-8 text-center">
          <h3 className="font-nunito font-bold">No income activity yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Collected rent and recorded expenses will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" aria-label="Chart series">
            {(
              [
                ["collected", "● Collected"],
                ["expenses", "◆ Expenses"],
                ["net", "— Net income"],
              ] as const
            ).map(([key, label]) => (
              <Button
                key={key}
                size="sm"
                variant={series[key] ? "secondary" : "ghost"}
                aria-label={`Toggle ${key}`}
                aria-pressed={series[key]}
                isDisabled={key === "net" && !allReviewed}
                style={
                  key === "expenses"
                    ? { color: "var(--finance-expenses)" }
                    : undefined
                }
                onPress={() => setSeries(toggleFinanceTrendSeries(series, key))}
              >
                {label}
              </Button>
            ))}
          </div>
          <div
            role="group"
            tabIndex={0}
            aria-label="Income chart. Use the left and right arrow keys to choose a month."
            className="h-64 min-w-0 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-primary [&_.recharts-wrapper]:cursor-pointer! [&_.recharts-surface]:outline-none"
            onKeyDown={(event) => {
              const index = points.findIndex(
                (point) => point.month === selected?.month,
              );
              const target =
                event.key === "ArrowLeft"
                  ? points[Math.max(0, index - 1)]
                  : event.key === "ArrowRight"
                    ? points[Math.min(points.length - 1, index + 1)]
                    : event.key === "Home"
                      ? points[0]
                      : event.key === "End"
                        ? points.at(-1)
                        : undefined;
              if (!target) return;
              event.preventDefault();
              setSelectedMonth(target.month);
            }}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart
                data={chart}
                margin={{ top: 16, right: 8, left: 8, bottom: 4 }}
                onClick={(event) => {
                  if (event?.activeLabel !== undefined) {
                    const point = chart.find(
                      (item) => item.month === event.activeLabel,
                    );
                    if (point) setSelectedMonth(point.month);
                  }
                }}
              >
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickFormatter={(value: string) =>
                    financeMonthLabel(value).slice(0, 3)
                  }
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  width={68}
                  tickFormatter={(value: number) =>
                    `${value < 0 ? "−" : ""}₱${Math.abs(value) >= 1000 ? `${Math.round(Math.abs(value) / 1000)}k` : Math.abs(value)}`
                  }
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Tooltip
                  labelFormatter={(value) => financeMonthLabel(String(value))}
                  formatter={(value: number) => financeMoney(value)}
                  contentStyle={{
                    background: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: 10,
                    color: "var(--foreground)",
                    fontFamily: "var(--font-nunito), ui-sans-serif, sans-serif",
                  }}
                  labelStyle={{ fontWeight: 700 }}
                />
                {selected ? (
                  <ReferenceLine
                    x={selected.month}
                    stroke="var(--primary)"
                    strokeDasharray="4 4"
                    ifOverflow="extendDomain"
                  />
                ) : null}
                {series.collected ? (
                  <Bar
                    dataKey="collected"
                    name="● Collected"
                    fill="var(--brand)"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                ) : null}
                {series.expenses ? (
                  <Bar
                    dataKey="expenses"
                    name="◆ Expenses"
                    fill="var(--finance-expenses)"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                ) : null}
                {series.net && allReviewed ? (
                  <Line
                    dataKey="net"
                    name="— Net income"
                    stroke="var(--foreground)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {!allReviewed ? (
            <p className="text-xs text-muted-foreground">
              Review each month’s expenses to enable the net income line.
              Missing records aren’t assumed to be zero.
            </p>
          ) : null}
          {selected ? (
            <section
              aria-live="polite"
              aria-label="Selected month details"
              className="space-y-3 rounded-xl bg-background p-4"
            >
              <h3 className="font-nunito font-bold">
                {financeMonthLabel(selected.month)}
              </h3>
              <FinanceMoneyRow
                label="Collected rent"
                amount={selected.collected}
              />
              <FinanceMoneyRow
                label="Recorded expenses (including improvements)"
                amount={selected.operating + selected.capital}
              />
              <FinanceMoneyRow
                label="Net operating income"
                amount={financeIncome(selected)}
                emphasized
              />
              <Button
                size="sm"
                variant="tertiary"
                onPress={() => onViewExpenses(selected.month)}
              >
                View expenses for this month
              </Button>
            </section>
          ) : null}
        </>
      )}
    </FinanceCard>
  );
}
