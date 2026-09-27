import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';

import { COLORS } from '@repo/constants';

import { useProfile } from 'hooks/auth';
import { supabase } from '@repo/supabase';

export default function TabsLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { profile, loading } = useProfile();

  // Multi-role: the account may enter through any portal it holds.
  // Routing preference is the primary role (roles[0]); the switcher UI
  // navigates cross-portal explicitly. Single-role parity is preserved.
  const heldRoles: string[] = profile?.roles ?? [];
  const hasAppAccess = heldRoles.includes('tenant') || heldRoles.includes('landlord');
  const primaryRole = heldRoles[0] ?? null;

  useEffect(() => {
    if (loading) return;

    if (!hasAppAccess) {
      void supabase.auth.signOut().then(({ error }) => {
        if (error) console.error('Could not clear unsupported mobile session', error);
        router.replace('/sign-in');
      });
      return;
    }

    // Only enforce tab-group routing when we're actually inside (tabs)
    if (segments[0] !== '(tabs)') return;

    const currentGroup = segments[1]; // '(landlord)' or '(tenant)'

    if (primaryRole === 'landlord' && currentGroup !== '(landlord)') {
      router.replace('/(tabs)/(landlord)/dashboard');
    } else if (primaryRole !== 'landlord' && currentGroup !== '(tenant)') {
      router.replace('/(tabs)/(tenant)/rentals');
    }
  }, [profile, loading, router, segments, hasAppAccess, primaryRole]);

  if (loading || !hasAppAccess) {
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
