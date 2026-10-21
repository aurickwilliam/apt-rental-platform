import { Text, View } from "react-native";
import { Button } from "heroui-native";
import { financeCategoryLabel, formatPesoDisplay } from "@repo/utils";
import type { ExpenseRecord } from "@/service/finance/financeService";

export default function ExpenseTransactionRow({
  expense,
  propertyName,
  onPress,
}: {
  expense: ExpenseRecord;
  propertyName?: string;
  onPress: () => void;
}) {
  return (
    <View className="bg-surface rounded-3xl border border-border p-4">
      <Button
        variant="ghost"
        className="h-auto min-h-14 py-2"
        onPress={onPress}
        accessibilityLabel={`Edit ${expense.description}, ${formatPesoDisplay(expense.amount)}, paid ${expense.spent_on}`}
      >
        <View className="flex-1 gap-1">
          <View className="flex-row justify-between gap-3">
            <Text className="font-nunitoSemiBold text-sm text-foreground flex-1">
              {expense.description}
            </Text>
            <Text className="font-nunitoBold text-sm text-accent">
              {formatPesoDisplay(expense.amount)}
            </Text>
          </View>
          <Text className="font-inter text-xs text-muted">
            {expense.spent_on} · {financeCategoryLabel(expense.category)}
          </Text>
          <Text className="font-inter text-xs text-muted">
            {propertyName ? `${propertyName} · ` : ""}
            {expense.treatment === "capital"
              ? "Improvement / replacement"
              : "Operating"}
          </Text>
        </View>
      </Button>
    </View>
  );
}
