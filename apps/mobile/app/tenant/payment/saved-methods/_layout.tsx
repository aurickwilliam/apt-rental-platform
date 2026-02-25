import { Stack } from "expo-router"

export default function _layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name='index' />
      <Stack.Screen name='add' />
      <Stack.Screen name='card-form' />
      <Stack.Screen name='e-wallet-redirect' />
    </Stack>
  )
}