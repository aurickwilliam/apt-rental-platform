import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "heroui-native";
import { financeIncome, formatPesoDisplay } from "@repo/utils";
import { FinanceCard, FinanceHeading, FinanceTabs } from "./FinanceControls";
import type { PropertyPerformance } from "@/service/finance/financeService";

export default function PropertyPerformanceChart({
  properties,
  onSelect,
}: {
  properties: PropertyPerformance[];
  onSelect: (id: string) => void;
}) {
  const [metric, setMetric] = useState("collected");
  const [expanded, setExpanded] = useState(false);
  const value = (property: PropertyPerformance) =>
    metric === "net"
      ? financeIncome(property)
      : metric === "expenses"
        ? property.operating + property.capital
        : property.collected;
  const ranked = [...properties].sort((a, b) => {
    const av = value(a);
    const bv = value(b);
    return av === null
      ? bv === null
        ? a.name.localeCompare(b.name)
        : 1
      : bv === null
        ? -1
        : bv - av;
  });
  const max = Math.max(
    1,
    ...ranked.map((property) => Math.abs(value(property) ?? 0)),
  );
  return (
    <FinanceCard>
      <FinanceHeading
        title="Property performance"
        description="Tap a property to focus the whole report."
      />
      <FinanceTabs
        value={metric}
        onChange={setMetric}
        options={[
          { value: "collected", label: "Collected" },
          { value: "expenses", label: "Expenses" },
          { value: "net", label: "Net income" },
        ]}
      />
      {(expanded ? ranked : ranked.slice(0, 3)).map((property) => {
        const amount = value(property);
        return (
          <Button
            key={property.id}
            variant="ghost"
            className="h-auto min-h-14 py-2"
            onPress={() => onSelect(property.id)}
            accessibilityLabel={`${property.name}, ${metric}, ${amount === null ? "expenses not reviewed" : formatPesoDisplay(amount)}. Filter this property.`}
          >
            <View className="w-full gap-2">
              <View className="flex-row justify-between gap-3">
                <Text className="font-nunitoSemiBold text-sm text-foreground flex-1">
                  {property.name}
                </Text>
                <Text
                  className={`font-nunitoBold text-sm ${amount !== null && amount < 0 ? "text-danger" : "text-accent"}`}
                >
                  {amount === null ? "Not reviewed" : formatPesoDisplay(amount)}{" "}
                  ›
                </Text>
              </View>
              {amount !== null && (
                <View className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${amount < 0 ? "bg-danger" : "bg-accent"}`}
                    style={{ width: `${(Math.abs(amount) / max) * 100}%` }}
                  />
                </View>
              )}
              {!property.reviewed && (
                <Text className="font-inter text-xs text-muted">
                  Expenses incomplete · net income unavailable
                </Text>
              )}
            </View>
          </Button>
        );
      })}
      {ranked.length > 3 && (
        <Button
          variant="tertiary"
          size="sm"
          onPress={() => setExpanded(!expanded)}
        >
          <Button.Label>
            {expanded ? "Show top 3" : `View all ${ranked.length} properties`}
          </Button.Label>
        </Button>
      )}
    </FinanceCard>
  );
}
