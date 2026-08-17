import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';

import { COLORS } from '@repo/constants';

import { useProfile } from 'hooks/auth';

export default function TabsLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { profile, loading } = useProfile();

  useEffect(() => {
    if (loading || !profile?.role) return;

    // Only enforce tab-group routing when we're actually inside (tabs)
    if (segments[0] !== '(tabs)') return;

    const currentGroup = segments[1]; // '(landlord)' or '(tenant)'

    if (profile.role === 'landlord' && currentGroup !== '(landlord)') {
      router.replace('/(tabs)/(landlord)/dashboard');
    } else if (profile.role === 'tenant' && currentGroup !== '(tenant)') {
      router.replace('/(tabs)/(tenant)/rentals');
    }
  }, [profile, loading, router, segments]);

  if (loading) {
    // Splash-colored backdrop while the profile loads — no spinner, so the
    // splash-to-home transition is seamless
    return <View style={{ flex: 1, backgroundColor: COLORS.light.primary }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tenant)" />
      <Stack.Screen name="(landlord)" />
    </Stack>
  );
}
