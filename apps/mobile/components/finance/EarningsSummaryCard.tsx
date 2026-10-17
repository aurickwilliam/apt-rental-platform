import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Separator } from "heroui-native";
import {
  financeAfterReserve,
  financeIncome,
  financeMonthLabel,
  formatPesoDisplay,
  manilaToday,
} from "@repo/utils";
import { MoneyRow } from "./FinanceControls";
import type { FinanceData } from "@/service/finance/financeService";

interface EarningsSummaryCardProps {
  data: FinanceData;
  month: string;
  onReview: () => void;
}

export default function EarningsSummaryCard({
  data,
  month,
  onReview,
}: EarningsSummaryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const active = data.months.at(-1)!;
  const income = financeIncome(active);
  const reserve = data.budgets
    .filter((budget) => budget.kind === "reserve")
    .reduce((sum, budget) => sum + budget.amount, 0);
  const today = manilaToday();
  const currentMonth = month === today.slice(0, 7);
  const canCompareIncome = income !== null && data.comparison.reviewed;
  const delta = canCompareIncome
    ? income - (data.comparison.collected - data.comparison.operating)
    : active.collected - data.comparison.collected;
  const metric = canCompareIncome ? "operating income" : "collected rent";
  const comparison = currentMonth
    ? "same elapsed days last month"
    : "last month";

  return (
    <View className="bg-surface border border-border rounded-3xl overflow-hidden">
      <View className="bg-primary-light p-5 gap-2">
        <Text className="font-nunitoSemiBold text-sm text-foreground">
          {income === null ? "Collected rent" : "Net operating income"}
        </Text>
        <Text
          selectable
          className="font-nunitoBold text-3xl text-accent"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {formatPesoDisplay(income ?? active.collected)}
        </Text>
        <Text className="font-inter text-xs text-muted">
          {financeMonthLabel(month)}
          {currentMonth ? " · month to date" : " · completed month"}
        </Text>
        <Text className="font-inter text-xs text-muted">
          {delta === 0
            ? `No change in ${metric}`
            : `${delta > 0 ? "↑" : "↓"} ${formatPesoDisplay(Math.abs(delta))} ${delta > 0 ? "more" : "less"} ${metric}`}{" "}
          vs {comparison}
        </Text>
      </View>
      <View className="p-4 gap-3">
        <MoneyRow
          label="Recorded spending"
          amount={active.operating + active.capital}
        />
        <MoneyRow
          label="After spending & planned reserves"
          amount={financeAfterReserve(active, reserve)}
          emphasized
        />
        {income === null && (
          <Button variant="secondary" size="sm" onPress={onReview}>
            <Button.Label>Review expenses to calculate income</Button.Label>
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onPress={() => setExpanded(!expanded)}
          accessibilityState={{ expanded }}
        >
          <Button.Label>
            {expanded ? "Hide breakdown" : "View breakdown & calculation"}
          </Button.Label>
        </Button>
        {expanded && (
          <View className="gap-3">
            <Separator />
            <MoneyRow label="Collected rent" amount={active.collected} />
            <MoneyRow
              label="Recorded operating expenses"
              amount={active.operating}
            />
            <MoneyRow label="Net operating income" amount={income} emphasized />
            <Separator />
            <MoneyRow
              label="Improvements / replacements paid"
              amount={active.capital}
            />
            <MoneyRow label="Planned reserves (not spent)" amount={reserve} />
            <Text className="font-inter text-xs text-muted leading-5">
              Only confirmed rent payments linked to a tenancy and rental period
              count as collected rent. Untagged payments and security deposits
              are excluded. Operating income is cash-based and excludes
              improvements, loan payments, depreciation and reserve allocations;
              it is not taxable profit or an account balance. Cash after
              spending also subtracts improvements and planned reserves. Review
              all selected properties’ expenses, including zero-spending months.
              Expense edits reopen review.
            </Text>
            <Text className="font-inter text-xs text-muted">
              Payment dates use the recorded payment date. Current-month results
              are through {today}; the comparison uses equivalent elapsed days,
              clamped to the previous month’s end.
            </Text>
          </View>
        )}
        {data.unclassified > 0 && (
          <Text className="font-inter text-xs text-warning-text">
            {formatPesoDisplay(data.unclassified)} in unclassified payments
            excluded. These records lack a tenancy or rental period, so they
            cannot safely be treated as rent.
          </Text>
        )}
      </View>
    </View>
  );
}
