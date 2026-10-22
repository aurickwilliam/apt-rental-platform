export const PAYMENT_METHOD_TYPES = ["GCash", "Maya", "QRPh", "Debit/Credit-Card", "Cash"] as const;
export type PaymentMethod = (typeof PAYMENT_METHOD_TYPES)[number];

export interface PaymentMethodPreference {
  savedMethods: PaymentMethod[];
  defaultMethod: PaymentMethod | null;
}

export interface PaymentPreferenceRow {
  saved_methods: string[];
  default_method: string | null;
}

export const EMPTY_PAYMENT_METHOD_PREFERENCES: PaymentMethodPreference = { savedMethods: [], defaultMethod: null };

const DATABASE_METHODS: Record<PaymentMethod, string> = {
  GCash: "gcash", Maya: "maya", QRPh: "qrph", "Debit/Credit-Card": "card", Cash: "cash",
};

export function isPaymentMethod(value: string): value is PaymentMethod {
  return PAYMENT_METHOD_TYPES.some((method) => method === value);
}

export function paymentMethodLabel(method: PaymentMethod): string {
  return method === "Debit/Credit-Card" ? "Debit/Credit Card" : method;
}

export function normalizePaymentMethodPreferences(preferences: PaymentMethodPreference): PaymentMethodPreference {
  const savedMethods = [...new Set(preferences.savedMethods.filter(isPaymentMethod))];
  return {
    savedMethods,
    defaultMethod: preferences.defaultMethod && savedMethods.includes(preferences.defaultMethod)
      ? preferences.defaultMethod : null,
  };
}

export function paymentMethodPreferencesFromRow(row: PaymentPreferenceRow | null): PaymentMethodPreference {
  const fromDatabase = (value: string | null) => PAYMENT_METHOD_TYPES.find((method) => DATABASE_METHODS[method] === value) ?? null;
  return normalizePaymentMethodPreferences({
    savedMethods: (row?.saved_methods ?? []).flatMap((value) => {
      const method = fromDatabase(value);
      return method ? [method] : [];
    }),
    defaultMethod: fromDatabase(row?.default_method ?? null),
  });
}

export function paymentMethodPreferencesToRow(preferences: PaymentMethodPreference): PaymentPreferenceRow {
  const normalized = normalizePaymentMethodPreferences(preferences);
  return {
    saved_methods: normalized.savedMethods.map((method) => DATABASE_METHODS[method]),
    default_method: normalized.defaultMethod ? DATABASE_METHODS[normalized.defaultMethod] : null,
  };
}

export function togglePreferredPaymentMethod(preferences: PaymentMethodPreference, method: PaymentMethod): PaymentMethodPreference {
  const savedMethods = preferences.savedMethods.includes(method)
    ? preferences.savedMethods.filter((saved) => saved !== method)
    : [...preferences.savedMethods, method];
  return {
    savedMethods,
    defaultMethod: preferences.defaultMethod && savedMethods.includes(preferences.defaultMethod)
      ? preferences.defaultMethod : savedMethods[0] ?? null,
  };
}
