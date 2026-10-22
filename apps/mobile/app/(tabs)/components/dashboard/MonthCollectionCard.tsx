import { View, Text } from "react-native";

import { formatPesoDisplay } from "@repo/utils";

import {
  collectionProgress,
  type ThisMonthSummary,
} from "@/service/dashboard/dashboardService";

interface MonthCollectionCardProps {
  thisMonth: ThisMonthSummary;
}

export default function MonthCollectionCard({ thisMonth }: MonthCollectionCardProps) {
  const { collected, expected, percent } = collectionProgress(thisMonth);
  const hasExpectedRent = expected > 0;

  return (
    <View className="bg-primary rounded-3xl p-4 gap-3">
      <View className="gap-1">
        <Text className="text-sm text-gray-100 font-interMedium">
          Collected this month
        </Text>
        <Text className="text-3xl text-white font-nunitoBold">
          {formatPesoDisplay(collected)}
        </Text>
      </View>

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
}
