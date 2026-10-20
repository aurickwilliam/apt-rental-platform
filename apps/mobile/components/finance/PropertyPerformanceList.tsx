import { Text, View } from "react-native";
import { Button } from "heroui-native";
import { IconChevronRight } from "@tabler/icons-react-native";
import {
  financePerformanceValue,
  formatPesoDisplay,
  rankFinanceProperties,
  type PropertyPerformanceMetric,
} from "@repo/utils";
import { FinanceTabs } from "./FinanceControls";
import { useColors } from "@/hooks/useTheme";
import type { PropertyPerformance } from "@/service/finance/financeService";

export type { PropertyPerformanceMetric };

const METRIC_OPTIONS: { value: PropertyPerformanceMetric; label: string }[] = [
  { value: "collected", label: "Collected" },
  { value: "expenses", label: "Expenses" },
  { value: "net", label: "Net income" },
];

export function PropertyPerformanceTabs({
  value,
  onChange,
}: {
  value: PropertyPerformanceMetric;
  onChange: (value: PropertyPerformanceMetric) => void;
}) {
  return (
    <FinanceTabs
      value={value}
      onChange={(nextValue) => onChange(nextValue as PropertyPerformanceMetric)}
      options={METRIC_OPTIONS}
    />
  );
}

/** Ranked property rows, shared by the overview card and its full page. */
export default function PropertyPerformanceList({
  properties,
  metric,
  onSelect,
  limit,
}: {
  properties: PropertyPerformance[];
  metric: PropertyPerformanceMetric;
  /** When set, rows focus the whole report through this callback. */
  onSelect?: (id: string) => void;
  /** Caps the ranked list; the overview card shows its best few. */
  limit?: number;
}) {
  const { colors } = useColors();
  const ranked = rankFinanceProperties(properties, metric);
  const max = Math.max(
    1,
    ...ranked.map((property) =>
      Math.abs(financePerformanceValue(property, metric) ?? 0),
    ),
  );
  const visible = limit === undefined ? ranked : ranked.slice(0, limit);
  return (
    <>
      {visible.map((property) => {
        const amount = financePerformanceValue(property, metric);
        const details = (
          <View className="w-full gap-2">
            <View className="flex-row justify-between gap-3">
              <Text className="font-nunitoSemiBold text-sm text-foreground flex-1">
                {property.name}
              </Text>
              <Text
                className={`font-nunitoBold text-sm ${amount !== null && amount < 0 ? "text-danger" : "text-accent"}`}
              >
                {amount === null ? "Not reviewed" : formatPesoDisplay(amount)}
              </Text>
              {onSelect && (
                <IconChevronRight size={18} color={colors.textPrimary} />
              )}
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
        );
        if (!onSelect) {
          return (
            <View key={property.id} className="min-h-14 justify-center py-2">
              {details}
            </View>
          );
        }
        return (
          <Button
            key={property.id}
            variant="ghost"
            className="h-auto min-h-14 py-2"
            onPress={() => onSelect(property.id)}
            accessibilityLabel={`${property.name}, ${metric}, ${amount === null ? "expenses not reviewed" : formatPesoDisplay(amount)}. Filter this property.`}
          >
            {details}
          </Button>
        );
      })}
    </>
  );
}
