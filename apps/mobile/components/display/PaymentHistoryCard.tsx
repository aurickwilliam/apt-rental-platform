import { TouchableOpacity, View, Text } from "react-native";
import { IconCalendarWeekFilled } from "@tabler/icons-react-native";

import { COLORS } from "../../constants/colors";

interface PaymentHistoryCardProps {
  month: string;
  year: string;
  amount: number;
  paidDate: string;
  status: 'paid' | 'partial'
}

export default function PaymentHistoryCard({
  month,
  year,
  amount = 0,
  paidDate = '0/0/0000',
  status = 'paid'
}: PaymentHistoryCardProps) {
  return (
    <TouchableOpacity className="bg-darkerWhite p-[10px] rounded-xl" activeOpacity={0.7}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          {/* Calendar Icon */}
          <IconCalendarWeekFilled
            size={20}
            color={COLORS.grey}
          />

          {/* Month Year */}
          <Text className="text-grey-500 text-base font-poppins">
            {month} {year}
          </Text>
        </View>

        {/* Status Indicator */}
        <View className={`px-4 py-[2px] self-start rounded-full
          border-2 ${status === 'paid' ? 'border-greenHulk-200 bg-greenHulk-100' : 'border-yellowish-200 bg-yellowish-100'}`}>
          <Text className={`${status === 'paid' ? 'text-greenHulk-200' : 'text-yellowish-200'} font-interMedium`}>
            {status === 'paid' ? 'Paid' : 'Partial'}
          </Text>
        </View>
      </View>

      {/* Amount Paid */}
      <View className="mt-2">
        <Text className="text-text text-xl font-interMedium">
          ₱ {amount}
        </Text>
      </View>

      {/* Paid Date */}
      <View className="mt-2">
        <Text className="text-grey-500 text-sm font-inter">
          Paid on: {paidDate}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
