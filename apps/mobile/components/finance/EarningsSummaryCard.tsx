import { useState } from "react";
import { Text, View } from "react-native";
import { Button, LinkButton, Separator } from "heroui-native";
import {
  financeAfterReserve,
  financeComparisonSentence,
  financeIncome,
  financeMonthLabel,
  formatPesoDisplay,
  manilaToday,
} from "@repo/utils";
import { MoneyRow } from "./FinanceControls";
import FinanceGuidelinesDialog from "./FinanceGuidelinesDialog";
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
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const active = data.months.at(-1)!;
  const income = financeIncome(active);
  const reserve = data.budgets
    .filter((budget) => budget.kind === "reserve")
    .reduce((sum, budget) => sum + budget.amount, 0);
  const today = manilaToday();
  const currentMonth = month === today.slice(0, 7);
  const comparison = financeComparisonSentence(
    currentMonth,
    active,
    data.comparison,
    formatPesoDisplay,
  );

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
          {comparison}
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
            <LinkButton
              className="self-start"
              onPress={() => setGuidelinesOpen(true)}
            >
              <LinkButton.Label className="text-sm font-nunitoSemiBold text-accent underline">
                How these figures are calculated
              </LinkButton.Label>
            </LinkButton>
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
      <FinanceGuidelinesDialog
        isOpen={guidelinesOpen}
        onOpenChange={setGuidelinesOpen}
      />
    </View>
  );
}
