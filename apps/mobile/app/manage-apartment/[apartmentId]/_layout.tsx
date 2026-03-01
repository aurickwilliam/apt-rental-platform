import { Stack } from "expo-router"

export default function _layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="description" />
      <Stack.Screen name="tenant-profile/[tenantId]" />
    </Stack>
  )
}