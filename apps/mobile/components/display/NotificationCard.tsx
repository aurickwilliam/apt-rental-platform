import { View, Text, TouchableOpacity } from 'react-native'

// Icons Import
import {
  IconSettingsExclamation,
  IconInfoSquareRoundedFilled,
  IconCashBanknoteFilled,
  IconMessageFilled,
  IconTool,
  IconHomeFilled,
} from "@tabler/icons-react-native";

import { COLORS } from '../../constants/colors';

interface NotificationCardProps {
  title: string;
  type: 'payment' | 'message' | 'maintenance' | 'apartment' | 'system';
  message?: string;
  date?: string;
}

export default function NotificationCard({
  title,
  type = "system",
  message = "New Message",
  date = "0/0/0000"
}: NotificationCardProps) {

  const iconMap = {
    payment: IconCashBanknoteFilled,
    message: IconMessageFilled,
    maintenance: IconTool,
    apartment: IconHomeFilled,
    system: IconSettingsExclamation,
  }

  const colorMap = {
    payment: COLORS.greenHulk,
    message: COLORS.primary,
    maintenance: COLORS.yellowish,
    apartment: COLORS.primary,
    system: COLORS.grey
  }

  const Icon = iconMap[type] || IconInfoSquareRoundedFilled;
  const iconColor = colorMap[type] || COLORS.grey;

  return (
    <TouchableOpacity
      className='bg-white p-2 rounded-xl border border-grey-300'
      activeOpacity={0.7}
    >
      {/* Title */}
      <View className='flex-row items-center justify-start gap-1'>
        <Icon 
          size={28} color={iconColor}
        />
        <Text className='text-text text-lg font-poppinsMedium'>
          {title}
        </Text>
      </View>

      {/* Message */}
      <Text className='text-text font-inter mt-2'>
        {message}
      </Text>

      {/* Date */}
      <Text className='text-grey-300 text-sm mt-2'>
        {date}
      </Text>
    </TouchableOpacity>
  )
}