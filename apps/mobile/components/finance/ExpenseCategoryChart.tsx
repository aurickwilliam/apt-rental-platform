import { Text, View } from "react-native";
import { Button } from "heroui-native";
import { IconReceipt2 } from "@tabler/icons-react-native";
import {
  financeCategoryLabel,
  formatPesoDisplay,
  type FinanceCategory,
} from "@repo/utils";
import FinanceCard from "./FinanceCard";
import FinanceHeading from "./FinanceHeading";
import { FINANCE_CATEGORY_BACKGROUND_CLASSES } from "./financeCategoryStyles";
import EmptyState from "@/components/display/EmptyState";
import { useColors } from "@/hooks/useTheme";
import type { FinanceData } from "@/service/finance/financeService";

export default function ExpenseCategoryChart({
  categories,
  onSelect,
}: {
  categories: FinanceData["categories"];
  onSelect: (value: FinanceCategory) => void;
}) {
  const { colors } = useColors();
  const rows = [...categories]
    .filter((row) => (row.amount ?? 0) > 0 || row.previous_amount > 0)
    .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
  const total = rows.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const max = Math.max(1, ...rows.map((row) => row.amount ?? 0));
  return (
    <FinanceCard>
      <FinanceHeading
        title="Where expenses go"
        description="Tap a category to see its transactions. Bars represent recorded spending, including improvements."
      />
      {rows.length === 0 && (
        <EmptyState
          icon={<IconReceipt2 size={32} color={colors.gray500} />}
          title="No expenses recorded"
          description="Nothing recorded this month or the previous month."
        />
      )}
      {rows.map((row) => {
        const amount = row.amount ?? 0;
        const percentage = total > 0 ? (amount / total) * 100 : 0;
        return (
          <View key={row.category} className="gap-2">
            <Button
              variant="ghost"
              className={`h-auto min-h-12 rounded-2xl p-4 ${FINANCE_CATEGORY_BACKGROUND_CLASSES[row.category]}`}
              onPress={() => onSelect(row.category)}
              accessibilityLabel={`${financeCategoryLabel(row.category)}, ${formatPesoDisplay(amount)}, ${percentage.toFixed(0)} percent, previous period ${formatPesoDisplay(row.previous_amount)}`}
              accessibilityHint="Opens this category's transactions"
            >
              <View className="w-full gap-2">
                <View className="flex-row justify-between gap-3">
                  <Text className="font-nunitoSemiBold text-sm text-foreground flex-1">
                    {financeCategoryLabel(row.category)}
                  </Text>
                  <Text className="font-nunitoBold text-sm text-accent">
                    {formatPesoDisplay(amount)}
                  </Text>
                </View>
                <View className="h-2 rounded-full bg-background/70 overflow-hidden">
                  <View
                    className="h-full bg-accent rounded-full"
                    style={{
                      width: `${(amount / max) * 100}%`,
                    }}
                  />
                </View>
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="font-inter text-xs text-muted flex-1">
                    Previous comparable period:{" "}
                    {formatPesoDisplay(row.previous_amount)}
                  </Text>
                  <Text className="font-nunitoBold text-xs text-accent">
                    {percentage.toFixed(0)}%
                  </Text>
                </View>
              </View>
            </Button>
          </View>
        );
      })}
    </FinanceCard>
  );
}
