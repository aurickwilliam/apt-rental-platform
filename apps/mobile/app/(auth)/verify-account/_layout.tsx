import { Stack } from "expo-router"

export default function _layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="select-id" />
      <Stack.Screen name="upload-id" />
      <Stack.Screen name="upload-selfie" />
      <Stack.Screen name="success" />
      <Stack.Screen name="failed" />
    </Stack>
  )
}