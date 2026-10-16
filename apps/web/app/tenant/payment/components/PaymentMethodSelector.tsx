"use client";

import {
  Accordion,
  AccordionBody,
  AccordionIndicator,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Button,
  Card,
  Radio,
  RadioGroup,
} from "@heroui/react";
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
        className="flex min-h-16 w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-all data-[selected=true]:border-primary data-[selected=true]:bg-primary/5 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60"
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
          {defaultMethod && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
              <div className="mb-3 flex items-start gap-2">
                <span className="rounded-lg bg-primary/10 p-2 text-primary" aria-hidden="true">
                  <IconCreditCard size={18} />
                </span>
                <div>
                  <p className="text-sm font-nunito font-semibold text-foreground">Saved preferences</p>
                  <p className="text-xs text-muted-foreground">Your default payment type is selected for faster checkout.</p>
                </div>
              </div>
              <RadioGroup
                aria-label="Saved payment preference"
                value={selectedMethod ?? undefined}
                onChange={(value) => onPaymentMethodChange(value as PaymentMethod)}
                className="payment-method-radios"
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
          )}

          {otherMethods.length > 0 && (
            <Accordion
              className={defaultMethod ? "mt-3" : undefined}
              defaultExpandedKeys={(defaultMethod ? new Set<string>() : new Set(["other-methods"])) as never}
            >
              <AccordionItem id="other-methods" className="overflow-hidden rounded-xl border border-border bg-card">
                <AccordionTrigger className="flex w-full items-center justify-between gap-3 p-3 text-left">
                  <span className="flex items-start gap-2">
                    <span className="rounded-lg bg-secondary p-2 text-primary" aria-hidden="true">
                      <IconCreditCard size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-nunito font-semibold text-foreground">
                        {defaultMethod ? "Other payment methods" : "Payment methods"}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {defaultMethod ? "Choose a different method for this payment." : "Choose how you want to pay this month’s rent."}
                      </span>
                    </span>
                  </span>
                  <AccordionIndicator className="shrink-0 text-muted-foreground" />
                </AccordionTrigger>
                <AccordionPanel>
                  <AccordionBody className="border-t border-border p-3">
                    <RadioGroup
                    aria-label="Other payment methods"
                    value={selectedMethod ?? undefined}
                    onChange={(value) => onPaymentMethodChange(value as PaymentMethod)}
                    className="payment-method-radios grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
                    >
                  {otherMethods.map((method) => (
                        <PaymentMethodOption key={method.key} method={method.key} layout="other" isDisabled={method.key === "Cash" && isCashPaymentPending} />
                      ))}
                    </RadioGroup>
                  </AccordionBody>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          )}

          {isCashPaymentPending && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200" role="status">
              <IconClockHour4 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-nunito font-semibold">Awaiting landlord confirmation</p>
                <p className="mt-0.5 text-xs">You can submit another cash payment only if this request is declined.</p>
              </div>
            </div>
          )}

          {preferencesLoading && <p className="mt-3 text-xs text-muted-foreground">Loading saved preferences…</p>}
          {showCardForm && <CardPaymentForm value={cardInformation} onChange={onCardInformationChange} errors={cardErrors} />}
          {showCashForm && <CashPaymentForm paymentDate={cashPaymentDate} onPaymentDateChange={onCashPaymentDateChange} errors={cashErrors} />}
        </Card.Content>
      </Card>
    </section>
  );
}
