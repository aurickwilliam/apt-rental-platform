"use client";

import { Button, Card, Radio, RadioGroup } from "@heroui/react";
import { IconBuildingBank, IconCashBanknote, IconClockHour4, IconCreditCard } from "@tabler/icons-react";
import type { BankCode } from "@repo/constants";

import { PAYMENT_METHODS } from "../constants";
import type { CashPaymentErrors, PaymentMethod } from "../types";
import BankTransferPicker from "./BankTransferPicker";
import CashPaymentForm from "./CashPaymentForm";

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  cashPaymentDate: Date | null;
  onCashPaymentDateChange: (date: Date) => void;
  cashErrors?: CashPaymentErrors;
  isCashPaymentPending: boolean;
  /**
   * Methods the landlord accepts; the others are not offered. Nothing is listed until the
   * list has loaded, and a failed load shows a retry instead of guessing.
   */
  acceptedMethods: PaymentMethod[];
  methodsLoading: boolean;
  methodsError: string | null;
  onRetryMethods: () => void;
  amount: number;
  selectedBank: BankCode | null;
  onBankChange: (bank: BankCode) => void;
  bankError?: string;
}

function PaymentMethodLogo({ method }: { method: PaymentMethod }) {
  const entry = PAYMENT_METHODS.find((item) => item.key === method);
  if (method === "Cash") {
    return <IconCashBanknote size={26} className="text-success-text" aria-hidden="true" />;
  }
  if (method === "Bank Transfer") {
    return <IconBuildingBank size={26} className="text-primary" aria-hidden="true" />;
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

function PaymentMethodOption({ method, isDisabled = false }: { method: PaymentMethod; isDisabled?: boolean }) {
  const entry = PAYMENT_METHODS.find((item) => item.key === method);
  const label = entry?.label ?? method;
  const description =
    method === "Cash"
      ? "Pay over the counter."
      : method === "Bank Transfer"
        ? "Pay from your bank account (test mode)."
      : method === "Debit/Credit-Card"
        ? "Pay using your card on PayMongo's secure page."
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
          <span className="block text-sm font-nunito font-semibold text-foreground">{label}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        </span>
      </Radio.Content>
    </Radio>
  );
}

export default function PaymentMethodSelector({
  selectedMethod,
  onPaymentMethodChange,
  cashPaymentDate,
  onCashPaymentDateChange,
  cashErrors,
  isCashPaymentPending,
  acceptedMethods,
  methodsLoading,
  methodsError,
  onRetryMethods,
  amount,
  selectedBank,
  onBankChange,
  bankError,
}: PaymentMethodSelectorProps) {
  const showCashForm = selectedMethod === "Cash";
  const showBankPicker = selectedMethod === "Bank Transfer";
  const offered = PAYMENT_METHODS.filter((method) => acceptedMethods.includes(method.key));

  return (
    <section aria-labelledby="payment-method-heading">
      <div className="mb-3">
        <h3 id="payment-method-heading" className="text-base font-nunito font-semibold text-foreground">
          Choose Payment Method
        </h3>
        <p className="text-sm text-muted-foreground">Select how you&apos;d like to pay this month&apos;s rent.</p>
      </div>

      <Card className="rounded-2xl border border-border bg-card shadow-none">
        <Card.Content className="p-4">
          {methodsLoading ? (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-6" role="status">
              <IconCreditCard size={18} className="text-primary" aria-hidden="true" />
              <p className="text-xs text-muted-foreground">Loading payment methods…</p>
            </div>
          ) : methodsError ? (
            <div className="rounded-xl border border-red-400 bg-red-200 p-3" role="alert">
              <p className="text-sm text-red-600">{methodsError}</p>
              <Button variant="secondary" size="sm" className="mt-2 cursor-pointer" onPress={onRetryMethods}>
                Retry
              </Button>
            </div>
          ) : (
            <RadioGroup
              aria-label="Payment method"
              value={selectedMethod ?? undefined}
              onChange={(value) => onPaymentMethodChange(value as PaymentMethod)}
              className="payment-method-radios grid grid-cols-1 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card"
            >
              {offered.map((method) => (
                <PaymentMethodOption key={method.key} method={method.key} isDisabled={method.key === "Cash" && isCashPaymentPending} />
              ))}
            </RadioGroup>
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

          {showBankPicker && <BankTransferPicker amount={amount} selectedBank={selectedBank} onBankChange={onBankChange} error={bankError} />}
          {showCashForm && <CashPaymentForm paymentDate={cashPaymentDate} onPaymentDateChange={onCashPaymentDateChange} errors={cashErrors} />}
        </Card.Content>
      </Card>
    </section>
  );
}
