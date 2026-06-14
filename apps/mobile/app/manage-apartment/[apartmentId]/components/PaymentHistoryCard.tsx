import { TouchableOpacity, View, Text } from "react-native";

import { CalendarDays } from "lucide-react-native";

import { useColors } from "@/hooks/useTheme";

interface PaymentHistoryCardProps {
  month: string;
  year: string;
  amount: number;
  paidDate: string;
  status: "paid" | "partial";
}

export default function PaymentHistoryCard({
  month,
  year,
  amount = 0,
  paidDate = "0/0/0000",
  status = "paid",
}: PaymentHistoryCardProps) {
  const { colors } = useColors();

  return (
    <TouchableOpacity
      className="bg-surface p-2.5 rounded-xl"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          {/* Calendar Icon */}
          <CalendarDays size={20} color={colors.gray500} />

          {/* Month Year */}
          <Text className="text-gray-500 text-base font-interSemiBold">
            {month} {year}
          </Text>
        </View>

        {/* Status Indicator */}
        <View
          className={`px-4 py-0.5 self-start rounded-full
          border-2 ${status === "paid" ? "border-success bg-success-light" : "border-warning bg-warning-light"}`}
        >
          <Text
            className={`${status === "paid" ? "text-success" : "text-warning"} font-interMedium`}
          >
            {status === "paid" ? "Paid" : "Partial"}
          </Text>
        </View>
      </View>

      {/* Amount Paid */}
      <View className="mt-2">
        <Text className="text-foreground text-xl font-interMedium">
          ₱ {amount}
        </Text>
      </View>

      {/* Paid Date */}
      <View className="mt-2">
        <Text className="text-gray-500 text-sm font-inter">
          Paid on: {paidDate}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
