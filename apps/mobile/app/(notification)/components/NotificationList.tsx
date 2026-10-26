import { useMemo, useState } from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, useToast } from 'heroui-native'
import { IconBellCheck, IconBellOff } from '@tabler/icons-react-native'
import { groupNotificationFeed, groupNotificationsByLocalDate } from '@repo/utils'
import type { MessageGroupUnit } from '@repo/utils'

import { useNotifications, useNotificationActions } from '@/hooks/notifications'
import type { NotificationItem } from '@/hooks/notifications'
import { useCurrentUser } from '@/hooks/auth'
import { useColors } from '@/hooks/useTheme'
import { useTranslation } from '@/hooks/i18n'
import EmptyState from '@/components/display/EmptyState'
import { buildNotificationDeepLink, getWebOnlyNotificationNotice } from '@/utils/notificationDeepLink'
import { authorizedPortal } from '@/service/auth/portalPreference'
import { usePortalStore } from '@/stores/usePortalStore'
import NotificationRow from '@/app/(notification)/components/NotificationRow';
import NotificationGroupRow from '@/app/(notification)/components/NotificationGroupRow';
import NotificationRowSkeleton from '@/app/(notification)/components/NotificationRowSkeleton';

export type NotificationFilter = 'all' | 'unread';

interface NotificationListProps {
  filter: NotificationFilter;
  /** Leaves the Unread tab; offered from its empty state. */
  onShowAll?: () => void;
}

export default function NotificationList({ filter, onShowAll }: NotificationListProps) {
  const { colors } = useColors();
  const { language, t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const currentUserQuery = useCurrentUser();
  const currentUserId = currentUserQuery.data?.id ?? null;
  const activePortal = usePortalStore((state) => state.portal);
  const portalUserId = usePortalStore((state) => state.authUserId);
  const currentUserRole = portalUserId === currentUserQuery.data?.user_id
    ? authorizedPortal(currentUserQuery.data?.roles ?? [], activePortal) : null;

  const { notifications, loading, error } = useNotifications();
  const { markAsRead } = useNotificationActions(currentUserId);
  // Keyed by group identity (conversation + sender + oldest member), so a
  // realtime arrival keeps an already-expanded group open.
  const [expandedGroups, setExpandedGroups] = useState<ReadonlySet<string>>(() => new Set());

  const units = useMemo(() => groupNotificationFeed(notifications), [notifications]);
  const shown = useMemo(
    () => filter === 'unread'
      ? units.filter((unit) => unit.kind === 'single' ? !unit.notification.is_read : unit.hasUnread)
      : units,
    [filter, units],
  );
  const dateGroups = useMemo(
    () => groupNotificationsByLocalDate(shown, undefined, language),
    [shown, language],
  );

  const toggleGroup = (key: string) => {
    setExpandedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openNotification = (n: NotificationItem) => {
    markAsRead(n.id);
    const href = buildNotificationDeepLink(n.data, currentUserId, currentUserRole);
    if (href) {
      router.push(href);
      return;
    }
    const notice = getWebOnlyNotificationNotice(n.data, language);
    if (notice) toast.show({ variant: 'default', ...notice });
  };

  // A group acknowledges its unread records only when the payload addresses
  // the actual conversation, so an unresolved target never clears rows the
  // user did not get to see.
  const openGroup = (unit: MessageGroupUnit<NotificationItem>) => {
    const href = buildNotificationDeepLink(unit.latest.data, currentUserId, currentUserRole);
    if (!href) return;

    unit.members.filter((member) => !member.is_read).forEach((member) => markAsRead(member.id));
    router.push(href);
  };

  if (loading) {
    return (
      <View className="mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <NotificationRowSkeleton key={i} />
        ))}
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

  if (shown.length === 0) {
    return filter === 'unread' ? (
      <EmptyState
        className="mt-6"
        icon={<IconBellCheck size={40} color={colors.primary} />}
        title={t("notifications.mobile.caughtUpTitle")}
        description={t("notifications.mobile.caughtUpBody")}
        action={onShowAll ? (
          <Button size="sm" variant="secondary" onPress={onShowAll}>
            <Button.Label>{t("notifications.mobile.viewAll")}</Button.Label>
          </Button>
        ) : undefined}
      />
    ) : (
      <EmptyState
        className="mt-6"
        icon={<IconBellOff size={40} color={colors.gray500} />}
        title={t("notifications.mobile.emptyTitle")}
        description={t("notifications.mobile.emptyBody")}
      />
    );
  }

  return (
    <View className="mt-2">
      {dateGroups.map((group) => (
        <View key={group.key}>
          <Text
            accessibilityRole="header"
            className="px-3 pb-1 pt-3 text-sm font-nunitoBold uppercase tracking-wide text-muted"
          >
            {group.label}
          </Text>

          {group.items.map((unit) =>
            unit.kind === 'single' ? (
              <NotificationRow
                key={unit.id}
                notification={unit.notification}
                language={language}
                onPress={() => openNotification(unit.notification)}
              />
            ) : (
              <NotificationGroupRow
                key={unit.key}
                unit={unit}
                language={language}
                expanded={expandedGroups.has(unit.key)}
                onToggle={() => toggleGroup(unit.key)}
                onOpenGroup={() => openGroup(unit)}
                onOpenMember={openNotification}
              />
            ),
          )}
        </View>
      ))}
    </View>
  )
}
