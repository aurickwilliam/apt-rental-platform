import { Pressable, Text, View } from "react-native";
import { Button } from "heroui-native";
import { formatPesoDisplay } from "@repo/utils";
import { useColors } from "@/hooks/useTheme";
import { FinanceCard, FinanceHeading, MoneyRow } from "./FinanceControls";
import type {
  CollectionStatus,
  FinanceData,
} from "@/service/finance/financeService";

export default function CollectionHealthChart({
  data,
  onSelect,
}: {
  data: FinanceData["collections"];
  onSelect: (status: CollectionStatus) => void;
}) {
  const { colors } = useColors();
  const segments = [
    {
      id: "collected",
      label: "Collected",
      amount: data.collected,
      color: colors.primary,
    },
    {
      id: "pending",
      label: "Not yet due",
      amount: data.pending,
      color: colors.chartSky,
    },
    {
      id: "overdue",
      label: "Overdue",
      amount: data.overdue,
      color: colors.danger,
    },
  ] as const;
  return (
    <FinanceCard>
      <FinanceHeading
        title="Collection health"
        description="Rent for the selected billing month, with payment status as of today. This differs from cash received during the month."
      />
      <MoneyRow label="Expected rent" amount={data.expected} />
      {data.expected > 0 ? (
        <View className="flex-row h-12 rounded-xl overflow-hidden">
          {segments
            .filter((segment) => segment.amount > 0)
            .map((segment) => (
              <Pressable
                key={segment.id}
                accessibilityRole="button"
                accessibilityLabel={`View ${segment.label.toLowerCase()}, ${formatPesoDisplay(segment.amount)}`}
                onPress={() => onSelect(segment.id)}
                style={{
                  flex: segment.amount / data.expected,
                  backgroundColor: segment.color,
                }}
              />
            ))}
        </View>
      ) : (
        <Text className="font-inter text-sm text-muted">
          No billable tenancies in this month.
        </Text>
      )}
      {segments.map((segment) => (
        <Button
          key={segment.id}
          variant="ghost"
          className="justify-between"
          onPress={() => onSelect(segment.id)}
        >
          <View className="flex-row items-center gap-2 flex-1">
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <Button.Label>{segment.label}</Button.Label>
          </View>
          <Text className="font-nunitoBold text-sm text-foreground">
            {formatPesoDisplay(segment.amount)} ›
          </Text>
        </Button>
      ))}
      {data.overdue > 0 && (
        <View className="gap-2 border-t border-border pt-3">
          <Text className="font-nunitoSemiBold text-sm text-foreground">
            Overdue balances by age
          </Text>
          <MoneyRow label="1–7 days" amount={data.age7} />
          <MoneyRow label="8–30 days" amount={data.age30} />
          <MoneyRow label="31+ days" amount={data.ageOlder} />
        </View>
      )}
      <Text className="font-inter text-xs text-muted">
        Late rent is outstanding income, not an expense. Failed payment attempts
        do not create extra rent dues.
      </Text>
    </FinanceCard>
  );
}
