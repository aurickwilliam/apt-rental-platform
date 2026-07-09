import { Stack } from "expo-router"

export default function TenantLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="current-apartment"/>
      <Stack.Screen name="edit-profile"/>
      <Stack.Screen name="current-lease"/>
      <Stack.Screen name="favorites" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="request-maintenance" />
      <Stack.Screen name="maintenance-history" />
    </Stack>
  )
}
