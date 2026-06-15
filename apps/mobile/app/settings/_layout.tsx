import { Stack } from "expo-router"

export default function _layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index"/>
      <Stack.Screen name="language-region"/>
      <Stack.Screen name="faq"/>
      <Stack.Screen name="terms"/>
      <Stack.Screen name="privacy-policy"/>
      <Stack.Screen name="about"/>
    </Stack>
  )
}
