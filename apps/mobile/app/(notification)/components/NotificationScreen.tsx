import { View, Text, TouchableOpacity } from 'react-native'
import { useState } from 'react';

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import DropdownButton from 'components/buttons/DropdownButton';
import NotificationList from '@/app/(notification)/components/NotificationList';
import { useNotifications, useNotificationActions } from '@/hooks/notifications';
import { useCurrentUser } from '@/hooks/auth';

import type { NotificationFilter } from '@/app/(notification)/components/NotificationList';

interface NotificationScreenProps {
  title: string;
}

export default function NotificationScreen({ title }: NotificationScreenProps) {
  const [filterType, setFilterType] = useState<NotificationFilter>('All');
  const currentUserQuery = useCurrentUser();
  const currentUserId = currentUserQuery.data?.id ?? null;

  const { unreadCount, refetch } = useNotifications();
  const { markAllAsRead } = useNotificationActions(currentUserId);

  return (
    <ScreenWrapper
      scrollable
      className='p-5'
      header={
        <StandardHeader title={title}/>
      }
      refreshing={false}
      onRefresh={refetch}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <DropdownButton
            value={filterType}
            bottomSheetLabel={'Filter Notifications'}
            options={[
              'All',
              'Payment',
              'Message',
              'Maintenance',
              'Apartment',
              'System'
            ]}
            onSelect={(value) => setFilterType(value as NotificationFilter)}
          />
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAllAsRead.mutate()} activeOpacity={0.7}>
            <Text className="text-primary font-interMedium text-sm">
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <NotificationList filter={filterType} />
    </ScreenWrapper>
  )
}