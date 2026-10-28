import { useQuery, useQueryClient } from "@tanstack/react-query";

import { isLandlordAccessBlocked } from "@repo/utils";

import { useCurrentUser } from "@/hooks/auth";
import { useNotificationRealtime } from "@/hooks/notifications/useNotificationRealtime";
import { fetchUnreadNotificationCount } from "@/service/notifications/notificationService";
import { usePortalStore } from "@/stores/usePortalStore";

import { getUnreadNotificationsQueryKey } from "./useNotifications";

export function useUnreadNotificationCount() {
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUser();
  const userId = currentUserQuery.data?.id ?? null;
  const activePortal = usePortalStore((state) => state.portal);
  const landlordPortalClosed = activePortal === "landlord"
    && isLandlordAccessBlocked(currentUserQuery.data?.roles ?? [], currentUserQuery.data?.account_status);

  const unreadCountQuery = useQuery({
    queryKey: getUnreadNotificationsQueryKey(userId as string),
    queryFn: () => fetchUnreadNotificationCount(userId as string),
    enabled: userId !== null,
  });

  useNotificationRealtime(userId, {
    onChange: () => {
      if (!userId) return;

      void queryClient.invalidateQueries({
        queryKey: getUnreadNotificationsQueryKey(userId),
        exact: true,
      });
    },
  });

  return {
    unreadCount: landlordPortalClosed ? 0 : (unreadCountQuery.data ?? 0),
  };
}
