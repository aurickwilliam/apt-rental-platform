import { Text, View } from "react-native";
import { Button } from "heroui-native";
import {
  IconPlus,
  IconShieldCheck,
  IconTargetArrow,
} from "@tabler/icons-react-native";
import {
  financeCategoryLabel,
  formatPesoDisplay,
  groupBudgetsByCategory,
  suggestFinanceBudget,
  type BudgetCategoryGroup,
  type BudgetKind,
  type FinanceBudget,
  type FinanceBudgetProgress,
  type FinanceCategory,
} from "@repo/utils";
import { FinanceCard, FinanceHeading, MoneyRow } from "./FinanceControls";
import BudgetProgressRow from "./BudgetProgressRow";
import EmptyState from "@/components/display/EmptyState";
import { useColors } from "@/hooks/useTheme";
import type { FinanceProperty } from "@/service/finance/financeService";

export default function BudgetProgressChart({
  budgets,
  properties,
  onEdit,
  onOpenGroup,
  onCreate,
}: {
  budgets: FinanceBudgetProgress[];
  properties: FinanceProperty[];
  onEdit: (budget: FinanceBudget) => void;
  onOpenGroup: (category: FinanceCategory, kind: BudgetKind) => void;
  onCreate: (category?: FinanceCategory, kind?: BudgetKind) => void;
}) {
  const { colors } = useColors();
  // One budget per property arrives from the report; the tab plans by category.
  const groups = groupBudgetsByCategory(budgets);
  const expenses = groups.filter((group) => group.kind === "expense");
  const reserves = groups.filter((group) => group.kind === "reserve");
  const scopeLabel = (group: BudgetCategoryGroup) => {
    if (group.entries.length > 1) return `${group.entries.length} properties`;
    const [entry] = group.entries;
    return (
      properties.find((property) => property.id === entry.apartmentId)?.name ??
      "1 property"
    );
  };
  return (
    <>
      <FinanceCard>
        <FinanceHeading
          title="Budget versus actual"
          description="Tap a category to see every property's limit and spending. Actual spending includes improvements in that category."
          action={
            <Button size="sm" variant="tertiary" onPress={() => onCreate()}>
              <IconPlus size={18} color={colors.textPrimary} />
              <Button.Label>Add</Button.Label>
            </Button>
          }
        />
        {expenses.length === 0 && (
          <EmptyState
            icon={<IconTargetArrow size={32} color={colors.gray500} />}
            title="No spending limits yet"
            description="Set spending limits for repairs, utilities and other property costs."
          />
        )}
        {expenses.map((group) => (
          <BudgetProgressRow
            key={`${group.kind}:${group.category}`}
            title={financeCategoryLabel(group.category)}
            caption={scopeLabel(group)}
            amount={group.amount}
            spent={group.spent}
            action="View properties"
            onPress={() => onOpenGroup(group.category, group.kind)}
          />
        ))}
      </FinanceCard>
      <FinanceCard>
        <FinanceHeading
          title="Planned reserves"
          description="Allocations for later—not expenses, account balances, or money already saved. Tap a category to see the properties it covers."
          action={
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => onCreate("emergency", "reserve")}
            >
              <IconPlus size={18} color={colors.textPrimary} />
              <Button.Label>Add</Button.Label>
            </Button>
          }
        />
        {reserves.length === 0 && (
          <EmptyState
            icon={<IconShieldCheck size={32} color={colors.gray500} />}
            title="No reserve goals yet"
            description="Plan a buffer for unexpected repairs, late payments, vacancies or replacements."
          />
        )}
        {reserves.map((group) => (
          <Button
            key={`${group.kind}:${group.category}`}
            variant="ghost"
            className="h-auto min-h-12 py-2"
            onPress={() => onOpenGroup(group.category, group.kind)}
            accessibilityLabel={`${financeCategoryLabel(group.category)}, ${scopeLabel(group)}. Planned ${formatPesoDisplay(group.amount)} this month. View properties`}
          >
            <View className="w-full gap-1">
              <MoneyRow
                label={financeCategoryLabel(group.category)}
                amount={group.amount}
              />
              <Text className="font-inter text-xs text-muted">
                {scopeLabel(group)} · planned this month
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
