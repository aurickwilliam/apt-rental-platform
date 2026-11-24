import { Text, View } from "react-native";
import { useState } from "react";
import { Button, Card, Checkbox, ControlField, Label, useToast } from "heroui-native";
import {
  PAYMENT_METHOD_TYPES,
  paymentMethodLabel,
  toggleAcceptedMethod,
  validateAcceptedMethods,
  type PaymentMethod,
} from "@repo/utils";
import { useTranslation } from "@/hooks/i18n";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";

interface AcceptedPaymentMethodsFormProps {
  initialMethods: PaymentMethod[];
  onSave: (methods: PaymentMethod[]) => Promise<PaymentMethod[]>;
  onCancel: () => void;
  isSaving: boolean;
  loadError: string | null;
  onRetry: () => void;
}

// The landlord picks which methods tenants may use. The draft is seeded once per visit so a
// background refetch never overwrites it. Only method names are stored.
export default function AcceptedPaymentMethodsForm({ initialMethods, onSave, onCancel, isSaving, loadError, onRetry }: AcceptedPaymentMethodsFormProps) {
  const { language, t } = useTranslation();
  const { toast } = useToast();
  const [draft, setDraft] = useState(initialMethods);
  const [baseline, setBaseline] = useState(initialMethods);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const validation = validateAcceptedMethods(draft);

  const submit = async () => {
    if (isSaving || !dirty || validation) return;
    setError(null);
    try {
      const saved = await onSave(draft);
      setDraft(saved);
      setBaseline(saved);
      toast.show({ variant: "success", label: t("settings.paymentMethods.saved") });
      onCancel();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("settings.paymentMethods.saveFailed"));
    }
  };

  return (
    <ScreenWrapper
      scrollable
      className="p-5"
      header={<StandardHeader title={t("settings.paymentMethods.title")} onBackPress={() => { if (!isSaving) onCancel(); }} />}
      footer={<View className="flex-row gap-3 p-5">
        <Button variant="tertiary" className="flex-1" isDisabled={isSaving} onPress={onCancel}><Button.Label>{t("common.cancel")}</Button.Label></Button>
        <Button className="flex-[2]" isDisabled={isSaving || !dirty || validation !== null} onPress={() => { void submit(); }}>
          <Button.Label>{isSaving ? t("settings.paymentMethods.saving") : t("settings.paymentMethods.save")}</Button.Label>
        </Button>
      </View>}
    >
      <Text className="text-muted text-sm font-inter mb-5">
        {t("settings.paymentMethods.description")}
      </Text>

      {loadError && <View className="gap-2 mb-4">
        <Text accessibilityRole="alert" className="text-danger text-sm font-inter">{loadError}</Text>
        <Button variant="secondary" size="sm" isDisabled={isSaving} onPress={onRetry}><Button.Label>{t("common.retry")}</Button.Label></Button>
      </View>}

      <Card className="rounded-3xl shadow-none">
        <Card.Body className="gap-3">
          <Text className="text-accent text-lg font-nunitoSemiBold">{t("settings.paymentMethods.acceptedTitle")}</Text>
          {PAYMENT_METHOD_TYPES.map((method) => (
            <ControlField
              key={method}
              isSelected={draft.includes(method)}
              isDisabled={isSaving}
              onSelectedChange={() => { setDraft((previous) => toggleAcceptedMethod(previous, method)); setError(null); }}
              accessibilityLabel={t("settings.paymentMethods.accept", { method: paymentMethodLabel(method, language) })}
              className="min-h-12"
            >
              <ControlField.Indicator><Checkbox className="size-5 border border-border shadow-none" /></ControlField.Indicator>
              <Label><Label.Text>{paymentMethodLabel(method, language)}</Label.Text></Label>
            </ControlField>
          ))}
        </Card.Body>
      </Card>

      {(validation || error) && (
        <Text accessibilityRole="alert" className="text-danger text-sm font-inter mt-4">{validation ?? error}</Text>
      )}
    </ScreenWrapper>
  );
}
