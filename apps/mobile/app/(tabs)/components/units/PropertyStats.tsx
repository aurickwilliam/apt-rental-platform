import { View, Text } from "react-native";
import { ChartPie } from "lucide-react-native";
import { Button } from "heroui-native";

import { useColors } from "@/hooks/useTheme";
import { formatPesoDisplay } from "@repo/utils";

const currentMonthLabel = new Date().toLocaleString("default", {
  month: "long",
  year: "numeric",
});

interface PropertyStatsProps {
  loading: boolean;
  monthlyProfit: number | null;
  totalProperties: number;
  occupiedCount: number;
  onAnalyticsPress: () => void;
}

export default function PropertyStats({
  loading,
  monthlyProfit,
  totalProperties,
  occupiedCount,
  onAnalyticsPress,
}: PropertyStatsProps) {
  const { colors } = useColors();

  return (
    <View className="flex gap-3 mt-3">
      <View className="bg-accent p-4 rounded-3xl flex gap-2">
        <Text className="text-gray-100 text-base font-interSemiBold">
          {currentMonthLabel} Total Profit
        </Text>
        <Text className="text-accent-foreground text-4xl font-interSemiBold">
          {loading
            ? "—"
            : monthlyProfit === null
              ? "N/A"
              : `${formatPesoDisplay(monthlyProfit)}`}
        </Text>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 bg-surface-secondary rounded-3xl p-4 gap-1 border border-border justify-center">
          <Text className="text-sm text-gray-500 font-interMedium">
            Total Properties
          </Text>
          <Text className="text-3xl text-foreground font-interSemiBold">
            {loading ? "—" : totalProperties}
          </Text>
        </View>

        <View className="flex-1 bg-surface-secondary rounded-3xl p-4 gap-1 border border-border justify-center">
          <Text className="text-sm text-gray-500 font-interMedium">
            Units Occupied
          </Text>
          <Text className="text-3xl text-foreground font-interSemiBold">
            {loading ? "—" : occupiedCount}
          </Text>
        </View>
      </View>

      <Button onPress={onAnalyticsPress}>
        <ChartPie size={20} color={colors.secondaryForeground} />
        <Button.Label>Budget Analytics</Button.Label>
      </Button>
    </View>
  );
}
