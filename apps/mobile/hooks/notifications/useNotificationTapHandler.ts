import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";

import { useCurrentUser } from "@/hooks/auth";
import { markNotificationRead } from "@/service/notifications/notificationService";
import { buildNotificationDeepLink } from "@/utils/notificationDeepLink";
import { authorizedPortal } from "@/service/auth/portalPreference";
import { usePortalStore } from "@/stores/usePortalStore";

/**
 * Handles taps on push notifications (foreground response listener + cold
 * start) and routes to the target screen encoded in the notification's data
 * payload. The tapped row is marked read (fire-and-forget; realtime reconciles
 * the feed), so the in-app unread badge stays accurate. Unknown screens
 * degrade to a no-op; the notification feed is always reachable from the
 * in-app bell.
 */
export function useNotificationTapHandler() {
  const router = useRouter();
  const currentUserQuery = useCurrentUser();
  const currentUserId = currentUserQuery.data?.id ?? null;
  const activePortal = usePortalStore((state) => state.portal);
  const portalUserId = usePortalStore((state) => state.authUserId);
  const currentUserRole = portalUserId === currentUserQuery.data?.user_id
    ? authorizedPortal(currentUserQuery.data?.roles ?? [], activePortal) : null;
  const roleRef = useRef(currentUserRole);
  const pendingResponseRef = useRef<Notifications.NotificationResponse | null>(null);

  useEffect(() => {
    roleRef.current = currentUserRole;
  }, [currentUserRole]);

  useEffect(() => {
    function handleResponse(response: Notifications.NotificationResponse | null) {
      if (!response) return;
      const data = response.notification.request.content.data;
      if (!data?.screen) return;

      if (!currentUserId || !roleRef.current) {
        // Cold start: user profile may not be loaded yet; retry when it is.
        pendingResponseRef.current = response;
        return;
      }

      pendingResponseRef.current = null;
      if (typeof data.notificationId === "string") {
        void markNotificationRead(data.notificationId);
      }
      const href = buildNotificationDeepLink(data, currentUserId, roleRef.current);
      if (href) router.push(href);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

    void Notifications.getLastNotificationResponseAsync().then(handleResponse);

    return () => subscription.remove();
  }, [currentUserId, router]);

  useEffect(() => {
    const pending = pendingResponseRef.current;
    if (pending && currentUserId && currentUserRole) {
      pendingResponseRef.current = null;
      const data = pending.notification.request.content.data;
      if (typeof data?.notificationId === "string") {
        void markNotificationRead(data.notificationId);
      }
      const href = buildNotificationDeepLink(data, currentUserId, currentUserRole);
      if (href) router.push(href);
    }
  }, [currentUserId, currentUserRole, router]);
}
