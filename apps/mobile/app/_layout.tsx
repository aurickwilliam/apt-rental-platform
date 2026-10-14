import * as Crypto from "expo-crypto";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from 'expo-system-ui';
import "./global.css";

// For using custom fonts
import { useFonts } from "expo-font";

import { useEffect } from "react";

import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PortalHost, PortalProvider } from "@gorhom/portal";
import { HeroUINativeProvider, useThemeColor } from "heroui-native";

import * as WebBrowser from "expo-web-browser";

import { supabase } from "@repo/supabase";

import { View } from "react-native";
import QueryProvider from "@/components/providers/QueryProvider";
import { setPrivateMediaCacheUser } from "@/service/media/privateMediaResolver";
import { usePortalStore } from "@/stores/usePortalStore";
import { clearQueryClient } from "@/utils/queryClient";
import { getSplashBackground } from "@/utils/splashBackground";
import {
  useInAppNotificationBanner,
  usePushRegistration,
  useNotificationTapHandler,
} from "@/hooks/notifications";
import { useVerificationReviewRealtime } from "@/hooks/verification";
import { useSuspensionGuard } from "@/hooks/auth/useSuspensionGuard";
import { useColors, useThemeSync } from 'hooks/useTheme';
import DevBadge from '../components/dev/DevBadge';

function NotificationManager() {
  usePushRegistration();
  useNotificationTapHandler();
  useInAppNotificationBanner();
  useVerificationReviewRealtime();
  useSuspensionGuard();

  return null;
}

if (typeof global.crypto !== "object") {
  global.crypto = {} as any;
}
if (typeof global.crypto.getRandomValues !== "function") {
  global.crypto.getRandomValues = Crypto.getRandomValues as any;
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const router = useRouter();
  const { isDark } = useColors();
  const backgroundColor = useThemeColor("background");
  // Applies the saved appearance (incl. System); false until it has loaded
  const themeReady = useThemeSync();
  // True once navigation has left the "/" boot screen (index) — the
  // redirect to the role-based home has committed and the destination
  // screen is mounted and rendering.
  const pathname = usePathname();
  const navigatedAway = pathname !== "/";

  // Initialize custom fonts
  const [fontsLoaded, fontError] = useFonts({
    "Inter_24pt-Regular": require("../assets/fonts/Inter_24pt-Regular.ttf"),
    "Inter_24pt-Medium": require("../assets/fonts/Inter_24pt-Medium.ttf"),
    "Inter_24pt-SemiBold": require("../assets/fonts/Inter_24pt-SemiBold.ttf"),
    "Nunito-Regular": require("../assets/fonts/Nunito-Regular.ttf"),
    "Nunito-Medium": require("../assets/fonts/Nunito-Medium.ttf"),
    "Nunito-SemiBold": require("../assets/fonts/Nunito-SemiBold.ttf"),
    "Nunito-Bold": require("../assets/fonts/Nunito-Bold.ttf"),
  });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(
      navigatedAway ? backgroundColor : getSplashBackground(isDark),
    );
  }, [backgroundColor, isDark, navigatedAway]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setPrivateMediaCacheUser(session?.user.id ?? null);
      if (event === 'SIGNED_OUT' || (session && usePortalStore.getState().authUserId && usePortalStore.getState().authUserId !== session.user.id)) {
        usePortalStore.getState().reset();
        clearQueryClient();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Keep the splash up until fonts are ready, the saved theme is applied AND
  // the boot redirect has committed (root navigation left "/"), so the "/"
  // spinner is never visible
  useEffect(() => {
    if ((fontsLoaded || fontError) && themeReady && navigatedAway) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, themeReady, navigatedAway, router]);

  // Fallback: never leave the splash up forever (e.g. deep-link cold starts
  // that bypass the index boot route)
  useEffect(() => {
    const timeout = setTimeout(() => SplashScreen.hideAsync(), 10_000);
    return () => clearTimeout(timeout);
  }, []);

  // Hold the tree until the saved theme has loaded; the splash covers the one
  // render in which the layout effect applies it
  if ((!fontsLoaded && !fontError) || !themeReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor }}>
      {/* Required by ScreenWrapper's KeyboardAwareScrollView */}
      <KeyboardProvider>
      <QueryProvider>
        <HeroUINativeProvider>
          <NotificationManager />
          <PortalProvider>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <BottomSheetModalProvider>
              <View style={{ flex: 1, backgroundColor }}>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor },
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="chat/[conversationId]" />
                  <Stack.Screen name="chat/archived" />
                  <Stack.Screen name="tenant" />
                  <Stack.Screen name="apartment/[apartmentId]" />
                  <Stack.Screen name="(notification)" />
                  <Stack.Screen name="settings" />
                  <Stack.Screen name="document-id" />
                  <Stack.Screen name="edit-profile" />
                  <Stack.Screen name="dev/giphy" />
                  <Stack.Screen name="dev/playground" />
                  <Stack.Screen name="dev/notification-toast" />
                </Stack>
                <PortalHost name="root" />
                <DevBadge />
              </View>
            </BottomSheetModalProvider>
          </PortalProvider>
        </HeroUINativeProvider>
      </QueryProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
