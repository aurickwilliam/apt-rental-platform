import { View, Text, TouchableOpacity } from 'react-native'
import { Card } from 'heroui-native'

import {
  IconSettingsExclamation,
  IconInfoSquareRoundedFilled,
  IconCashBanknoteFilled,
  IconMessageFilled,
  IconTool,
  IconHomeFilled,
} from "@tabler/icons-react-native";

import { COLORS } from '@repo/constants';

interface NotificationCardProps {
  title: string;
  type: 'payment' | 'message' | 'maintenance' | 'apartment' | 'system';
  message?: string;
  date?: string;
  onPress?: () => void;
}

export default function NotificationCard({
  title,
  type = "system",
  message = "New Message",
  date = "0/0/0000",
  onPress,
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
    system: COLORS.grey,
  }

  const Icon = iconMap[type] ?? IconInfoSquareRoundedFilled;
  const iconColor = colorMap[type] ?? COLORS.grey;

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onPress}
    >
      <Card className="bg-white rounded-xl border border-grey-200 p-4 shadow-none">
        <Card.Header>
          <View className="flex-row items-center gap-2">
            <Icon size={20} color={iconColor} />

            <Card.Title className="text-base font-interMedium">
              {title}
            </Card.Title>
          </View>
        </Card.Header>

        <Card.Body className="pt-2">
          <Card.Description className="text-text font-inter">
            {message}
          </Card.Description>
        </Card.Body>

        <Card.Footer className="pt-2">
          <Text className="text-grey-300 text-sm">
            {date}
          </Text>
        </Card.Footer>
      </Card>
    </TouchableOpacity>
  )
}