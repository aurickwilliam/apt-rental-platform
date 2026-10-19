import { createElement } from 'react';
import { View, Text, TouchableOpacity } from 'react-native'
import { Card } from 'heroui-native'
import { IconMessage } from '@tabler/icons-react-native';

import {
  getNotificationTypeIcon,
  isRentDueNotification,
  RENT_DUE_ICON,
  useNotificationTypeColor,
} from '@/hooks/notifications';
import { useColors } from '@/hooks/useTheme';
import type { NotificationType } from '@/service/notifications/notificationService';

export type NotificationCardType = NotificationType;

interface NotificationCardProps {
  title: string;
  type: NotificationCardType;
  message?: string;
  /** Short quoted-message preview (reaction notifications); omitted otherwise. */
  preview?: string;
  date?: string;
  unread?: boolean;
  onPress?: () => void;
}

export default function NotificationCard({
  title,
  type = "system",
  message = "New Message",
  preview,
  date = "0/0/0000",
  unread = false,
  onPress,
}: NotificationCardProps) {
  const { colors } = useColors();
  const { getColor } = useNotificationTypeColor();
  const isRentDue = type === 'payment' && isRentDueNotification(title);

  const Icon = isRentDue ? RENT_DUE_ICON : getNotificationTypeIcon(type);
  const iconColor = isRentDue ? colors.danger : getColor(type);

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
            {createElement(Icon, { size: 20, color: iconColor })}

            <Card.Title className={`flex-1 text-base ${unread ? "font-nunitoBold" : "font-nunitoSemiBold"}`}>
              {title}
            </Card.Title>

            {unread && (
              <View className="h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </View>
        </Card.Header>

        <Card.Body className="pt-2">
          <Card.Description className="text-foreground text-sm font-inter">
            {message}
          </Card.Description>

          {preview ? (
            <View className="mt-1 flex-row items-center gap-1">
              {createElement(IconMessage, { size: 12, color: colors.gray500 })}
              <Text className="text-muted text-xs font-inter flex-1" numberOfLines={1}>
                {preview}
              </Text>
            </View>
          ) : null}
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