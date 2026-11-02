// An online checkout (wallet, bank transfer or card) the tenant started but has not finished:
// leaving PayMongo's page without paying leaves its payment row `pending`. Cash is excluded,
// because the landlord confirms it. Used by web and mobile to tell the tenant about it.
export interface PendingOnlinePaymentCandidate {
  status: string;
  method: string | null;
  reference_id: string | null;
  period_start: string | null;
  created_at: string;
}

/** The newest unfinished online payment for this rent period, or null. */
export function findPendingOnlinePayment<T extends PendingOnlinePaymentCandidate>(
  payments: readonly T[],
  periodStart: string | null | undefined,
): T | null {
  const unfinished = payments.filter(
    (payment) =>
      payment.status === "pending"
      && payment.method !== "cash"
      && payment.reference_id !== null
      && (payment.period_start ?? null) === (periodStart ?? null),
  );
  if (unfinished.length === 0) return null;
  return unfinished.reduce((newest, payment) => (payment.created_at > newest.created_at ? payment : newest));
}
