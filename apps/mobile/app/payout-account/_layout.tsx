import { Stack } from 'expo-router'

export default function PayoutAccountLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[destinationId]" />
    </Stack>
  )
}
