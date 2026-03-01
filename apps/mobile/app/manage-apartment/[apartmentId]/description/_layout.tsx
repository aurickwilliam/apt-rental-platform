import { Stack } from "expo-router"

export default function _layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-description" />
      <Stack.Screen name="edit-main" />
      <Stack.Screen name="edit-specs" />
      <Stack.Screen name="edit-perks" />
    </Stack>
  )
}