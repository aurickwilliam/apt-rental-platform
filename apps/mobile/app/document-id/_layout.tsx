import { Stack } from "expo-router"

export default function _layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index"/>
      <Stack.Screen name="select-document"/>
      <Stack.Screen name="upload"/>
      <Stack.Screen name="details"/>
    </Stack>
  )
}