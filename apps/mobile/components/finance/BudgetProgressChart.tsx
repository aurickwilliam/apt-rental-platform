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
  type BudgetCategoryGroup,
  type BudgetKind,
  type FinanceBudgetProgress,
  type FinanceCategory,
} from "@repo/utils";
import FinanceCard from "./FinanceCard";
import FinanceHeading from "./FinanceHeading";
import BudgetProgressRow from "./BudgetProgressRow";
import { FINANCE_CATEGORY_BACKGROUND_CLASSES } from "./financeCategoryStyles";
import EmptyState from "@/components/display/EmptyState";
import { useColors } from "@/hooks/useTheme";
import type { FinanceProperty } from "@/service/finance/financeService";

export default function BudgetProgressChart({
  budgets,
  properties,
  onOpenGroup,
  onCreate,
}: {
  budgets: FinanceBudgetProgress[];
  properties: FinanceProperty[];
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
          title="Budget Versus Actual"
          description="Tap a category to compare each property's budget and spending, including improvements."
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
        <View className="gap-3">
          {expenses.map((group) => (
            <BudgetProgressRow
              key={`${group.kind}:${group.category}`}
              title={financeCategoryLabel(group.category)}
              category={group.category}
              caption={scopeLabel(group)}
              amount={group.amount}
              spent={group.spent}
              action="View properties"
              onPress={() => onOpenGroup(group.category, group.kind)}
            />
          ))}
        </View>
      </FinanceCard>

      <FinanceCard>
        <FinanceHeading
          title="Planned Reserves"
          description="Plan future reserves by category and property. These aren't expenses or saved balances."
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
        <View className="gap-3">
          {reserves.map((group) => (
            <Button
              key={`${group.kind}:${group.category}`}
              variant="ghost"
              className={`h-auto min-h-12 rounded-2xl p-4 ${FINANCE_CATEGORY_BACKGROUND_CLASSES[group.category]}`}
              onPress={() => onOpenGroup(group.category, group.kind)}
              accessibilityLabel={`${financeCategoryLabel(group.category)}. For ${group.entries.length} ${group.entries.length === 1 ? "property" : "properties"} this month. Planned ${formatPesoDisplay(group.amount)}. View properties`}
            >
              <View className="w-full gap-1">
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="font-nunitoSemiBold text-base text-foreground flex-1">
                    {financeCategoryLabel(group.category)}
                  </Text>
                  <Text
                    selectable
                    className="font-nunitoSemiBold text-sm text-foreground"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {formatPesoDisplay(group.amount)}
                  </Text>
                </View>
                <Text className="font-inter text-xs text-muted">
                  For {group.entries.length}{" "}
                  {group.entries.length === 1 ? "property" : "properties"} this
                  month
                </Text>
              </View>
            </Button>
          ))}
        </View>
      </FinanceCard>
    </>
  );
}
