import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "expo-router";
import { useToast } from "heroui-native";

import { useCurrentUser } from "@/hooks/auth";
import { getNotificationTypeIcon, useNotificationTypeColor } from "@/hooks/notifications/notificationVisuals";
import { shouldSuppressChatToast } from "@/hooks/notifications/notificationSuppression";
import { useNotificationPreferences } from "@/hooks/notifications/useNotificationPreferences";
import { useNotificationRealtime } from "@/hooks/notifications/useNotificationRealtime";
import { markNotificationRead } from "@/service/notificationService";
import { buildNotificationDeepLink } from "@/utils/notificationDeepLink";

import type { NotificationRow } from "@/service/notificationService";
import type { NotificationPreferenceType, NotificationType } from "@/service/notificationService";
import type { ToastVariant } from "heroui-native";

const TOAST_VARIANT_BY_TYPE: Record<NotificationType, ToastVariant> = {
  payment: "success",
  message: "accent",
  maintenance: "warning",
  apartment: "accent",
  system: "default",
};

const TOAST_DURATION_MS = 4000;

/**
 * Shows an in-app HeroUI toast whenever a new notification row arrives via
 * Supabase Realtime while the user is signed in and using the app. Delivery is
 * gated by the user's notification preferences (master + per-type). Tapping the
 * toast deep-links to the notification's target screen (marking it read),
 * falling back to the in-app notification feed. Works entirely without push
 * infrastructure, so it functions even when OS push (Apple Developer account /
 * APNs) is unavailable.
 */
export function useInAppNotificationBanner() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const currentUserQuery = useCurrentUser();
  const userId = currentUserQuery.data?.id ?? null;
  const role = currentUserQuery.data?.role ?? null;

  const { preferences, loading: preferencesLoading } = useNotificationPreferences();
  const { getColor } = useNotificationTypeColor();

  // Read through refs so re-renders and navigation never tear down the shared
  // realtime subscription (heroui-native's `toast` identity changes on every
  // toast show/dismiss).
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  });
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  });
  const roleRef = useRef(role);
  useEffect(() => {
    roleRef.current = role;
  });
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  });

  const preferencesRef = useRef(preferences);
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  const getColorRef = useRef(getColor);
  useEffect(() => {
    getColorRef.current = getColor;
  });

  // Subscribe only once preferences are loaded; per-type gating is still
  // enforced inside the handler for pref changes while subscribed.
  const subscribedUserId = preferencesLoading ? null : userId;

  useNotificationRealtime(subscribedUserId, {
    onInsert: (row) => {
      if (!row?.type || !row?.title) return;

      if (shouldSuppressChatToast(row, pathnameRef.current)) return;

      const currentPreferences = preferencesRef.current;
      const type = row.type as NotificationPreferenceType;
      // Fail-open for unknown types (like the push-notify edge function):
      // only explicitly-disabled types are suppressed.
      if (!currentPreferences.notifications_enabled || currentPreferences[type] === false) return;

      const Icon = getNotificationTypeIcon(row.type as NotificationType);
      const iconColor = getColorRef.current(row.type as NotificationType);

      toastRef.current.show({
        variant: TOAST_VARIANT_BY_TYPE[row.type as NotificationType],
        label: row.title,
        description: row.message ? row.message : undefined,
        icon: <Icon size={20} color={iconColor} />,
        duration: TOAST_DURATION_MS,
        actionLabel: "View",
        onActionPress: () => {
          void markNotificationRead(row.id);
          const href = buildNotificationDeepLink(row.data, userId, roleRef.current);
          if (href) {
            routerRef.current.push(href);
          } else if (roleRef.current === "landlord") {
            routerRef.current.push("/landlord-notif");
          } else {
            routerRef.current.push("/tenant-notif");
          }
        },
      });
    },
  });

  return null;
}