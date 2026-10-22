import { View, Text, TouchableOpacity } from 'react-native'
import {
  composeNotificationRowLabel,
  getNotificationPreview,
  getNotificationRowPresentation,
  getRelativeTime,
} from '@repo/utils'

import NotificationIconTile from '@/app/(notification)/components/NotificationIconTile';
import type { NotificationItem } from '@/hooks/notifications';

interface NotificationRowProps {
  notification: NotificationItem;
  onPress: () => void;
  /** Expanded group member: no icon or sender, indented under its summary. */
  compact?: boolean;
}

/**
 * One flat feed row: type icon tile, sender/title sentence, quoted preview
 * and time. The whole row is the tap target; the caller marks it read and
 * navigates.
 */
export default function NotificationRow({
  notification,
  onPress,
  compact = false,
}: NotificationRowProps) {
  const unread = !notification.is_read;
  const { action, preview } = getNotificationRowPresentation(
    notification,
    getNotificationPreview(notification.data),
  );
  const timestamp = getRelativeTime(new Date(notification.created_at));
  const displayedPreview = compact ? preview ?? notification.message ?? action : preview;
  const accessibleLabel = composeNotificationRowLabel({
    title: notification.title,
    message: action,
    preview: preview ?? undefined,
    isRead: !unread,
    timestamp,
  });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibleLabel}
      className={compact ? 'flex-row items-start gap-3 py-2 pr-3' : 'flex-row items-start gap-3 px-3 py-3'}
    >
      {!compact && <NotificationIconTile type={notification.type} title={notification.title} />}

      <View className="flex-1">
        {!compact && (
          <Text className="text-foreground text-base leading-6 font-nunito" numberOfLines={2}>
            <Text className="font-nunitoBold">{notification.title}</Text>
            {action ? ` ${action}` : ''}
          </Text>
        )}

        {displayedPreview ? (
          <Text
            className={`text-sm leading-5 font-inter ${compact && unread ? 'text-foreground font-nunitoSemiBold' : 'text-muted'}`}
            numberOfLines={1}
          >
            {action ? `“${displayedPreview}”` : displayedPreview}
          </Text>
        ) : null}

        <Text className="text-muted text-xs mt-0.5 font-inter">{timestamp}</Text>
      </View>

      <View className={`mt-2 h-2 w-2 rounded-full ${unread ? 'bg-primary' : 'bg-transparent'}`} />
    </TouchableOpacity>
  )
}
