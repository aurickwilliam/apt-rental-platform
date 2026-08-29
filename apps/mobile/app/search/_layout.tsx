import { Stack } from "expo-router";

export default function SearchLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ai-search" />
      <Stack.Screen name="section/[sectionId]" />
    </Stack>
  );
}