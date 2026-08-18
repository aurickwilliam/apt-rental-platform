import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { markAllNotificationsRead, markNotificationRead } from "@/service/notifications/notificationService";

import { getNotificationsQueryKey, getUnreadNotificationsQueryKey } from "./useNotifications";

export function useNotificationActions(userId: string | null) {
  const queryClient = useQueryClient();

  // Mark-stale only: the mutation's own realtime UPDATE event is the single
  // refetch trigger, so settling here never double-fetches the feed.
  const markStale = () => {
    if (!userId) return;

    void queryClient.invalidateQueries({
      queryKey: getNotificationsQueryKey(userId),
      exact: true,
      refetchType: "none",
    });
    void queryClient.invalidateQueries({
      queryKey: getUnreadNotificationsQueryKey(userId),
      exact: true,
      refetchType: "none",
    });
  };

  const setUnreadCount = (updater: (current: number) => number) => {
    if (!userId) return;

    queryClient.setQueryData(
      getUnreadNotificationsQueryKey(userId),
      (current: number | undefined) => Math.max(0, updater(current ?? 0)),
    );
  };

  const markAsRead = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onMutate: (notificationId) => {
      if (!userId) return;

      const queryKey = getNotificationsQueryKey(userId);
      const previous = queryClient.getQueryData<{ id: string; is_read: boolean }[]>(queryKey);

      queryClient.setQueryData(queryKey, (current: { id: string; is_read: boolean }[] | undefined) =>
        (current ?? []).map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
      );

      const wasUnread =
        previous?.some((n) => n.id === notificationId && !n.is_read) ?? false;
      if (wasUnread) setUnreadCount((current) => current - 1);

      return { previous, wasUnread };
    },
    onError: (_error, _notificationId, context) => {
      if (context?.wasUnread && context.previous && userId) {
        queryClient.setQueryData(getNotificationsQueryKey(userId), context.previous);
        setUnreadCount((current) => current + 1);
      }
    },
    onSettled: markStale,
  });

  const markAllAsRead = useMutation({
    mutationFn: () => (userId ? markAllNotificationsRead(userId) : Promise.resolve()),
    onMutate: () => {
      if (!userId) return;

      const queryKey = getNotificationsQueryKey(userId);
      const previous = queryClient.getQueryData<{ id: string; is_read: boolean }[]>(queryKey);

      queryClient.setQueryData(queryKey, (current: { id: string; is_read: boolean }[] | undefined) =>
        (current ?? []).map((n) => ({ ...n, is_read: true })),
      );

      setUnreadCount(() => 0);

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && userId) {
        queryClient.setQueryData(getNotificationsQueryKey(userId), context.previous);
        const unreadInFeed = (context.previous ?? []).filter((n) => !n.is_read).length;
        setUnreadCount(() => unreadInFeed);
      }
    },
    onSettled: markStale,
  });

  const markAsReadByTap = useCallback(
    (notificationId: string) => {
      markAsRead.mutate(notificationId);
    },
    [markAsRead],
  );

  return {
    markAsRead: markAsReadByTap,
    markAllAsRead,
  };
}