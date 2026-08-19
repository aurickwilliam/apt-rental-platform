import { View, Text, TouchableOpacity } from 'react-native'
import { Card } from 'heroui-native'

import { getNotificationTypeIcon, useNotificationTypeColor } from '@/hooks/notifications';
import type { NotificationType } from '@/service/notifications/notificationService';

export type NotificationCardType = NotificationType;

interface NotificationCardProps {
  title: string;
  type: NotificationCardType;
  message?: string;
  date?: string;
  unread?: boolean;
  onPress?: () => void;
}

export default function NotificationCard({
  title,
  type = "system",
  message = "New Message",
  date = "0/0/0000",
  unread = false,
  onPress,
}: NotificationCardProps) {
  const { getColor } = useNotificationTypeColor();

  const Icon = getNotificationTypeIcon(type);
  const iconColor = getColor(type);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Card
        className={
          unread
            ? "bg-surface rounded-3xl border border-primary/30 p-4 shadow-none"
            : "bg-surface rounded-3xl border border-border p-4 shadow-none"
        }
      >
        <Card.Header>
          <View className="flex-row items-center gap-2">
            <Icon size={20} color={iconColor} />

            <Card.Title className={`flex-1 text-base ${unread ? "font-nunitoBold" : "font-nunitoSemiBold"}`}>
              {title}
            </Card.Title>

            {unread && (
              <View className="h-2.5 w-2.5 rounded-full bg-primary" />
            )}
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