import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@repo/supabase";

import { useCurrentUser } from "@/hooks/auth";
import { fetchNotifications } from "@/service/notificationService";

import type { NotificationItem } from "@/service/notificationService";

export type { NotificationItem, NotificationType } from "@/service/notificationService";

export const getNotificationsQueryKey = (userId: string) =>
  ["notifications", userId] as const;

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

  const notifications = notificationsQuery.data ?? [];

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const refetch = useCallback(async () => {
    if (!userId) return;

    await notificationsQuery.refetch();
  }, [notificationsQuery, userId]);

  useEffect(() => {
    if (!userId) return;

    const queryKey = getNotificationsQueryKey(userId);
    const channel = supabase
      .channel(`notifications-live:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey, exact: true });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  return {
    notifications,
    unreadCount,
    loading: currentUserQuery.isLoading || notificationsQuery.isLoading,
    error: getErrorMessage(currentUserQuery.error ?? notificationsQuery.error),
    refetch,
  };
}
