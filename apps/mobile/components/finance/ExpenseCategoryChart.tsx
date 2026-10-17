import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "heroui-native";
import {
  financeCategoryLabel,
  formatPesoDisplay,
  type FinanceCategory,
} from "@repo/utils";
import { FinanceCard, FinanceHeading, FinanceTabs } from "./FinanceControls";
import type { FinanceData } from "@/service/finance/financeService";

export default function ExpenseCategoryChart({
  categories,
  selected,
  onSelect,
}: {
  categories: FinanceData["categories"];
  selected: FinanceCategory | null;
  onSelect: (value: FinanceCategory | null) => void;
}) {
  const [mode, setMode] = useState("amount");
  const rows = [...categories]
    .filter((row) => (row.amount ?? 0) > 0 || row.previous_amount > 0)
    .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
  const total = rows.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const max = Math.max(1, ...rows.map((row) => row.amount ?? 0));
  return (
    <FinanceCard>
      <FinanceHeading
        title="Where expenses go"
        description="Tap a category to filter transactions. Bars represent recorded spending, including improvements."
      />
      <FinanceTabs
        value={mode}
        onChange={setMode}
        options={[
          { value: "amount", label: "Amount" },
          { value: "share", label: "% of expenses" },
        ]}
      />
      {rows.length === 0 && (
        <Text className="font-inter text-sm text-muted">
          No expenses recorded for this or the previous month.
        </Text>
      )}
      {rows.map((row) => {
        const amount = row.amount ?? 0;
        const percentage = total > 0 ? (amount / total) * 100 : 0;
        return (
          <View key={row.category} className="gap-2">
            <Button
              variant={selected === row.category ? "secondary" : "ghost"}
              className="h-auto min-h-12 py-2"
              onPress={() =>
                onSelect(selected === row.category ? null : row.category)
              }
              accessibilityLabel={`${financeCategoryLabel(row.category)}, ${formatPesoDisplay(amount)}, ${percentage.toFixed(0)} percent, previous period ${formatPesoDisplay(row.previous_amount)}`}
              accessibilityState={{ selected: selected === row.category }}
            >
              <View className="w-full gap-2">
                <View className="flex-row justify-between gap-3">
                  <Text className="font-nunitoSemiBold text-sm text-foreground flex-1">
                    {financeCategoryLabel(row.category)}
                  </Text>
                  <Text className="font-nunitoBold text-sm text-accent">
                    {mode === "amount"
                      ? formatPesoDisplay(amount)
                      : `${percentage.toFixed(0)}%`}
                  </Text>
                </View>
                <View className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
                  <View
                    className="h-full bg-accent rounded-full"
                    style={{
                      width: `${mode === "amount" ? (amount / max) * 100 : percentage}%`,
                    }}
                  />
                </View>
                <Text className="font-inter text-xs text-muted">
                  Previous comparable period:{" "}
                  {formatPesoDisplay(row.previous_amount)}
                </Text>
              </View>
            </Button>
          </View>
        );
      })}
      {selected && (
        <Button variant="tertiary" size="sm" onPress={() => onSelect(null)}>
          <Button.Label>Show all categories</Button.Label>
        </Button>
      )}
    </FinanceCard>
  );
}
