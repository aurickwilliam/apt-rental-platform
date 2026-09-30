import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';

import { COLORS } from '@repo/constants';

import { useProfile } from 'hooks/auth';
import { supabase } from '@repo/supabase';
import { usePortalStore } from '@/stores/usePortalStore';
import { portalHome } from '@/service/auth/portalPreference';

export default function TabsLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { profile, loading } = useProfile();
  const authUserId = usePortalStore((state) => state.authUserId);
  const portal = usePortalStore((state) => state.portal);
  const portalLoading = usePortalStore((state) => state.loading);

  const heldRoles: string[] = profile?.roles ?? [];
  const hasAppAccess = !heldRoles.includes('admin') && (heldRoles.includes('tenant') || heldRoles.includes('landlord'));

  useEffect(() => {
    if (loading || !profile || (authUserId === profile.user_id && (portalLoading || (portal && profile.roles.includes(portal))))) return;
    if (!hasAppAccess) return;
    void usePortalStore.getState().restore(profile.user_id, profile.roles).catch((error: unknown) => {
      console.error('Could not restore mobile portal', error);
      router.replace('/sign-in');
    });
  }, [profile, loading, authUserId, portal, portalLoading, hasAppAccess, router]);

  useEffect(() => {
    if (loading) return;

    if (!hasAppAccess) {
      void supabase.auth.signOut().then(({ error }) => {
        if (error) console.error('Could not clear unsupported mobile session', error);
        router.replace('/sign-in');
      });
      return;
    }

    if (portalLoading || !portal || authUserId !== profile?.user_id) return;

    // Only enforce tab-group routing when we're actually inside (tabs)
    if (segments[0] !== '(tabs)') return;

    const currentGroup = segments[1]; // '(landlord)' or '(tenant)'

    if (portal && currentGroup !== `(${portal})`) router.replace(portalHome(portal));
  }, [profile, loading, portalLoading, router, segments, hasAppAccess, portal, authUserId]);

  if (loading || portalLoading || !hasAppAccess || !portal || authUserId !== profile?.user_id) {
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
