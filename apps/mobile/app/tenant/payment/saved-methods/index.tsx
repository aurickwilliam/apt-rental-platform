import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Spinner } from "heroui-native";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import PaymentPreferencesForm from "@/components/payments/PaymentPreferencesForm";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { usePaymentMethodPreferences } from "@/hooks/payments/usePaymentMethodPreferences";

export default function PaymentPreferences() {
  const router = useRouter();
  const user = useCurrentUser();
  const userId = user.data?.id ?? null;
  const preferences = usePaymentMethodPreferences(userId);
  if (userId && !user.isLoading && preferences.hasLoaded) {
    return <PaymentPreferencesForm key={userId} initialPreferences={preferences.preferences}
      onSave={preferences.save} isSaving={preferences.isSaving} loadError={preferences.error}
      onRetry={() => { void preferences.refetch(); }}
      onCancel={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/(tenant)/profile'); }} />;
  }
  return <ScreenWrapper header={<StandardHeader title="Payment Preferences" />} className="p-5">
    <View className="flex-1 items-center justify-center gap-4">
      {user.isLoading || preferences.loading ? <Spinner size="lg" accessibilityLabel="Loading payment preferences" /> : <>
        <Text accessibilityRole="alert" className="text-foreground text-center font-inter">{preferences.error ?? (user.error ? "Couldn't load your profile. Please try again." : "Sign in to manage your payment preferences.")}</Text>
        <Button variant="secondary" onPress={() => { void user.refetch(); if (userId) void preferences.refetch(); }}><Button.Label>Try Again</Button.Label></Button>
      </>}
    </View>
  </ScreenWrapper>;
}
