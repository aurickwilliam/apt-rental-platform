import { Stack } from "expo-router";

// Settings → Change Email: the request form, then one code page per inbox.
export default function ChangeEmailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="verify-current" />
      <Stack.Screen name="verify-new" />
    </Stack>
  );
}
