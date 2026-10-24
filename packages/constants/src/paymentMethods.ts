export type PaymentMethodKey = 'gcash' | 'maya' | 'qrph' | 'card' | 'cash';

export type PaymentMethodColors = { backgroundColor: string; textColor: string; borderColor: string };

// One hue per payment method, kept apart from the status chips' green / amber / red so
// a method is never mistaken for a status. Web and mobile draw the same chip from this.
export const PAYMENT_METHOD_COLORS: Record<PaymentMethodKey, { light: PaymentMethodColors; dark: PaymentMethodColors }> = {
  gcash: {
    light: { backgroundColor: '#DBEAFE', textColor: '#1D4ED8', borderColor: '#93C5FD' },
    dark: { backgroundColor: '#1E3A8A', textColor: '#BFDBFE', borderColor: '#3B82F6' },
  },
  maya: {
    light: { backgroundColor: '#CCFBF1', textColor: '#115E59', borderColor: '#5EEAD4' },
    dark: { backgroundColor: '#134E4A', textColor: '#99F6E4', borderColor: '#14B8A6' },
  },
  qrph: {
    light: { backgroundColor: '#EDE9FE', textColor: '#5B21B6', borderColor: '#C4B5FD' },
    dark: { backgroundColor: '#4C1D95', textColor: '#DDD6FE', borderColor: '#8B5CF6' },
  },
  card: {
    light: { backgroundColor: '#FAE8FF', textColor: '#86198F', borderColor: '#F0ABFC' },
    dark: { backgroundColor: '#701A75', textColor: '#F5D0FE', borderColor: '#D946EF' },
  },
  cash: {
    light: { backgroundColor: '#FFEDD5', textColor: '#9A3412', borderColor: '#FDBA74' },
    dark: { backgroundColor: '#7C2D12', textColor: '#FED7AA', borderColor: '#F97316' },
  },
};

/** Maps a stored method name ("gcash", "Debit/Credit-Card", ...) to its key; unknown methods have none. */
export function paymentMethodKey(method: string | null | undefined): PaymentMethodKey | null {
  const value = (method ?? '').trim().toLowerCase();
  if (value === 'gcash' || value === 'maya' || value === 'qrph' || value === 'cash') return value;
  if (value === 'card' || value === 'debit/credit-card') return 'card';
  return null;
}
