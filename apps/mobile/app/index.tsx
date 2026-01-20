import { View, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from 'expo-status-bar';

export default function Index() {
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem("hasLaunched");

        if (hasLaunched === null) {
          // First time opening the app

          // Store the value of hasLaunched to true
          await AsyncStorage.setItem("hasLaunched", "true");
          router.replace("/onboarding");
        } else {
          // Not first time
          router.replace("/home");
        }
      } catch (error) {
        console.error("Launch check failed:", error);
        router.replace("/sign-up");
      }
    };

    checkFirstLaunch();
  }, []);

  // Simple loading screen while redirecting
  return (
    <>
      <StatusBar style="dark" />
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    </>
  );
}
