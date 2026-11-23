// What a tenant can do next from a receipt that is not a finished payment.
// A pending online payment is checked again on the verify page, the same place
// My Rental's View payment opens (checkout sessions expire, so there is no
// "continue"; the verify page settles the real outcome). A failed online attempt
// or a declined cash request goes back to checkout. Cash waiting for the landlord
// and finished payments have no next step.
export interface ReceiptNextAction {
  label: string;
  href: string;
}

export const PAYMENT_CHECKOUT_HREF = "/tenant/payment";

export function receiptNextAction(payment: {
  status: string | null;
  method: string | null;
  reference_id: string | null;
}): ReceiptNextAction | null {
  const status = (payment.status ?? "").toLowerCase();
  const isCash = (payment.method ?? "").toLowerCase() === "cash";
  if (status === "pending" && !isCash && payment.reference_id) {
    return {
      label: "Check payment status",
      href: `/tenant/payment/verify?sessionId=${encodeURIComponent(payment.reference_id)}`,
    };
  }
  if (status === "failed" || status === "rejected") return { label: "Try again", href: PAYMENT_CHECKOUT_HREF };
  return null;
}
