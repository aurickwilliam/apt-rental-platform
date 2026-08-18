import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/hooks/auth";
import { useNotificationRealtime } from "@/hooks/notifications/useNotificationRealtime";
import { fetchNotifications, fetchUnreadNotificationCount } from "@/service/notifications/notificationService";

import type { NotificationItem } from "@/service/notifications/notificationService";

export type { NotificationItem, NotificationType } from "@/service/notifications/notificationService";

export const getNotificationsQueryKey = (userId: string) =>
  ["notifications", userId] as const;

export const getUnreadNotificationsQueryKey = (userId: string) =>
  ["notifications-unread", userId] as const;

function getErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;

  if (
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "An unexpected error occurred.";
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUser();
  const userId = currentUserQuery.data?.id ?? null;

  const notificationsQuery = useQuery({
    queryKey: ["notifications", userId] as const,
    queryFn: () => fetchNotifications(userId as string),
    enabled: userId !== null,
  });

  const unreadCountQuery = useQuery({
    queryKey: getUnreadNotificationsQueryKey(userId as string),
    queryFn: () => fetchUnreadNotificationCount(userId as string),
    enabled: userId !== null,
  });

  useNotificationRealtime(userId, {
    onChange: () => {
      if (!userId) return;

      void queryClient.invalidateQueries({
        queryKey: getNotificationsQueryKey(userId),
        exact: true,
      });
      void queryClient.invalidateQueries({
        queryKey: getUnreadNotificationsQueryKey(userId),
        exact: true,
      });
    },
  });

  const notifications = notificationsQuery.data ?? [];

  const unreadCount = unreadCountQuery.data ?? notifications.filter((n) => !n.is_read).length;

  const refetch = useCallback(async () => {
    if (!userId) return;

    await Promise.all([notificationsQuery.refetch(), unreadCountQuery.refetch()]);
  }, [notificationsQuery, unreadCountQuery, userId]);

  return {
    notifications,
    unreadCount,
    loading: currentUserQuery.isLoading || notificationsQuery.isLoading,
    error: getErrorMessage(currentUserQuery.error ?? notificationsQuery.error),
    refetch,
  };
}