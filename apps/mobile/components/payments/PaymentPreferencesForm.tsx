import { Text, View } from "react-native";
import { useEffect, useRef, useState } from "react";
import { usePreventRemove } from "expo-router/react-navigation";
import { Button, Card, Checkbox, ControlField, Label, Radio, RadioGroup, useToast } from "heroui-native";
import { PAYMENT_METHOD_TYPES, isPaymentMethod, paymentMethodLabel, type PaymentMethodPreference } from "@repo/utils";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import { usePaymentPreferencesForm } from "@/hooks/payments/usePaymentPreferencesForm";

interface PaymentPreferencesFormProps {
  initialPreferences: PaymentMethodPreference;
  onSave: (preferences: PaymentMethodPreference) => Promise<PaymentMethodPreference>;
  onCancel: () => void;
  isSaving: boolean;
  loadError: string | null;
  onRetry: () => void;
}

export default function PaymentPreferencesForm({ initialPreferences, onSave, onCancel, isSaving, loadError, onRetry }: PaymentPreferencesFormProps) {
  const form = usePaymentPreferencesForm(initialPreferences, onSave);
  const { toast } = useToast();
  const busy = isSaving || form.isSubmitting;
  const [saved, setSaved] = useState(false);
  const closed = useRef(false);
  usePreventRemove(busy, () => {});
  useEffect(() => {
    // Wait for the save guard to be released before navigating back, as Web
    // closes its preferences modal after a successful save. No timer is needed.
    if (!saved || busy || closed.current) return;
    closed.current = true;
    toast.show({ variant: "success", label: "Payment preferences saved" });
    onCancel();
  }, [saved, busy, onCancel, toast]);

  return (
    <ScreenWrapper
      scrollable
      className="p-5"
      header={<StandardHeader title="Payment Preferences" onBackPress={() => { if (!busy) onCancel(); }} />}
      footer={<View className="flex-row gap-3 p-5">
        <Button variant="tertiary" className="flex-1" isDisabled={busy} onPress={onCancel}><Button.Label>Cancel</Button.Label></Button>
        <Button className="flex-[2]" isDisabled={busy || !form.dirty} onPress={() => {
          void form.submit().then((success) => { if (success) setSaved(true); });
        }}><Button.Label>{busy ? "Saving…" : "Save preferences"}</Button.Label></Button>
      </View>}
    >
      <Text className="text-muted text-sm font-inter mb-5">
        Save payment types you use often and choose a default for rent checkout. APT never saves card details, wallet accounts, or security codes.
      </Text>

      {loadError && <View className="gap-2 mb-4">
        <Text accessibilityRole="alert" className="text-danger text-sm font-inter">{loadError}</Text>
        <Button variant="secondary" size="sm" isDisabled={busy} onPress={onRetry}><Button.Label>Retry preferences</Button.Label></Button>
      </View>}

      <Card className="rounded-3xl shadow-none mb-5">
        <Card.Body className="gap-3">
          <Text className="text-accent text-lg font-nunitoSemiBold">Preferred payment types</Text>
          {PAYMENT_METHOD_TYPES.map((method) => (
            <ControlField
              key={method}
              isSelected={form.draft.savedMethods.includes(method)}
              isDisabled={busy}
              onSelectedChange={() => form.toggleMethod(method)}
              accessibilityLabel={`Prefer ${paymentMethodLabel(method)}`}
              className="min-h-12"
            >
              <ControlField.Indicator><Checkbox className="size-5 border border-border shadow-none" /></ControlField.Indicator>
              <Label><Label.Text>{paymentMethodLabel(method)}</Label.Text></Label>
            </ControlField>
          ))}
        </Card.Body>
      </Card>

      {form.draft.savedMethods.length > 0 ? (
        <Card className="rounded-3xl shadow-none">
          <Card.Body className="gap-3">
            <Text className="text-accent text-lg font-nunitoSemiBold">Default method</Text>
            <Text className="text-muted text-sm font-inter">You can still choose another method for any payment.</Text>
            <RadioGroup
              value={form.draft.defaultMethod ?? undefined}
              isDisabled={busy}
              onValueChange={(value) => { if (isPaymentMethod(value)) form.setDefault(value); }}
            >
              {form.draft.savedMethods.map((method) => (
                <RadioGroup.Item key={method} value={method} accessibilityLabel={`Default ${paymentMethodLabel(method)}`} className="flex-row items-center justify-between gap-3 min-h-12 py-2">
                  <Label>{paymentMethodLabel(method)}</Label>
                  <Radio><Radio.Indicator className="border border-border shadow-none rounded-full" /></Radio>
                </RadioGroup.Item>
              ))}
            </RadioGroup>
          </Card.Body>
        </Card>
      ) : <Text className="text-muted text-sm font-inter">No preferred payment method yet. Select a type above to choose a default.</Text>}

      {form.error && <Text accessibilityRole="alert" className="text-danger text-sm font-inter mt-4">{form.error}</Text>}
    </ScreenWrapper>
  );
}
