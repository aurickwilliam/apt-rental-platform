"use client";

import { Button, Card, Radio, RadioGroup } from "@heroui/react";
import { IconCashBanknote, IconClockHour4, IconCreditCard, IconSettings } from "@tabler/icons-react";
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
  isCashPaymentPending: boolean;
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

function PaymentMethodOption({
  method,
  layout,
  isDisabled = false,
}: {
  method: PaymentMethod;
  layout: "default" | "saved" | "other";
  isDisabled?: boolean;
}) {
  const entry = PAYMENT_METHODS.find((item) => item.key === method);
  const label = entry?.label ?? method;
  const description =
    method === "Cash"
      ? "Pay over the counter."
      : method === "Debit/Credit-Card"
        ? "Pay using your card."
        : `Pay using ${label}.`;

  return (
    <Radio value={method} isDisabled={isDisabled} className="min-w-0">
      <Radio.Content
        className="flex min-h-16 w-full items-center gap-3 p-3 text-left transition-colors data-[selected=true]:bg-primary/10 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60"
      >
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <span className="shrink-0">
          <PaymentMethodLogo method={method} />
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-nunito font-semibold text-foreground">{label}</span>
            {layout === "default" && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-nunito font-semibold text-primary">Default</span>}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        </span>
      </Radio.Content>
    </Radio>
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
  isCashPaymentPending,
}: PaymentMethodSelectorProps) {
  const showCardForm = selectedMethod === "Debit/Credit-Card";
  const showCashForm = selectedMethod === "Cash";
  const defaultMethod = preferences.defaultMethod ?? preferences.savedMethods[0] ?? null;
  const savedMethods = preferences.savedMethods;
  const otherMethods = PAYMENT_METHODS.filter((method) => !savedMethods.includes(method.key));

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

      <Card className="rounded-2xl border border-border bg-card shadow-none">
        <Card.Content className="p-4">
          <div className={otherMethods.length > 0 ? "grid gap-3 lg:grid-cols-2" : undefined}>
            {savedMethods.length > 0 ? (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                <div className="mb-3 flex items-start gap-2">
                  <span className="rounded-lg bg-primary/10 p-2 text-primary" aria-hidden="true">
                    <IconCreditCard size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-nunito font-semibold text-foreground">Preferred payment</p>
                    <p className="text-xs text-muted-foreground">Your default payment type is selected for faster checkout.</p>
                  </div>
                </div>
                <RadioGroup
                  aria-label="Preferred payment method"
                  value={selectedMethod ?? undefined}
                  onChange={(value) => onPaymentMethodChange(value as PaymentMethod)}
                  className="payment-method-radios grid grid-cols-1 divide-y divide-border overflow-hidden rounded-xl border border-primary/20 bg-card"
                >
                  {savedMethods.map((method) => (
                    <PaymentMethodOption
                      key={method}
                      method={method}
                      layout={method === defaultMethod ? "default" : "saved"}
                      isDisabled={method === "Cash" && isCashPaymentPending}
                    />
                  ))}
                </RadioGroup>
              </div>
            ) : preferencesLoading ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-6">
                <p className="text-xs text-muted-foreground">Loading saved preferences…</p>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                <span className="rounded-lg bg-primary/10 p-2 text-primary" aria-hidden="true">
                  <IconCreditCard size={18} />
                </span>
                <p className="mt-3 text-sm font-nunito font-semibold text-foreground">No preferred payment method yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Add one to skip choosing a method every time you pay.</p>
                <Button variant="secondary" size="sm" className="mt-3" onPress={onManagePreferences}>
                  <IconSettings size={16} /> Add preferred
                </Button>
              </div>
            )}

            {otherMethods.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="mb-3 flex items-start gap-2">
                  <span className="rounded-lg bg-secondary p-2 text-primary" aria-hidden="true">
                    <IconCreditCard size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-nunito font-semibold text-foreground">
                      {savedMethods.length > 0 ? "Other payment methods" : "Payment methods"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {savedMethods.length > 0 ? "Choose a different method for this payment." : "Choose how you want to pay this month’s rent."}
                    </p>
                  </div>
                </div>
                <RadioGroup
                  aria-label="Other payment methods"
                  value={selectedMethod ?? undefined}
                  onChange={(value) => onPaymentMethodChange(value as PaymentMethod)}
                  className="payment-method-radios grid grid-cols-1 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card"
                >
                  {otherMethods.map((method) => (
                    <PaymentMethodOption key={method.key} method={method.key} layout="other" isDisabled={method.key === "Cash" && isCashPaymentPending} />
                  ))}
                </RadioGroup>
              </div>
            )}
          </div>

          {isCashPaymentPending && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200" role="status">
              <IconClockHour4 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-nunito font-semibold">Awaiting landlord confirmation</p>
                <p className="mt-0.5 text-xs">You can submit another cash payment only if this request is declined.</p>
              </div>
            </div>
          )}

          {showCardForm && <CardPaymentForm value={cardInformation} onChange={onCardInformationChange} errors={cardErrors} />}
          {showCashForm && <CashPaymentForm paymentDate={cashPaymentDate} onPaymentDateChange={onCashPaymentDateChange} errors={cashErrors} />}
        </Card.Content>
      </Card>
    </section>
  );
}
