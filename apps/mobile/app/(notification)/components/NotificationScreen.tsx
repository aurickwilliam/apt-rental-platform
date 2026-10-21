import { View, Text, TouchableOpacity } from 'react-native'
import { useState } from 'react';

import { SkeletonGroup } from 'heroui-native'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import NotificationFilterTabs from '@/app/(notification)/components/NotificationFilterTabs';
import NotificationList from '@/app/(notification)/components/NotificationList';
import { useNotifications, useNotificationActions } from '@/hooks/notifications';
import { useCurrentUser } from '@/hooks/auth';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

import type { NotificationFilter } from '@/app/(notification)/components/NotificationList';

interface NotificationScreenProps {
  title: string;
}

export default function NotificationScreen({ title }: NotificationScreenProps) {
  const [filterType, setFilterType] = useState<NotificationFilter>('all');
  const currentUserQuery = useCurrentUser();
  const currentUserId = currentUserQuery.data?.id ?? null;

  const { unreadCount, refetch, loading } = useNotifications();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);
  const { markAllAsRead } = useNotificationActions(currentUserId);

  return (
    <ScreenWrapper
      scrollable
      className='p-5'
      header={
        <StandardHeader title={title}/>
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {loading ? (
        <View className="flex-row items-center justify-between gap-3">
          <SkeletonGroup isLoading isSkeletonOnly className="flex-1">
            <SkeletonGroup.Item className="h-8 w-36 rounded-full" />
          </SkeletonGroup>
        </View>
      ) : (
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <NotificationFilterTabs value={filterType} onChange={setFilterType} />
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity onPress={() => markAllAsRead.mutate()} activeOpacity={0.7}>
              <Text className="text-primary font-nunitoSemiBold text-sm">
                Mark all read
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <NotificationList filter={filterType} />
    </ScreenWrapper>
  )
}
