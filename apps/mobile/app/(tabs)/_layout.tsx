import { Stack } from 'expo-router'

export default function _layout() {
  return (
    <Stack 
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="(tenant)" />
      <Stack.Screen name="(landlord)" />
    </Stack>
  )
}