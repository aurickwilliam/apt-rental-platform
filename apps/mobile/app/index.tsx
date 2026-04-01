import { View, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS } from "@repo/constants";
import { supabase } from "@repo/supabase";

export default function Index() {
  useEffect(() => {
    const checkAppState = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem("hasLaunched");

        if (hasLaunched === null) {
          // First time opening the app
          await AsyncStorage.setItem("hasLaunched", "true");
          router.replace("/onboarding");
          return;
        }

        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // No session, go to sign-in
          router.replace("/sign-in");
          return;
        }

        // Session exists, fetch role and redirect accordingly
        const { data: userProfile } = await supabase
          .from("users")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        if (userProfile?.role === "landlord") {
          router.replace("/(tabs)/(landlord)/dashboard");
        } else {
          router.replace("/(tabs)/(tenant)/home");
        }

      } catch (error) {
        console.error("App state check failed:", error);
        router.replace("/sign-in");
      }
    };

    checkAppState();
  }, []);

  return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}