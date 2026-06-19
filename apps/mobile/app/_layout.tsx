import * as Crypto from "expo-crypto";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from 'expo-system-ui';
import "./global.css";

// For using custom fonts
import { useFonts } from "expo-font";

import { useEffect } from "react";

import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PortalHost, PortalProvider } from "@gorhom/portal";
import { HeroUINativeProvider } from "heroui-native";

import * as WebBrowser from "expo-web-browser";

import { COLORS } from "@repo/constants";

import { supabase } from "@repo/supabase";

import { Appearance } from "react-native";         
import { useThemeStore } from "../stores/useThemeStore";
import { useTheme } from 'hooks/useTheme';

function ThemeInitializer() {
  const { themeMode } = useThemeStore();

  useEffect(() => {
    if (themeMode !== "system") {
      Appearance.setColorScheme(themeMode);
    }
  }, [themeMode]);

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
  const { isDark } = useTheme();
  
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
    SystemUI.setBackgroundColorAsync(COLORS.light.primary);
  }, []);

  // Check if the fonts have loaded or if there was an error
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();

      // if (__DEV__) {
      //   router.replace('/(auth)/personalization/step-one');
      // }
    }

    // REMOVED: Force redirect to complete profile if mobile number is missing
    
    // Redirect incomplete profiles on every app open
    // (async () => {
    //   const { data: { session } } = await supabase.auth.getSession();
    //   if (!session) return;

    //   const { data: profile } = await supabase
    //     .from('users')
    //     .select('role, mobile_number')
    //     .eq('user_id', session.user.id)
    //     .single();

    //   if (profile && !profile.mobile_number) {
    //     router.replace({
    //       pathname: '/(auth)/auth-complete-profile',
    //       params: {
    //         email: session.user.email ?? '',
    //         userSide: profile.role ?? 'tenant',
    //       },
    //     });
    //   }
    // })();
  }, [fontsLoaded, fontError, router]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeInitializer />
      <HeroUINativeProvider>
        <PortalProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <BottomSheetModalProvider>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="dev" />
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="chat/[conversationId]" />
              <Stack.Screen name="tenant" />
              <Stack.Screen name="apartment/[apartmentId]" />
              <Stack.Screen name="(notification)" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="document-id" />
            </Stack>
          </BottomSheetModalProvider>
          <PortalHost name="root" />
        </PortalProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
