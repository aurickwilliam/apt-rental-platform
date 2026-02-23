import { Stack } from "expo-router";

export default function _Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="complete-profile" />
      <Stack.Screen name="verify-mobile" />
      <Stack.Screen name="otp-verification" />
      <Stack.Screen name="personalization" />
    </Stack>
  );
}
