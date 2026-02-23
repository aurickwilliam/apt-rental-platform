import { Stack } from 'expo-router';

export default function _Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="step-one"
        options={{
          title: 'Personalization'
        }}
      />
      <Stack.Screen
        name="step-two"
        options={{
          title: 'Personalization'
        }}
      />
      <Stack.Screen
        name="step-three"
        options={{
          title: 'Personalization'
        }}
      />
      <Stack.Screen
        name="step-four"
        options={{
          title: 'Personalization'
        }}
      />
      <Stack.Screen
        name="step-five"
        options={{
          title: 'Personalization'
        }}
      />
    </Stack>
  );
}
