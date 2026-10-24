import { View, Text, TouchableOpacity } from "react-native";
import { IconChevronRight } from "@tabler/icons-react-native";

import { formatPesoDisplay } from "@repo/utils";

import {
  collectionProgress,
  type ThisMonthSummary,
} from "@/service/dashboard/dashboardService";

interface MonthCollectionCardProps {
  thisMonth: ThisMonthSummary;
  /** Opens the list of every payment; omit for an informational card. */
  onPressViewPayments?: () => void;
}

export default function MonthCollectionCard({ thisMonth, onPressViewPayments }: MonthCollectionCardProps) {
  const { collected, expected, percent } = collectionProgress(thisMonth);
  const hasExpectedRent = expected > 0;

  const card = (
    <View className="bg-primary rounded-3xl p-4 gap-3">
      <View className="gap-1">
        <Text className="text-sm text-gray-100 font-interMedium">
          Collected this month
        </Text>
        <Text className="text-3xl text-white font-nunitoBold">
          {formatPesoDisplay(collected)}
        </Text>
      </View>

      {onPressViewPayments ? (
        <View className="flex-row items-center justify-end gap-1 -mb-1">
          <Text className="text-sm text-white font-interMedium">View all payments</Text>
          <IconChevronRight size={16} color="#FFFFFF" />
        </View>
      ) : null}

      {hasExpectedRent ? (
        <View className="gap-2">
          <View
            className="h-2 rounded-full bg-white/25 overflow-hidden"
            accessibilityRole="progressbar"
            accessibilityLabel="Rent collected this month"
            accessibilityValue={{ min: 0, max: 100, now: percent }}
          >
            <View
              className="h-2 rounded-full bg-white"
              style={{ width: `${percent}%` }}
            />
          </View>
          <Text className="text-sm text-gray-100 font-inter">
            {percent}% of {formatPesoDisplay(expected)} expected
          </Text>
        </View>
      ) : (
        <Text className="text-sm text-gray-100 font-inter">
          No rent is due this month.
        </Text>
      )}
    </View>
  );

  if (!onPressViewPayments) return card;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPressViewPayments}
      accessibilityRole="button"
      accessibilityLabel={`Collected this month, ${formatPesoDisplay(collected)}. View all payments`}
    >
      {card}
    </TouchableOpacity>
  );
}
