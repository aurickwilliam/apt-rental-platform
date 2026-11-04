import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { markNotificationRead, markNotificationsRead } from "@/service/notifications/notificationService";

import { getNotificationsQueryKey } from "./useNotifications";

interface FeedRow {
  id: string;
  is_read: boolean;
}

export function useNotificationActions(userId: string | null) {
  const queryClient = useQueryClient();

  const feedKey = userId ? getNotificationsQueryKey(userId) : null;

  // Mark-stale only: the mutation's own realtime UPDATE event is the single
  // refetch trigger, so settling here never double-fetches the feed.
  const markStale = () => {
    if (!feedKey) return;

    void queryClient.invalidateQueries({ queryKey: feedKey, refetchType: "none" });
  };

  // Optimistically flags rows read in every cached portal feed (a shared row,
  // such as an account verification result, appears in both). Returns the
  // snapshots so a failed write can put each feed back.
  const markRowsRead = (ids: ReadonlySet<string>) => {
    if (!feedKey) return undefined;

    const previous = queryClient.getQueriesData<FeedRow[]>({ queryKey: feedKey });
    queryClient.setQueriesData<FeedRow[]>({ queryKey: feedKey }, (current) =>
      (current ?? []).map((n) => (ids.has(n.id) ? { ...n, is_read: true } : n)),
    );
    return previous;
  };

  const restore = (previous: ReturnType<typeof markRowsRead>) => {
    for (const [key, data] of previous ?? []) queryClient.setQueryData(key, data);
  };

  const markAsRead = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onMutate: (notificationId) => ({ previous: markRowsRead(new Set([notificationId])) }),
    onError: (_error, _notificationId, context) => restore(context?.previous),
    onSettled: markStale,
  });

  // Acknowledges exactly the given rows (the active portal's unread rows).
  // Rows only the other portal shows stay unread.
  const markAllAsRead = useMutation({
    mutationFn: (ids: string[]) => markNotificationsRead(ids),
    onMutate: (ids) => ({ previous: markRowsRead(new Set(ids)) }),
    onError: (_error, _ids, context) => restore(context?.previous),
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