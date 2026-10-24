"use client";

import { InputOTP, REGEXP_ONLY_DIGITS } from "@heroui/react";

// Bordered, shadowless slots matching the site's text inputs (and the mobile
// code input). `!`: @heroui/styles' slot rules are unlayered CSS.
const CODE_SLOT_CLASS =
  "rounded-xl! border! border-input! bg-card! shadow-none! data-[active=true]:border-[#376BF5]! data-[active=true]:ring-2 data-[active=true]:ring-[#376BF5]/15 data-[invalid=true]:border-danger!";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length: number;
  isInvalid?: boolean;
  isDisabled?: boolean;
  autoFocus?: boolean;
  "aria-label"?: string;
}

// Email code input (one row of slots, centered), shared by the password-recovery
// and change-email code steps.
export default function CodeInput({
  value,
  onChange,
  onComplete,
  length,
  isInvalid,
  isDisabled,
  autoFocus,
  "aria-label": ariaLabel = "6-digit code",
}: CodeInputProps) {
  return (
    <InputOTP
      aria-label={ariaLabel}
      maxLength={length}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      isInvalid={isInvalid}
      isDisabled={isDisabled}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="one-time-code"
      autoFocus={autoFocus}
      className="justify-center"
    >
      <InputOTP.Group>
        {Array.from({ length }, (_, index) => (
          <InputOTP.Slot key={index} index={index} className={CODE_SLOT_CLASS} />
        ))}
      </InputOTP.Group>
    </InputOTP>
  );
}
