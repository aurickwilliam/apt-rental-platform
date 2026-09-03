import { View, Text } from "react-native";

import { useColors } from "hooks/useTheme";
import { formatPesoDisplay } from "@repo/utils";

import { Button, Chip } from "heroui-native";
import {
  IconCalendarMonth,
  IconCoin,
  IconCreditCard,
  IconHistory,
} from "@tabler/icons-react-native";

interface PaymentSummaryCardProps {
  periodMonth?: string;
  periodYear?: string;
  status?: "Pending" | "Paid";
  totalRent?: number;
  dueDate?: string | null;
  onPayNowPress?: () => void;
  onViewHistoryPress?: () => void;
}

export default function PaymentSummaryCard({
  periodMonth = "Month",
  periodYear = "Year",
  status = "Pending",
  totalRent = 0,
  dueDate,
  onPayNowPress,
  onViewHistoryPress,
}: PaymentSummaryCardProps) {
  const { colors, isDark } = useColors();

  const isPending = status === "Pending";

  return (
    <View className="bg-accent rounded-3xl p-4 border border-white/10">
      {/* Header — no icon beside title per request */}
      <View className="flex-row items-center justify-between">
        <Text className="text-white text-lg font-nunitoBold">
          Payment Summary
        </Text>

        <Chip
          size="sm"
          variant="soft"
          style={{
            backgroundColor: isPending
              ? colors.warningLight
              : colors.successLight,
          }}
        >
          <Chip.Label
            className="font-nunitoSemiBold text-sm"
            style={{ color: isPending ? colors.warning : colors.success }}
          >
            {status}
          </Chip.Label>
        </Chip>
      </View>

      {/* Details — compact row with icons */}
      <View className="flex-row gap-3 mt-4">
        {/* Period */}
        <View className="flex-1 flex-row items-center gap-2.5">
          <View className="p-2 rounded-xl bg-white/20">
            <IconCalendarMonth size={16} color="#FFFFFF" strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-nunitoSemiBold">
              Period
            </Text>
            <Text
              className="text-white text-sm font-nunitoSemiBold"
              numberOfLines={1}
            >
              {periodMonth} {periodYear}
            </Text>
          </View>
        </View>

        {/* Rent Amount — renamed from Amount, due date below it */}
        <View className="flex-1 flex-row items-center gap-2.5">
          <View className="p-2 rounded-xl bg-white/20">
            <IconCoin size={16} color="#FFFFFF" strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-nunitoSemiBold">
              Rent Amount
            </Text>
            <Text
              className="text-white text-sm font-nunitoSemiBold"
              numberOfLines={1}
            >
              {formatPesoDisplay(totalRent)}
            </Text>
            {dueDate ? (
              <Text className="text-white/60 text-[11px] font-inter leading-none mt-0.5">
                Due: {dueDate}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Actions — both with Tabler icons */}
      <View className="flex-row gap-3 mt-4">
        {isPending && (
          <Button
            size="sm"
            onPress={onPayNowPress}
            className={`flex-1 bg-secondary`}
          >
            <IconCreditCard
              size={16}
              color={colors.secondaryForeground}
              strokeWidth={2}
            />
            <Button.Label
              style={{ color: colors.secondaryForeground}}
            >
              Pay Now
            </Button.Label>
          </Button>
        )}

        <Button
          size="sm"
          variant="secondary"
          onPress={onViewHistoryPress}
          className="flex-1 bg-white/15 border border-white/20"
        >
          <IconHistory size={16} color="#FFFFFF" strokeWidth={2} />
          <Button.Label style={{ color: "#FFFFFF" }}>
            View History
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}
