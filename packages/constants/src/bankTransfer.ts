// Banks offered for "Bank Transfer" (PayMongo direct online banking, test mode only: no
// real money moves and APT adds no fee). Limits are PayMongo's per-payment caps in PHP.
// Web, mobile and the `paymongo` edge function all read this list so they cannot drift.
export type BankCode = 'bpi' | 'ubp';

export interface BankTransferBank {
  code: BankCode;
  name: string;
  /** Highest amount, in pesos, one payment through this bank may be. */
  maxAmount: number;
}

export const BANK_TRANSFER_BANKS: readonly BankTransferBank[] = [
  { code: 'bpi', name: 'BPI', maxAmount: 50_000 },
  { code: 'ubp', name: 'UnionBank', maxAmount: 100_000 },
];

export interface BankAvailability {
  bank: BankTransferBank;
  available: boolean;
  /** Why the bank cannot be picked for this amount; null while it can. */
  reason: string | null;
}

const pesos = (amount: number) => `₱${amount.toLocaleString('en-PH')}`;

export function getBankTransferBank(code: string | null | undefined): BankTransferBank | null {
  return BANK_TRANSFER_BANKS.find((bank) => bank.code === code) ?? null;
}

/** The reason a bank cannot take this amount, or null when it can. */
export function getBankLimitError(bank: BankTransferBank, amount: number): string | null {
  return amount > bank.maxAmount
    ? `${bank.name} allows up to ${pesos(bank.maxAmount)} per payment.`
    : null;
}

/** Every bank with whether it can take the amount (disabled with a reason, never hidden). */
export function getBankAvailability(amount: number): BankAvailability[] {
  return BANK_TRANSFER_BANKS.map((bank) => {
    const reason = getBankLimitError(bank, amount);
    return { bank, available: reason === null, reason };
  });
}
