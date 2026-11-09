import {
  DATABASE_METHODS,
  PAYMENT_METHOD_TYPES,
  type PaymentMethod,
} from "./paymentMethods";

// A landlord chooses which methods tenants may use to pay. Only method names are stored
// (`landlord_payment_settings.accepted_methods`), never account numbers or credentials.
// No saved setting means every method is allowed.
export const ACCEPTED_METHODS_REQUIRED_MESSAGE = "Keep at least one payment method on.";

/** Database names (`gcash`, `bank_transfer`, ...) the landlord setting may hold. */
export const ACCEPTED_METHOD_VALUES: readonly string[] = PAYMENT_METHOD_TYPES.map((method) => DATABASE_METHODS[method]);

/** Reads a saved list; a missing row or a list with no known name means every method is allowed. */
export function normalizeAcceptedMethods(saved: readonly string[] | null | undefined): PaymentMethod[] {
  const accepted = PAYMENT_METHOD_TYPES.filter((method) => saved?.includes(DATABASE_METHODS[method]));
  return accepted.length > 0 ? accepted : [...PAYMENT_METHOD_TYPES];
}

export function acceptedMethodsToRow(methods: readonly PaymentMethod[]): string[] {
  return PAYMENT_METHOD_TYPES.filter((method) => methods.includes(method)).map((method) => DATABASE_METHODS[method]);
}

export function isMethodAccepted(accepted: readonly PaymentMethod[], method: PaymentMethod): boolean {
  return accepted.includes(method);
}

/** Error to show before saving, or null when the list is valid. */
export function validateAcceptedMethods(methods: readonly PaymentMethod[]): string | null {
  return methods.length === 0 ? ACCEPTED_METHODS_REQUIRED_MESSAGE : null;
}

export function toggleAcceptedMethod(accepted: readonly PaymentMethod[], method: PaymentMethod): PaymentMethod[] {
  return PAYMENT_METHOD_TYPES.filter((type) => (type === method ? !accepted.includes(type) : accepted.includes(type)));
}
