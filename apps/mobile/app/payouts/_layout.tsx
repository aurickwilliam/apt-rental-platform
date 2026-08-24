import { Stack } from 'expo-router'

export default function PayoutsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[payoutId]" />
    </Stack>
  )
}
