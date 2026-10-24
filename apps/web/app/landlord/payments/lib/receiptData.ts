import { formatPesoDisplay, paymentBreakdown } from "@repo/utils";
import type { PaymentStatus } from "@/app/tenant/payment/types";
import { formatDateFull, formatReferenceId, formatTimeShort, methodLabel, paymentStatusLabel } from "@/app/tenant/payment/utils";
import { ledgerPeriodLabel } from "@/lib/landlord-payments-view";
import type { LandlordPaymentRecord } from "@/service/landlordPaymentService";

export type ReceiptTone = "success" | "warning" | "danger";

export type ReceiptLine = { label: string; value: string };

// Everything the receipt says, as plain text. The on-screen receipt and the
// image that is copied or shared are both made from this, so they cannot drift.
export type ReceiptData = {
  status: PaymentStatus;
  tone: ReceiptTone;
  /** Worded for the landlord reading it, not the tenant who paid. */
  title: string;
  amount: string;
  period: string;
  tenant: string;
  apartment: string;
  /** "Paid on" for a paid payment, otherwise "Recorded on". */
  dateLabel: string;
  date: string;
  time: string;
  method: string;
  breakdown: ReceiptLine[];
  total: string;
  reference: string;
  filename: string;
};

const TITLES: Record<PaymentStatus, { title: string; tone: ReceiptTone }> = {
  Paid: { title: "Payment received", tone: "success" },
  Pending: { title: "Payment pending", tone: "warning" },
  Rejected: { title: "Payment declined", tone: "danger" },
  Failed: { title: "Payment failed", tone: "danger" },
  Unpaid: { title: "Unpaid", tone: "danger" },
};

export function receiptData(payment: LandlordPaymentRecord): ReceiptData {
  const status = paymentStatusLabel(payment.status);
  const reference = formatReferenceId(payment.reference_id);
  const period = payment.billing_kind === "move_in"
    ? "Move-in payment"
    : ledgerPeriodLabel(payment.due_date ?? payment.period_start ?? payment.date);
  const amount = formatPesoDisplay(payment.amount ?? 0);
  return {
    status,
    ...TITLES[status],
    amount,
    period,
    tenant: payment.tenant_name ?? "—",
    apartment: payment.apartment_name ?? "—",
    dateLabel: status === "Paid" ? "Paid on" : "Recorded on",
    date: formatDateFull(payment.date),
    time: formatTimeShort(payment.created_at),
    method: methodLabel(payment.method),
    breakdown: paymentBreakdown(payment).map((item) => ({ label: item.label, value: formatPesoDisplay(item.amount) })),
    total: amount,
    reference,
    filename: `receipt-${reference.replace(/[^A-Za-z0-9-]/g, "")}.png`,
  };
}
