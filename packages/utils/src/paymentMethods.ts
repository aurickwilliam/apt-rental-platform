// The payment methods APT offers for rent checkout. Which of them a tenant may use is the
// landlord's choice (acceptedPaymentMethods.ts); nothing here is saved per tenant.
export const PAYMENT_METHOD_TYPES = ["GCash", "Maya", "QRPh", "Bank Transfer", "Debit/Credit-Card", "Cash"] as const;
export type PaymentMethod = (typeof PAYMENT_METHOD_TYPES)[number];

/** The names stored in the database (`payment.method`, `landlord_payment_settings`). */
export const DATABASE_METHODS: Record<PaymentMethod, string> = {
  GCash: "gcash", Maya: "maya", QRPh: "qrph", "Bank Transfer": "bank_transfer", "Debit/Credit-Card": "card", Cash: "cash",
};

export function isPaymentMethod(value: string): value is PaymentMethod {
  return PAYMENT_METHOD_TYPES.some((method) => method === value);
}

export function paymentMethodLabel(method: PaymentMethod): string {
  return method === "Debit/Credit-Card" ? "Debit/Credit Card" : method;
}
