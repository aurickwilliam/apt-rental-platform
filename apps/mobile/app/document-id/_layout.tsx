import { useEffect } from "react"
import { Stack, useRouter } from "expo-router"

import { useProfile } from "hooks/auth"
import { usePortalStore } from "@/stores/usePortalStore"

/**
 * APT Passport is available to verified accounts only. Non-verified users
 * are redirected: unverified/rejected accounts go to verification, pending
 * accounts return to their portal profile (the verification card there
 * explains the pending state).
 */
function usePassportGuard() {
  const router = useRouter();
  const { profile, loading } = useProfile();
  const portal = usePortalStore((state) => state.portal);

  useEffect(() => {
    if (loading || !profile) return;
    if (profile.account_status === 'verified') return;

    if (profile.account_status === 'pending') {
      router.replace(
        portal === 'landlord' ? '/(tabs)/(landlord)/profile' : '/(tabs)/(tenant)/profile'
      );
    } else {
      router.replace('/(auth)/verify-account');
    }
  }, [loading, profile, portal, router]);
}

export default function DocumentIdLayout() {
  usePassportGuard();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index"/>
      <Stack.Screen name="select-document"/>
      <Stack.Screen name="upload"/>
      <Stack.Screen name="[documentId]"/>
    </Stack>
  )
}
