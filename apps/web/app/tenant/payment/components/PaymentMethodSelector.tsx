"use client";

import { Button, Card, Chip, Radio, RadioGroup, Separator } from "@heroui/react";
import { IconCashBanknote, IconSettings } from "@tabler/icons-react";
import type { CardFormErrors } from "@repo/utils";

import { PAYMENT_METHODS } from "../constants";
import type { CardInformation, CashPaymentErrors, PaymentMethod, PaymentMethodPreference } from "../types";
import CardPaymentForm from "./CardPaymentForm";
import CashPaymentForm from "./CashPaymentForm";

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  cardInformation: CardInformation;
  onCardInformationChange: (patch: Partial<CardInformation>) => void;
  cardErrors?: CardFormErrors;
  cashPaymentDate: Date | null;
  onCashPaymentDateChange: (date: Date) => void;
  cashErrors?: CashPaymentErrors;
  preferences: PaymentMethodPreference;
  preferencesLoading: boolean;
  onManagePreferences: () => void;
}

function PaymentMethodLogo({ method }: { method: PaymentMethod }) {
  const entry = PAYMENT_METHODS.find((item) => item.key === method);
  if (method === "Cash") {
    return <IconCashBanknote size={26} className="text-success-text" aria-hidden="true" />;
  }
  if (!entry) return null;

  if ("tileSrcs" in entry) {
    return (
      <span className="flex h-8 w-20 items-center justify-center gap-1.5" aria-hidden="true">
        {entry.tileSrcs.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" className="h-full w-1/2 object-contain" />
        ))}
      </span>
    );
  }

  if (!("tileSrc" in entry)) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={entry.tileSrc} alt="" className="h-9 w-16 object-contain" aria-hidden="true" />
  );
}

export default function PaymentMethodSelector({
  selectedMethod,
  onPaymentMethodChange,
  cardInformation,
  onCardInformationChange,
  cardErrors,
  cashPaymentDate,
  onCashPaymentDateChange,
  cashErrors,
  preferences,
  preferencesLoading,
  onManagePreferences,
}: PaymentMethodSelectorProps) {
  const showCardForm = selectedMethod === "Debit/Credit-Card";
  const showCashForm = selectedMethod === "Cash";

  return (
    <section aria-labelledby="payment-method-heading">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 id="payment-method-heading" className="text-base font-nunito font-semibold text-foreground">
            Choose Payment Method
          </h3>
          <p className="text-sm text-muted-foreground">Select how you&apos;d like to pay this month&apos;s rent.</p>
        </div>
        <Button variant="secondary" size="sm" onPress={onManagePreferences}>
          <IconSettings size={16} /> Manage preferences
        </Button>
      </div>

      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <Card.Content className="p-4">
          {preferences.savedMethods.length > 0 && (
            <div className="mb-4 rounded-xl bg-secondary p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="mr-1 text-sm font-nunito font-semibold text-foreground">Saved preferences</p>
                {preferences.savedMethods.map((method) => (
                  <Chip
                    key={method}
                    size="sm"
                    variant={selectedMethod === method ? "primary" : "secondary"}
                    color={selectedMethod === method ? "accent" : "default"}
                    onClick={() => onPaymentMethodChange(method)}
                    className="cursor-pointer"
                  >
                    {method === preferences.defaultMethod ? `${method} · Default` : method}
                  </Chip>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Preferences save the payment type only. Card and wallet details are never stored by APT.
              </p>
            </div>
          )}

          <Separator className={preferences.savedMethods.length > 0 ? "mb-4" : "mb-3"} />
          <p className="mb-3 text-sm font-nunito font-semibold text-foreground">All available methods</p>

          <RadioGroup
            aria-label="Payment method"
            value={selectedMethod ?? undefined}
            onChange={(value) => onPaymentMethodChange(value as PaymentMethod)}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            {PAYMENT_METHODS.map((method) => (
              <Radio key={method.key} value={method.key} className="min-w-0">
                <Radio.Content className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-center transition-all data-[selected=true]:border-primary data-[selected=true]:bg-primary/5">
                  <Radio.Control>
                    <Radio.Indicator />
                  </Radio.Control>
                  <PaymentMethodLogo method={method.key} />
                  <span className="text-xs font-nunito font-semibold text-foreground">{method.label}</span>
                </Radio.Content>
              </Radio>
            ))}
          </RadioGroup>

          {preferencesLoading && <p className="mt-3 text-xs text-muted-foreground">Loading saved preferences…</p>}
          {showCardForm && <CardPaymentForm value={cardInformation} onChange={onCardInformationChange} errors={cardErrors} />}
          {showCashForm && <CashPaymentForm paymentDate={cashPaymentDate} onPaymentDateChange={onCashPaymentDateChange} errors={cashErrors} />}
        </Card.Content>
      </Card>
    </section>
  );
}
