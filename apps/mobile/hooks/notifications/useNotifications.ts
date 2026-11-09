import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/hooks/auth";
import { useNotificationRealtime } from "@/hooks/notifications/useNotificationRealtime";
import { authorizedPortal, type Portal } from "@/service/auth/portalPreference";
import { fetchPortalNotifications } from "@/service/notifications/notificationService";
import { usePortalStore } from "@/stores/usePortalStore";

import type { NotificationItem } from "@/service/notifications/notificationService";

export type { NotificationItem, NotificationType } from "@/service/notifications/notificationService";

/** Without a portal this is the prefix shared by both portals' cached feeds. */
export const getNotificationsQueryKey = (userId: string, portal?: Portal) =>
  (portal ? ["notifications", userId, portal] : ["notifications", userId]) as readonly string[];

/** The portal the notification feed is shown for, or null until it is known. */
export function useNotificationPortal(): Portal | null {
  const currentUserQuery = useCurrentUser();
  const activePortal = usePortalStore((state) => state.portal);
  const portalUserId = usePortalStore((state) => state.authUserId);

  return portalUserId === currentUserQuery.data?.user_id
    ? authorizedPortal(currentUserQuery.data?.roles ?? [], activePortal)
    : null;
}

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

/**
 * The latest notifications the active portal shows. Each portal has its own
 * cached feed (see `fetchPortalNotifications`), so the badge and "Mark all
 * read" only ever count what this portal shows, and one portal's activity
 * never crowds out the other's rows.
 */
export function useNotifications() {
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUser();
  const userId = currentUserQuery.data?.id ?? null;
  const portal = useNotificationPortal();

  const notificationsQuery = useQuery({
    queryKey: getNotificationsQueryKey(userId ?? "", portal ?? undefined),
    queryFn: () => fetchPortalNotifications(userId as string, portal as Portal),
    enabled: userId !== null && portal !== null,
  });

  useNotificationRealtime(userId, {
    onChange: () => {
      if (!userId) return;

      // Both portals' feeds: a row can belong to either, and the one not on
      // screen refetches the next time it is opened.
      void queryClient.invalidateQueries({ queryKey: getNotificationsQueryKey(userId) });
    },
  });

  const notifications = useMemo(() => notificationsQuery.data ?? [], [notificationsQuery.data]);
  const unreadIds = useMemo(
    () => notifications.filter((n) => !n.is_read).map((n) => n.id),
    [notifications],
  );

  const refetch = useCallback(async () => {
    if (!userId || !portal) return;

    await notificationsQuery.refetch();
  }, [notificationsQuery, userId, portal]);

  return {
    notifications,
    unreadIds,
    unreadCount: unreadIds.length,
    // Never waits on the portal itself: an unknown portal shows an empty feed
    // and any profile error, rather than a skeleton that cannot end.
    loading: currentUserQuery.isLoading || notificationsQuery.isLoading,
    error: getErrorMessage(currentUserQuery.error ?? notificationsQuery.error),
    refetch,
  };
}
