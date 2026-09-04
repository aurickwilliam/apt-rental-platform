"use client";

import { Card, Checkbox, Separator, Input, Label, TextField } from "@heroui/react";
import type { CardFormErrors } from "@repo/utils";
import { formatExpiryDate, validateCardNumber } from "@repo/utils";
import type { CardInformation } from "../types";

interface CardPaymentFormProps {
  value: CardInformation;
  onChange: (patch: Partial<CardInformation>) => void;
  errors?: CardFormErrors;
}

export default function CardPaymentForm({ value, onChange, errors }: CardPaymentFormProps) {
  const handleCardNumberChange = (text: string) => {
    const { formatted, isValid } = validateCardNumber(text);
    onChange({ cardNumber: formatted, isCardNumberValid: isValid });
  };

  const handleExpiryChange = (text: string) => {
    onChange({ expiryDate: formatExpiryDate(text) });
  };

  const cardNumberInvalid = !!errors?.cardNumber || (value.cardNumber.length >= 13 && value.isCardNumberValid === false);

  return (
    <div className="mt-5">
      <Separator className="mb-5" />
      <h4 className="text-sm font-nunito font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Card Details</h4>

      <div className="grid gap-3">
        <TextField isRequired isInvalid={cardNumberInvalid} className="w-full">
          <Label className="text-xs text-zinc-600 dark:text-zinc-400">Card Number</Label>
          <Input
            placeholder="**** **** **** ****"
            value={value.cardNumber}
            maxLength={23}
            onChange={(e) => handleCardNumberChange(e.target.value)}
            className="rounded-xl bg-white dark:bg-zinc-900"
          />
          {errors?.cardNumber ? (
            <p className="text-xs text-red-600 mt-1">{errors.cardNumber}</p>
          ) : value.cardNumber.length > 0 && value.isCardNumberValid === false ? (
            <p className="text-xs text-red-600 mt-1">Please enter a valid card number.</p>
          ) : null}
        </TextField>

        <div className="grid gap-3 sm:grid-cols-2">
          <TextField isRequired isInvalid={!!errors?.expiryDate} className="w-full">
            <Label className="text-xs text-zinc-600 dark:text-zinc-400">Expiry Date</Label>
            <Input
              placeholder="MM/YY"
              value={value.expiryDate}
              maxLength={5}
              onChange={(e) => handleExpiryChange(e.target.value)}
              className="rounded-xl bg-white dark:bg-zinc-900"
            />
            {errors?.expiryDate && <p className="text-xs text-red-600 mt-1">{errors.expiryDate}</p>}
          </TextField>

          <TextField isRequired isInvalid={!!errors?.cvv} className="w-full">
            <Label className="text-xs text-zinc-600 dark:text-zinc-400">CVV</Label>
            <Input
              placeholder="***"
              value={value.cvv}
              maxLength={3}
              onChange={(e) => onChange({ cvv: e.target.value.replace(/\D/g, "").slice(0, 3) })}
              className="rounded-xl bg-white dark:bg-zinc-900"
            />
            {errors?.cvv ? (
              <p className="text-xs text-red-600 mt-1">{errors.cvv}</p>
            ) : (
              <p className="text-[11px] text-zinc-500 mt-1">3-digit code at the back of your card.</p>
            )}
          </TextField>
        </div>

        <TextField isRequired isInvalid={!!errors?.cardholderName} className="w-full">
          <Label className="text-xs text-zinc-600 dark:text-zinc-400">Cardholder Name</Label>
          <Input
            placeholder="Enter cardholder name"
            value={value.cardholderName}
            onChange={(e) => onChange({ cardholderName: e.target.value })}
            className="rounded-xl bg-white dark:bg-zinc-900"
          />
          {errors?.cardholderName && <p className="text-xs text-red-600 mt-1">{errors.cardholderName}</p>}
        </TextField>

        <label className="mt-2 flex items-center gap-2 cursor-pointer select-none">
          <Checkbox isSelected={value.isPaymentSaved} onChange={(v) => onChange({ isPaymentSaved: v })} className="size-5">
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox>
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Save this card for future use?</span>
        </label>
      </div>
    </div>
  );
}


