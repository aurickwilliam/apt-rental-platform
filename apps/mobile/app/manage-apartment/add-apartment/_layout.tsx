import { Stack } from 'expo-router'

export default function _layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="second-step" />
      <Stack.Screen name="third-step" />
      <Stack.Screen name="fourth-step" />
      <Stack.Screen name="fifth-step" />
      <Stack.Screen name="map-pin" />
      <Stack.Screen name="success" />
      <Stack.Screen name="amenities" />
    </Stack>
  )
}