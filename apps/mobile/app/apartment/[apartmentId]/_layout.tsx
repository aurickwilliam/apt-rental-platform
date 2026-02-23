import { Stack } from "expo-router"

export default function ApartmentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="apply" />
      <Stack.Screen name="ratings"/>
      <Stack.Screen name="rate-apartment"/>
      <Stack.Screen name="map-view"/>
      <Stack.Screen name="included-perks"/>
      <Stack.Screen name="request-visit"/>
      <Stack.Screen name="view-lease"/>
    </Stack>
  )
}