import { Stack } from "expo-router"

export default function _layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="apartment-summary" />
      <Stack.Screen name="review-information" />
      <Stack.Screen name="submitted" />
      <Stack.Screen name="first-process" />
      <Stack.Screen name="second-process" />
      <Stack.Screen name="third-process" />
    </Stack>
  )
}