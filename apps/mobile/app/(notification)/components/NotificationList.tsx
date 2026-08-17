import { useMemo } from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { getRelativeTime } from '@repo/utils'

import { useNotifications, useNotificationActions } from '@/hooks/notifications'
import { useCurrentUser } from '@/hooks/auth'
import { buildNotificationDeepLink } from '@/utils/notificationDeepLink'
import NotificationCard from '@/app/(notification)/components/NotificationCard';

import type { NotificationCardType } from '@/app/(notification)/components/NotificationCard';

export type NotificationFilter = NotificationCardType | 'All';

interface NotificationListProps {
  filter: NotificationFilter;
}

export default function NotificationList({ filter }: NotificationListProps) {
  const router = useRouter();
  const currentUserQuery = useCurrentUser();
  const currentUserId = currentUserQuery.data?.id ?? null;
  const currentUserRole = currentUserQuery.data?.role ?? null;

  const { notifications, loading, error } = useNotifications();
  const { markAsRead } = useNotificationActions(currentUserId);

  const visible = useMemo(
    () => (filter === 'All' ? notifications : notifications.filter((n) => n.type === filter)),
    [filter, notifications],
  );

  if (loading) {
    return (
      <View className="mt-10">
        <Text className="text-center text-muted font-inter">
          Loading notifications…
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="mt-10">
        <Text className="text-center text-muted font-inter">
          {error}
        </Text>
      </View>
    );
  }

  if (visible.length === 0) {
    return (
      <View className="mt-10">
        <Text className="text-center text-muted font-inter">
          {filter === 'All' ? 'No notifications yet.' : `No ${filter.toLowerCase()} notifications.`}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex gap-3 mt-4">
      {visible.map((n) => (
        <NotificationCard
          key={n.id}
          title={n.title}
          type={n.type as NotificationCardType}
          message={n.message}
          date={getRelativeTime(new Date(n.created_at))}
          unread={!n.is_read}
          onPress={() => {
            markAsRead(n.id);
            const href = buildNotificationDeepLink(n.data, currentUserId, currentUserRole);
            if (href) router.push(href);
          }}
        />
      ))}
    </View>
  )
}
