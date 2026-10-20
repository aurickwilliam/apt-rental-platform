"use client";

import { useState } from "react";
import { Button, Separator } from "@heroui/react";
import {
  financeAfterReserve,
  financeComparisonSentence,
  financeIncome,
  financeMonthLabel,
  financePlanTotals,
  formatPesoDisplay,
  type FinanceData,
} from "@repo/utils";
import FinanceMoneyRow, { financeMoney } from "./FinanceMoneyRow";

interface EarningsSummaryProps {
  data: FinanceData;
  month: string;
  currentMonth: string;
  onReview: () => void;
  onGuidelines: () => void;
}

export default function EarningsSummary({
  data,
  month,
  currentMonth,
  onReview,
  onGuidelines,
}: EarningsSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const active = data.months.at(-1)!;
  const income = financeIncome(active);
  const { reserve } = financePlanTotals(data.budgets);
  return (
    <section
      className="overflow-hidden rounded-xl border border-border bg-card"
      aria-label="Earnings summary"
    >
      <div className="space-y-2 bg-secondary p-5">
        <h2 className="font-nunito text-sm font-semibold">
          {income === null ? "Collected rent" : "Net operating income"}
        </h2>
        <p className="wrap-break-word font-nunito text-3xl font-bold tabular-nums text-brand sm:text-4xl">
          {financeMoney(income ?? active.collected)}
        </p>
        <p className="text-xs text-muted-foreground">
          {financeMonthLabel(month)} ·{" "}
          {month === currentMonth ? "month to date" : "completed month"}
        </p>
        <p className="text-xs text-muted-foreground">
          {financeComparisonSentence(
            month === currentMonth,
            active,
            data.comparison,
            formatPesoDisplay,
          )}
        </p>
      </div>
      <div className="space-y-4 p-4">
        <FinanceMoneyRow
          label="Recorded spending"
          amount={active.operating + active.capital}
        />
        <FinanceMoneyRow
          label="After spending & planned reserves"
          amount={financeAfterReserve(active, reserve)}
          emphasized
        />
        <div className="flex flex-wrap gap-2">
          {income === null ? (
            <Button variant="secondary" size="sm" onPress={onReview}>
              Review expenses to calculate income
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={expanded}
            aria-controls="finance-breakdown"
            onPress={() => setExpanded(!expanded)}
          >
            {expanded ? "Hide breakdown" : "View breakdown & calculation"}
          </Button>
        </div>
        {expanded ? (
          <div id="finance-breakdown" className="space-y-3">
            <Separator />
            <FinanceMoneyRow label="Collected rent" amount={active.collected} />
            <FinanceMoneyRow
              label="Recorded operating expenses"
              amount={active.operating}
            />
            <FinanceMoneyRow
              label="Net operating income"
              amount={income}
              emphasized
            />
            <Separator />
            <FinanceMoneyRow
              label="Improvements / replacements paid"
              amount={active.capital}
            />
            <FinanceMoneyRow
              label="Planned reserves (not spent)"
              amount={reserve}
            />
            <Button
              variant="ghost"
              size="sm"
              className="text-brand underline"
              onPress={onGuidelines}
            >
              How these figures are calculated
            </Button>
          </div>
        ) : null}
        {data.unclassified > 0 ? (
          <p className="text-xs text-muted-foreground">
            {financeMoney(data.unclassified)} in unclassified payments excluded.
            These records lack a tenancy or rental period, so they cannot safely
            be treated as rent.
          </p>
        ) : null}
      </div>
    </section>
  );
}
