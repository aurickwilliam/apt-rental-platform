import { Stack } from "expo-router"

export default function _layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="current-apartment"/>
      <Stack.Screen name="edit-profile"/>
      <Stack.Screen name="current-lease"/>
      <Stack.Screen name="favorites"/>
      <Stack.Screen name="settings"/>
    </Stack>
  )
}