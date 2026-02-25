import { Stack } from "expo-router"

export default function _layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="otp-verification" />
      <Stack.Screen name="reset-password"/>
      <Stack.Screen name="updated" />
    </Stack>
  )
}