import { useState } from "react";
import type { PaymentMethod } from "@repo/utils";

// A checkout choice is local to this account/visit, never persisted as a default.
export function useCheckoutPaymentMethod(userId: string | null, defaultMethod: PaymentMethod | null) {
  const [owner, setOwner] = useState(userId);
  const [choice, setChoice] = useState<PaymentMethod | null>(null);
  if (owner !== userId) {
    setOwner(userId);
    setChoice(null);
  }
  return { method: choice ?? defaultMethod, selectMethod: setChoice };
}
