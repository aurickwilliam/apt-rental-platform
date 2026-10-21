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
      <Stack.Screen name="add-expense" />
      <Stack.Screen name="edit-expense" />
      <Stack.Screen name="add-budget" />
      <Stack.Screen name="edit-budget" />
      <Stack.Screen name="category-expenses" />
      <Stack.Screen name="budget-category" />
      <Stack.Screen name="property-performance" />
    </Stack>
  );
}
