import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";

import { useCurrentUser } from "@/hooks/auth";
import { buildNotificationDeepLink } from "@/utils/notificationDeepLink";

/**
 * Handles taps on push notifications (foreground response listener + cold
 * start) and routes to the target screen encoded in the notification's data
 * payload. Unknown screens degrade to a no-op; the notification feed is always
 * reachable from the in-app bell.
 */
export function useNotificationTapHandler() {
  const router = useRouter();
  const currentUserQuery = useCurrentUser();
  const currentUserId = currentUserQuery.data?.id ?? null;
  const pendingResponseRef = useRef<Notifications.NotificationResponse | null>(null);

  useEffect(() => {
    function handleResponse(response: Notifications.NotificationResponse | null) {
      if (!response) return;
      const data = response.notification.request.content.data;
      if (!data?.screen) return;

      if (!currentUserId) {
        // Cold start: user profile may not be loaded yet; retry when it is.
        pendingResponseRef.current = response;
        return;
      }

      pendingResponseRef.current = null;
      const href = buildNotificationDeepLink(data, currentUserId);
      if (href) router.push(href);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

    void Notifications.getLastNotificationResponseAsync().then(handleResponse);

    return () => subscription.remove();
  }, [currentUserId, router]);

  useEffect(() => {
    const pending = pendingResponseRef.current;
    if (pending && currentUserId) {
      pendingResponseRef.current = null;
      const data = pending.notification.request.content.data;
      const href = buildNotificationDeepLink(data, currentUserId);
      if (href) router.push(href);
    }
  }, [currentUserId, router]);
}
