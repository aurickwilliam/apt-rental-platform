import { Stack } from "expo-router"

export default function _layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index"/>
      <Stack.Screen name="success"/>
      <Stack.Screen name="methods"/>
      <Stack.Screen name="failed"/>
      <Stack.Screen name="e-wallet-redirect"/>
      <Stack.Screen name="saved-methods" />
    </Stack>
  )
}