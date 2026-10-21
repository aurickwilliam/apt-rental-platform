import { Pressable, Text, View } from "react-native";
import { Button } from "heroui-native";
import { IconChevronRight, IconReceipt } from "@tabler/icons-react-native";
import { formatPesoDisplay } from "@repo/utils";
import { useColors } from "@/hooks/useTheme";
import EmptyState from "@/components/display/EmptyState";
import FinanceCard from "./FinanceCard";
import FinanceHeading from "./FinanceHeading";
import MoneyRow from "./MoneyRow";
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
      className: "bg-primary-light",
    },
    {
      id: "pending",
      label: "Not yet due",
      amount: data.pending,
      color: colors.warning,
      className: "bg-warning-light",
    },
    {
      id: "overdue",
      label: "Overdue",
      amount: data.overdue,
      color: colors.danger,
      className: "bg-danger-soft",
    },
  ] as const;
  return (
    <FinanceCard>
      <FinanceHeading
        title="Collection health"
        description="Rent for the selected billing month, with payment status as of today. This differs from cash received during the month."
      />
      {data.expected > 0 ? (
        <>
          <MoneyRow label="Expected rent" amount={data.expected} />
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
          <View className="gap-2">
            {segments.map((segment) => (
              <Button
                key={segment.id}
                variant="ghost"
                className={`justify-between rounded-full px-3 ${segment.className}`}
                onPress={() => onSelect(segment.id)}
              >
                <View className="flex-row items-center gap-2 flex-1">
                  <View
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <Button.Label>{segment.label}</Button.Label>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="font-nunitoBold text-sm text-foreground">
                    {formatPesoDisplay(segment.amount)}
                  </Text>
                  <IconChevronRight size={18} color={colors.textPrimary} />
                </View>
              </Button>
            ))}
          </View>
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
            Late rent is outstanding income, not an expense. Failed payment
            attempts do not create extra rent dues.
          </Text>
        </>
      ) : (
        <EmptyState
          icon={<IconReceipt size={32} color={colors.gray500} />}
          title="No billable tenancies this month"
          description="Expected rent and payment status will appear here once a tenancy is billed for this month."
        />
      )}
    </FinanceCard>
  );
}
