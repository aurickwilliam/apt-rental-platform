import { Text, View } from "react-native";
import { Button } from "heroui-native";
import {
  financeCategoryLabel,
  formatPesoDisplay,
  suggestFinanceBudget,
  type BudgetKind,
  type FinanceBudget,
  type FinanceCategory,
} from "@repo/utils";
import { FinanceCard, FinanceHeading, MoneyRow } from "./FinanceControls";
import type { FinanceProperty } from "@/service/finance/financeService";

export type SpendingBudget = FinanceBudget & { spent: number };

export default function BudgetProgressChart({
  budgets,
  properties,
  onEdit,
  onCreate,
}: {
  budgets: SpendingBudget[];
  properties: FinanceProperty[];
  onEdit: (budget: FinanceBudget) => void;
  onCreate: (category?: FinanceCategory, kind?: BudgetKind) => void;
}) {
  const expenses = budgets.filter((budget) => budget.kind === "expense");
  const reserves = budgets.filter((budget) => budget.kind === "reserve");
  return (
    <>
      <FinanceCard>
        <FinanceHeading
          title="Budget versus actual"
          description="Tap a budget to edit its limit or goal. Actual spending includes improvements in that category."
          action={
            <Button size="sm" variant="tertiary" onPress={() => onCreate()}>
              <Button.Label>Add</Button.Label>
            </Button>
          }
        />
        {expenses.length === 0 && (
          <Text className="font-inter text-sm text-muted">
            Set spending limits for repairs, utilities and other property costs.
          </Text>
        )}
        {expenses.map((budget) => {
          const over = budget.spent > budget.amount;
          return (
            <Button
              key={budget.id}
              variant="ghost"
              className="h-auto min-h-14 py-2"
              onPress={() => onEdit(budget)}
              accessibilityLabel={`${financeCategoryLabel(budget.category)}, spent ${formatPesoDisplay(budget.spent)} of ${formatPesoDisplay(budget.amount)}. ${over ? "Over budget" : "Within budget"}. Edit budget.`}
            >
              <View className="w-full gap-2">
                <Text className="font-nunitoSemiBold text-sm text-foreground">
                  {financeCategoryLabel(budget.category)}
                </Text>
                <Text className="font-inter text-xs text-muted">
                  {
                    properties.find(
                      (property) => property.id === budget.apartment_id,
                    )?.name
                  }
                </Text>
                <Text className="font-nunitoBold text-sm text-foreground">
                  {formatPesoDisplay(budget.spent)} /{" "}
                  {formatPesoDisplay(budget.amount)}
                </Text>
                <View className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${over ? "bg-danger" : "bg-accent"}`}
                    style={{
                      width: `${budget.amount > 0 ? Math.min(100, (budget.spent / budget.amount) * 100) : budget.spent > 0 ? 100 : 0}%`,
                    }}
                  />
                </View>
                <Text
                  className={`font-inter text-xs ${over ? "text-danger" : "text-muted"}`}
                >
                  {formatPesoDisplay(Math.abs(budget.amount - budget.spent))}{" "}
                  {over
                    ? `over budget${budget.amount > 0 ? ` · ${Math.round((budget.spent / budget.amount) * 100)}% used` : ""}`
                    : "remaining"}
                </Text>
              </View>
            </Button>
          );
        })}
      </FinanceCard>
      <FinanceCard>
        <FinanceHeading
          title="Planned reserves"
          description="Allocations for later—not expenses, account balances, or money already saved."
          action={
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => onCreate("emergency", "reserve")}
            >
              <Button.Label>Add</Button.Label>
            </Button>
          }
        />
        {reserves.length === 0 && (
          <Text className="font-inter text-sm text-muted">
            Plan a buffer for unexpected repairs, late payments, vacancies or
            replacements.
          </Text>
        )}
        {reserves.map((budget) => (
          <Button
            key={budget.id}
            variant="ghost"
            className="h-auto min-h-12 py-2"
            onPress={() => onEdit(budget)}
          >
            <View className="w-full gap-1">
              <MoneyRow
                label={financeCategoryLabel(budget.category)}
                amount={budget.amount}
              />
              <Text className="font-inter text-xs text-muted">
                {
                  properties.find(
                    (property) => property.id === budget.apartment_id,
                  )?.name
                }{" "}
                · planned this month
              </Text>
            </View>
          </Button>
        ))}
      </FinanceCard>
      <FinanceCard>
        <FinanceHeading
          title="Budget suggestions"
          description="Transparent starting points. Use your bills and goals, not assumed market costs."
        />
        {budgets
          .filter((budget) => suggestFinanceBudget(budget))
          .map((budget) => {
            const suggestion = suggestFinanceBudget(budget)!;
            return (
              <View
                key={budget.id}
                className="gap-2 border-b border-border pb-3"
              >
                <Text className="font-nunitoSemiBold text-sm text-foreground">
                  {suggestion.title}
                </Text>
                <Text className="font-inter text-xs text-muted">
                  {
                    properties.find(
                      (property) => property.id === budget.apartment_id,
                    )?.name
                  }{" "}
                  · Based on your entries
                </Text>
                <Text className="font-nunitoBold text-lg text-accent">
                  {formatPesoDisplay(suggestion.amount)} / month
                </Text>
                <Text className="font-inter text-xs text-muted">
                  {suggestion.basis}
                </Text>
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() =>
                    onEdit({ ...budget, amount: suggestion.amount })
                  }
                >
                  <Button.Label>Review suggestion</Button.Label>
                </Button>
              </View>
            );
          })}
        {(
          [
            [
              "insurance",
              "reserve",
              "Insurance & property tax",
              "Spread your known annual bill over 12 months. Enter the bill to calculate a monthly allocation.",
            ],
            [
              "furniture",
              "reserve",
              "Furniture & appliances",
              "Enter the replacement amount still needed and the number of months until purchase.",
            ],
            [
              "vacancy",
              "reserve",
              "Vacancy & late payments",
              "Choose a buffer target based on essential property costs. Unpaid rent itself is not an expense.",
            ],
            [
              "turnover",
              "reserve",
              "Next tenant turnover",
              "Plan for cleaning, repainting and refurbishment before the next move-in.",
            ],
          ] as const
        ).map(([category, kind, title, description]) => (
          <View key={category} className="gap-2">
            <Text className="font-nunitoSemiBold text-sm text-foreground">
              {title}
            </Text>
            <Text className="font-inter text-sm text-muted">{description}</Text>
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => onCreate(category, kind)}
            >
              <Button.Label>Set a goal</Button.Label>
            </Button>
          </View>
        ))}
      </FinanceCard>
    </>
  );
}
