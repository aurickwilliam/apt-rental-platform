"use client";

import { useState } from "react";
import { Button, Link, Separator } from "@heroui/react";
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
import FinanceModal from "./FinanceModal";

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
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const active = data.months.at(-1)!;
  const income = financeIncome(active);
  const { reserve } = financePlanTotals(data.budgets);
  return (
    <section
      className="overflow-hidden rounded-3xl border border-border bg-card"
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
            aria-haspopup="dialog"
            onPress={() => setBreakdownOpen(true)}
          >
            View breakdown & calculation
          </Button>
        </div>
        {data.unclassified > 0 ? (
          <p className="text-xs text-muted-foreground">
            {financeMoney(data.unclassified)} in unclassified payments excluded.
            These records lack a tenancy or rental period, so they cannot safely
            be treated as rent.
          </p>
        ) : null}
      </div>
      {breakdownOpen ? (
        <FinanceModal
          title="Breakdown & calculation"
          description={`${financeMonthLabel(month)} · how the summary figures add up.`}
          onClose={() => setBreakdownOpen(false)}
        >
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
          {/* HeroUI Link without href: an action styled as a link (mobile's LinkButton). */}
          <Link
            className="cursor-pointer text-primary"
            onPress={() => {
              setBreakdownOpen(false);
              onGuidelines();
            }}
          >
            How these figures are calculated
          </Link>
        </FinanceModal>
      ) : null}
    </section>
  );
}
