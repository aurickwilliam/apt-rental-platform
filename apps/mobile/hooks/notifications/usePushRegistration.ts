import { useEffect, useRef } from "react";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { supabase } from "@repo/supabase";

import { useCurrentUser } from "@/hooks/auth";
import { useNotificationPreferences } from "@/hooks/notifications/useNotificationPreferences";
import { deletePushToken, upsertPushToken } from "@/service/notificationService";

// Foreground presentation: in-app toasts handle the visible banner while the
// app is open, so the OS banner/list are suppressed here. Sound is kept for an
// audio cue. Background/terminated OS banners are unaffected by this handler.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function getProjectId(): string | null {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  return typeof projectId === "string" ? projectId : null;
}

/**
 * Registers the device's Expo push token with the backend while signed in and
 * the push notification preference is enabled; removes it when disabled or on
 * sign-out. No-op on iOS simulators (Expo push does not deliver there) and when
 * the user denies permission. Android emulators with Google Play services
 * register normally.
 */
export function usePushRegistration() {
  const currentUserQuery = useCurrentUser();
  const userId = currentUserQuery.data?.id ?? null;

  const { preferences, loading: preferencesLoading } = useNotificationPreferences();
  const pushEnabled = preferences.push_enabled;

  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        const token = registeredTokenRef.current;
        registeredTokenRef.current = null;
        if (token) {
          deletePushToken(token).catch((error) => {
            console.error("Push token removal failed:", error);
          });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId || preferencesLoading) return;

    if (!pushEnabled) {
      const token = registeredTokenRef.current;
      registeredTokenRef.current = null;
      if (token) {
        deletePushToken(token).catch((error) => {
          console.error("Push token removal failed:", error);
        });
      }
      return;
    }

    if (Platform.OS === "ios" && !Device.isDevice) return;

    const currentUserId = userId;
    let cancelled = false;

    async function register() {
      try {
        const projectId = getProjectId();
        if (!projectId) {
          console.warn("Push registration skipped: EAS projectId not configured.");
          return;
        }

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Default",
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const permission = await Notifications.getPermissionsAsync();
        if (!permission.granted) {
          const requested = await Notifications.requestPermissionsAsync();
          if (!requested.granted) return;
        }

        const token = await Notifications.getExpoPushTokenAsync({ projectId });
        if (cancelled || !token.data) return;

        registeredTokenRef.current = token.data;
        await upsertPushToken(currentUserId, token.data, Platform.OS === "ios" ? "ios" : "android");
      } catch (error) {
        console.error("Push token registration failed:", error);
      }
    }

    void register();

    return () => {
      cancelled = true;
    };
  }, [userId, preferencesLoading, pushEnabled]);
}