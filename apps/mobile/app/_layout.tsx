import { Stack } from "expo-router";
import './global.css';

// For using custom fonts
import {useFonts} from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from "react";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'DMSerifText-Regular': require('../assets/fonts/DMSerifText-Regular.ttf'),
    'Inter_24pt-Regular': require('../assets/fonts/Inter_24pt-Regular.ttf'),
    'Inter_24pt-Medium': require('../assets/fonts/Inter_24pt-Medium.ttf'),
  });

  useEffect(() => {
      if (fontsLoaded || fontError) {
        SplashScreen.hideAsync();
      }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
      return null;
  }

  return (
      <Stack>
          <Stack.Screen
            name="index"
          />

          <Stack.Screen
              name="(auth)"
              options={{
                headerShown: false,
              }}
          />
      </Stack>
  );
}
