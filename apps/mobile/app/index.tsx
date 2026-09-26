import { View } from "react-native";
import { useEffect } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS } from "@repo/constants";
import { supabase } from "@repo/supabase";
import { useTheme } from "hooks/useTheme";

export default function Index() {
  const { isDark } = useTheme();

  useEffect(() => {
    const checkOnboarding = async () => {
      const hasLaunched = await AsyncStorage.getItem("hasLaunched");
      if (hasLaunched === null) {
        await AsyncStorage.setItem("hasLaunched", "true");
        router.replace("/onboarding");
        return true; // signal to skip auth check
      }
      return false;
    };

    const redirectByRole = async (userId: string) => {
      const { data: userProfile } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (userProfile?.role === "landlord") {
        router.replace("/(tabs)/(landlord)/dashboard");
      } else if (userProfile?.role === "tenant") {
        router.replace("/(tabs)/(tenant)/rentals");
      } else {
        await supabase.auth.signOut();
        router.replace("/sign-in");
      }
    };

    // Listen to auth state — fires once session is restored from storage
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          const wentToOnboarding = await checkOnboarding();
          if (wentToOnboarding) {
            return;
          }

          if (!session) {
            router.replace("/sign-in");
          } else {
            await redirectByRole(session.user.id);
          }
        } catch (error) {
          console.error("Error during app boot:", error);
          router.replace("/sign-in");
        } finally {
          subscription.unsubscribe();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Splash-colored backdrop while the boot redirect runs — no spinner, so
  // the splash-to-home transition is seamless (also covers JS reloads, where
  // the native splash does not re-appear). Matches the native splash
  // background per mode (light: brand blue, dark: near-black).
  const backgroundColor = isDark ? COLORS.dark.white : COLORS.light.primary;
  return <View style={{ flex: 1, backgroundColor }} />;
}
