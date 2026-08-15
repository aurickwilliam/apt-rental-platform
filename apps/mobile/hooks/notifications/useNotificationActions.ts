import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { markAllNotificationsRead, markNotificationRead } from "@/service/notificationService";

import { getNotificationsQueryKey } from "./useNotifications";

export function useNotificationActions(userId: string | null) {
  const queryClient = useQueryClient();

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

      return { previous };
    },
    onError: (_error, _notificationId, context) => {
      if (context?.previous && userId) {
        queryClient.setQueryData(getNotificationsQueryKey(userId), context.previous);
      }
    },
    onSettled: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: getNotificationsQueryKey(userId), exact: true });
      }
    },
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

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && userId) {
        queryClient.setQueryData(getNotificationsQueryKey(userId), context.previous);
      }
    },
    onSettled: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: getNotificationsQueryKey(userId), exact: true });
      }
    },
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
