/** Server-calculated bill. A move-in payment is one receipt with separate allocations. */
export interface TenancyBill {
  kind: "move_in" | "monthly" | "fees";
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  monthlyRent: number;
  rentDue: number;
  securityDeposit: number;
  advanceRent: number;
  advancePeriodStart: string | null;
  advancePeriodEnd: string | null;
  fees: { id: string; title: string; amount: number }[];
  totalDue: number;
  rentPaid: boolean;
  coveredByAdvance: boolean;
  pendingPayment: { id: string; referenceId: string | null; method: string } | null;
}

/** Optional fields preserve the historical payment contract on both platforms. */
export interface PaymentAllocation {
  billing_kind?: "move_in" | "monthly" | "fees" | null;
  rent_amount?: number | null;
  deposit_amount?: number | null;
  advance_amount?: number | null;
  maintenance_amount?: number | null;
  advance_period_start?: string | null;
  advance_period_end?: string | null;
}

export function paymentBreakdown(payment: PaymentAllocation): { label: string; amount: number }[] {
  if (!payment.billing_kind) return [];
  const rows = [
    { label: payment.billing_kind === "move_in" ? "First month’s rent" : "Rent", amount: payment.rent_amount ?? 0 },
    { label: "Security deposit (held separately)", amount: payment.deposit_amount ?? 0 },
    { label: `Advance rent — month 2${payment.advance_period_start ? ` (${payment.advance_period_start} – ${payment.advance_period_end})` : ""}`, amount: payment.advance_amount ?? 0 },
    { label: "Maintenance fees", amount: payment.maintenance_amount ?? 0 },
  ];
  return rows.filter((row) => row.amount > 0);
}
