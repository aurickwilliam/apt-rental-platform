import { Stack } from "expo-router";
import "./global.css";

// For using custom fonts
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Initialize custom fonts
  const [fontsLoaded, fontError] = useFonts({
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "DMSerifText-Regular": require("../assets/fonts/DMSerifText-Regular.ttf"),
    "Inter_24pt-Regular": require("../assets/fonts/Inter_24pt-Regular.ttf"),
    "Inter_24pt-Medium": require("../assets/fonts/Inter_24pt-Medium.ttf"),
    "Inter_24pt-SemiBold": require("../assets/fonts/Inter_24pt-SemiBold.ttf"),
  });

  // Check if the fonts have loaded or if there was an error
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="apartment/[apartmentId]" />
      <Stack.Screen name="chat/[conversationId]" />
      <Stack.Screen name="tenant-favorites"/>
      <Stack.Screen name="current-apartment-details"/>
    </Stack>
  );
}
