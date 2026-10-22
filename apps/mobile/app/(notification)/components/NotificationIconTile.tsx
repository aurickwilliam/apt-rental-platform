import { createElement } from 'react';
import { View } from 'react-native'

import {
  getNotificationTypeIcon,
  isRentDueNotification,
  RENT_DUE_ICON,
} from '@/hooks/notifications';
import { useColors } from '@/hooks/useTheme';
import type { NotificationType } from '@/service/notifications/notificationService';

interface NotificationIconTileProps {
  type: NotificationType;
  title: string;
}

/** Soft-blue circular tile carrying the notification's type icon. */
export default function NotificationIconTile({ type, title }: NotificationIconTileProps) {
  const { colors } = useColors();
  const isRentDue = type === 'payment' && isRentDueNotification(title);

  const Icon = isRentDue ? RENT_DUE_ICON : getNotificationTypeIcon(type);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="h-12 w-12 items-center justify-center rounded-full bg-primary-light"
    >
      {createElement(Icon, { size: 24, color: isRentDue ? colors.danger : colors.primary })}
    </View>
  )
}
