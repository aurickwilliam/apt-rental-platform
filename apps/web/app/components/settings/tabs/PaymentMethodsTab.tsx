"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { IconBuildingBank, IconCash, IconCreditCard, IconDeviceMobile, IconQrcode, IconWallet } from "@tabler/icons-react";
import {
  PAYMENT_METHOD_TYPES,
  paymentMethodLabel,
  toggleAcceptedMethod,
  validateAcceptedMethods,
  type PaymentMethod,
} from "@repo/utils";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { useLandlordPaymentMethods } from "@/hooks/use-landlord-payment-methods";
import { useUser } from "@/hooks/use-user";
import ErrorBanner from "@/app/components/display/ErrorBanner";
import SettingsRow from "../SettingsRow";
import ToggleSwitch from "../ToggleSwitch";

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  GCash: <IconDeviceMobile size={20} aria-hidden="true" />,
  Maya: <IconWallet size={20} aria-hidden="true" />,
  QRPh: <IconQrcode size={20} aria-hidden="true" />,
  "Bank Transfer": <IconBuildingBank size={20} aria-hidden="true" />,
  "Debit/Credit-Card": <IconCreditCard size={20} aria-hidden="true" />,
  Cash: <IconCash size={20} aria-hidden="true" />,
};

interface PaymentMethodsFormProps {
  initialMethods: PaymentMethod[];
  onSave: (methods: PaymentMethod[]) => Promise<PaymentMethod[]>;
}

// The draft is seeded once, so a background refresh never overwrites unsaved toggles.
function PaymentMethodsForm({ initialMethods, onSave }: PaymentMethodsFormProps) {
  const { language, t } = useTranslation();
  const [draft, setDraft] = useState(initialMethods);
  const [baseline, setBaseline] = useState(initialMethods);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const validation = validateAcceptedMethods(draft);

  const submit = async () => {
    if (isSaving || !dirty || validation) return;
    setIsSaving(true);
    setError(null);
    try {
      const result = await onSave(draft);
      setDraft(result);
      setBaseline(result);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("settings.paymentMethods.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="mt-3 divide-y divide-border">
        {PAYMENT_METHOD_TYPES.map((method) => (
          <SettingsRow
            key={method}
            icon={METHOD_ICONS[method]}
            title={paymentMethodLabel(method, language)}
            suffix={
              <ToggleSwitch
                isSelected={draft.includes(method)}
                onValueChange={() => {
                  setDraft((previous) => toggleAcceptedMethod(previous, method));
                  setError(null);
                  setSaved(false);
                }}
                disabled={isSaving}
                aria-label={t("settings.paymentMethods.accept", { method: paymentMethodLabel(method, language) })}
              />
            }
          />
        ))}
      </div>

      {validation ? (
        <p role="alert" className="mt-3 px-4 text-sm text-danger">{validation}</p>
      ) : null}
      {error ? <ErrorBanner message={error} /> : null}

      <div className="mt-4 flex items-center justify-end gap-3 px-4">
        {saved && !dirty ? <span role="status" className="text-sm text-muted-foreground">{t("settings.paymentMethods.saved")}</span> : null}
        <Button
          variant="primary"
          className="cursor-pointer"
          isDisabled={isSaving || !dirty || validation !== null}
          onPress={() => void submit()}
        >
          {isSaving ? t("settings.paymentMethods.saving") : t("settings.paymentMethods.save")}
        </Button>
      </div>
    </>
  );
}

export default function PaymentMethodsTab() {
  const { t } = useTranslation();
  const { profile } = useUser();
  const methods = useLandlordPaymentMethods(profile?.id ?? null);

  return (
    <>
      <h2 className="font-nunito text-lg font-bold text-primary">{t("settings.paymentMethods.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("settings.paymentMethods.description")}
      </p>
      {methods.loading ? (
        <p className="mt-4 px-4 text-sm text-muted-foreground" role="status">{t("settings.paymentMethods.loading")}</p>
      ) : methods.error ? (
        <div className="mt-4 px-4">
          <ErrorBanner message={methods.error} />
          <Button variant="secondary" size="sm" className="mt-3 cursor-pointer" onPress={() => void methods.refresh()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : (
        <PaymentMethodsForm key={profile?.id} initialMethods={methods.data} onSave={methods.save} />
      )}
    </>
  );
}
