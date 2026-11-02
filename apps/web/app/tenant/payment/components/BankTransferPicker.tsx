"use client";

import { Radio, RadioGroup } from "@heroui/react";
import { getBankAvailability, getBankTransferBank, type BankCode } from "@repo/constants";

interface BankTransferPickerProps {
  amount: number;
  selectedBank: BankCode | null;
  onBankChange: (bank: BankCode) => void;
  error?: string;
}

// Banks over their per-payment limit stay visible but disabled, with the reason.
export default function BankTransferPicker({ amount, selectedBank, onBankChange, error }: BankTransferPickerProps) {
  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-3">
      <p className="text-sm font-nunito font-semibold text-foreground">Choose your bank</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        This is a test payment: you will land on a test bank page and no real money moves.
      </p>
      <RadioGroup
        aria-label="Bank"
        value={selectedBank ?? undefined}
        onChange={(value) => {
          if (getBankTransferBank(value)) onBankChange(value as BankCode);
        }}
        className="payment-method-radios mt-3 grid grid-cols-1 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card"
      >
        {getBankAvailability(amount).map(({ bank, available, reason }) => (
          <Radio key={bank.code} value={bank.code} isDisabled={!available} className="min-w-0">
            <Radio.Content className="flex min-h-14 w-full items-center gap-3 p-3 text-left transition-colors data-[selected=true]:bg-primary/10 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60">
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              <span className="min-w-0">
                <span className="block text-sm font-nunito font-semibold text-foreground">{bank.name}</span>
                {reason ? <span className="mt-0.5 block text-xs text-muted-foreground">{reason}</span> : null}
              </span>
            </Radio.Content>
          </Radio>
        ))}
      </RadioGroup>
      {error ? <p role="alert" className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
