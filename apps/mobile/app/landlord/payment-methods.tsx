import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Spinner } from "heroui-native";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import AcceptedPaymentMethodsForm from "@/components/payments/AcceptedPaymentMethodsForm";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { useLandlordPaymentMethods } from "@/hooks/payments/useLandlordPaymentMethods";

export default function LandlordPaymentMethods() {
  const router = useRouter();
  const user = useCurrentUser();
  const landlordId = user.data?.id ?? null;
  const methods = useLandlordPaymentMethods(landlordId);
  const goBack = () => { if (router.canGoBack()) router.back(); else router.replace("/settings"); };

  if (landlordId && !user.isLoading && methods.hasLoaded) {
    return <AcceptedPaymentMethodsForm key={landlordId} initialMethods={methods.acceptedMethods}
      onSave={methods.save} isSaving={methods.isSaving} loadError={methods.error}
      onRetry={() => { void methods.refetch(); }} onCancel={goBack} />;
  }
  return <ScreenWrapper header={<StandardHeader title="Payment Methods" />} className="p-5">
    <View className="flex-1 items-center justify-center gap-4">
      {user.isLoading || methods.loading ? <Spinner size="lg" accessibilityLabel="Loading payment methods" /> : <>
        <Text accessibilityRole="alert" className="text-foreground text-center font-inter">{methods.error ?? (user.error ? "Couldn't load your profile. Please try again." : "Sign in to manage your payment methods.")}</Text>
        <Button variant="secondary" onPress={() => { void user.refetch(); if (landlordId) void methods.refetch(); }}><Button.Label>Try Again</Button.Label></Button>
      </>}
    </View>
  </ScreenWrapper>;
}
