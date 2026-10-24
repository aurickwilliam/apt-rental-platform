const REFERENCE_PREFIX = 'APT-';
const REFERENCE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const PAYMENT_REFERENCE_SUFFIX_LENGTH = 8;

// Reference shown on receipts and sent to the payment provider: `APT-` followed by
// eight random capital letters and digits. Not a secret and not an identifier the
// database trusts, so `Math.random` is enough (React Native has no `crypto` by default).
export function generatePaymentReference(random: () => number = Math.random): string {
  let suffix = '';
  for (let index = 0; index < PAYMENT_REFERENCE_SUFFIX_LENGTH; index += 1) {
    suffix += REFERENCE_ALPHABET[Math.floor(random() * REFERENCE_ALPHABET.length)];
  }
  return `${REFERENCE_PREFIX}${suffix}`;
}

export function isPaymentReference(value: string | null | undefined): boolean {
  return new RegExp(`^APT-[A-Z0-9]{${PAYMENT_REFERENCE_SUFFIX_LENGTH}}$`).test(value ?? '');
}
