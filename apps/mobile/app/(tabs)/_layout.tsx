import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';

import { useProfile } from 'hooks/auth';
import { useColors } from 'hooks/useTheme';

export default function TabsLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { profile, loading } = useProfile();
  const { colors } = useColors();

  useEffect(() => {
    if (loading || !profile?.role) return;

    const currentGroup = segments[1]; // '(landlord)' or '(tenant)'

    if (profile.role === 'landlord' && currentGroup !== '(landlord)') {
      router.replace('/(tabs)/(landlord)/dashboard');
    } else if (profile.role === 'tenant' && currentGroup !== '(tenant)') {
      router.replace('/(tabs)/(tenant)/rentals');
    }
  }, [profile, loading, router, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tenant)" />
      <Stack.Screen name="(landlord)" />
    </Stack>
  );
}
