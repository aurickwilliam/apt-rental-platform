import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useToast } from "heroui-native";
import { supabase } from "@repo/supabase";

import { useCurrentUser } from "@/hooks/auth";
import { useNotificationTypeColor, getNotificationTypeIcon } from "@/hooks/notifications/notificationVisuals";
import { useNotificationPreferences } from "@/hooks/notifications/useNotificationPreferences";
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
 * toast deep-links to the notification's target screen, falling back to the
 * in-app notification feed. Works entirely without push infrastructure, so it
 * functions even when OS push (Apple Developer account / APNs) is unavailable.
 */
export function useInAppNotificationBanner() {
  const { toast } = useToast();
  const router = useRouter();
  const currentUserQuery = useCurrentUser();
  const userId = currentUserQuery.data?.id ?? null;
  const role = currentUserQuery.data?.role ?? null;

  const { preferences, loading: preferencesLoading } = useNotificationPreferences();
  const { getColor } = useNotificationTypeColor();

  const preferencesRef = useRef(preferences);
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    if (!userId || preferencesLoading) return;

    const channel = supabase
      .channel(`notifications-banner:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Partial<NotificationRow> | undefined;
          if (!row?.type || !row?.title) return;

          const currentPreferences = preferencesRef.current;
          const type = row.type as NotificationPreferenceType;
          // Fail-open for unknown types (like the push-notify edge function):
          // only explicitly-disabled types are suppressed.
          if (!currentPreferences.notifications_enabled || currentPreferences[type] === false) return;

          const Icon = getNotificationTypeIcon(row.type as NotificationType);
          const iconColor = getColor(row.type as NotificationType);

          toast.show({
            variant: TOAST_VARIANT_BY_TYPE[row.type as NotificationType],
            label: row.title,
            description: row.message ? row.message : undefined,
            icon: <Icon size={20} color={iconColor} />,
            duration: TOAST_DURATION_MS,
            actionLabel: "View",
            onActionPress: () => {
              const href = buildNotificationDeepLink(row.data, userId);
              if (href) {
                router.push(href);
              } else if (role === "landlord") {
                router.push("/landlord-notif");
              } else {
                router.push("/tenant-notif");
              }
            },
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, preferencesLoading, router, role, toast]);
}