import { View, Text, TouchableOpacity } from 'react-native'
import { Card } from 'heroui-native'

import {
  IconUserCog,
  IconMessage,
  IconCashBanknote,
  IconHammer,
  IconHome,
  IconInfoCircle,
} from '@tabler/icons-react-native';

import { useColors } from '@/hooks/useTheme';

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
  const { colors } = useColors();

  const iconMap = {
    payment: IconCashBanknote,
    message: IconMessage,
    maintenance: IconHammer,
    apartment: IconHome,
    system: IconUserCog,
  }

  const colorMap = {
    payment: colors.success,
    message: colors.primary,
    maintenance: colors.warning,
    apartment: colors.primary,
    system: colors.gray500,
  }

  const Icon = iconMap[type] ?? IconInfoCircle;
  const iconColor = colorMap[type] ?? colors.gray500;

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onPress}
    >
      <Card className="bg-surface rounded-3xl border border-border p-4 shadow-none">
        <Card.Header>
          <View className="flex-row items-center gap-2">
            <Icon size={20} color={iconColor} />

            <Card.Title className="text-base font-interMedium">
              {title}
            </Card.Title>
          </View>
        </Card.Header>

        <Card.Body className="pt-2">
          <Card.Description className="text-foreground font-inter">
            {message}
          </Card.Description>
        </Card.Body>

        <Card.Footer className="pt-2">
          <Text className="text-muted text-sm">
            {date}
          </Text>
        </Card.Footer>
      </Card>
    </TouchableOpacity>
  )
}