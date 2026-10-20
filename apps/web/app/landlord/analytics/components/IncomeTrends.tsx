"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
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
      description="Cash collected and recorded spending. Select a month to inspect its figures."
    >
      <div className="flex flex-wrap gap-2" aria-label="Trend range">
        {[3, 6, 12].map((value) => (
          <Button
            size="sm"
            key={value}
            variant={range === value ? "secondary" : "ghost"}
            aria-pressed={range === value}
            onPress={() => setRange(value)}
          >
            {value}M
          </Button>
        ))}
      </div>
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
                onPress={() => setSeries(toggleFinanceTrendSeries(series, key))}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="h-64 min-w-0" aria-hidden="true">
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
                  }}
                />
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
          <div className="flex flex-wrap gap-2" aria-label="Select chart month">
            {points.map((point) => (
              <Button
                key={point.month}
                size="sm"
                variant={
                  selected?.month === point.month ? "secondary" : "ghost"
                }
                aria-pressed={selected?.month === point.month}
                aria-label={`Inspect ${financeMonthLabel(point.month)}`}
                onPress={() => setSelectedMonth(point.month)}
              >
                {financeMonthLabel(point.month)}
              </Button>
            ))}
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
