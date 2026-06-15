import { Stack } from "expo-router";

export default function LandlordLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="maintenance-requests" />
      <Stack.Screen name="maintenance-requests/[requestId]" />
      <Stack.Screen name="visit-requests" />
      <Stack.Screen name="visit-requests/pending" />
      <Stack.Screen name="visit-requests/[requestId]" />
      <Stack.Screen name="tenant-applications" />
      <Stack.Screen name="tenant-applications/[applicationId]" />
      <Stack.Screen name="analytics" />
    </Stack>
  );
}
