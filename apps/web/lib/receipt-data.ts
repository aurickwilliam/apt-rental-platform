import { formatPesoDisplay, paymentBreakdown } from "@repo/utils";
import type { PaymentStatus } from "@/app/tenant/payment/types";
import { formatDateFull, formatReferenceId, formatTimeShort, methodLabel, paymentStatusLabel } from "@/app/tenant/payment/utils";
import { ledgerPeriodLabel } from "@/lib/landlord-payments-view";
import type { PaymentRecord } from "@/service/paymentService";

export type ReceiptTone = "success" | "warning" | "danger";

export type ReceiptLine = { label: string; value: string };

/** Who is reading the receipt: it names the other party and words the title for them. */
export type ReceiptViewer = "landlord" | "tenant";

// Everything the receipt says, as plain text. The on-screen receipt and the
// image that is saved, copied or shared are both made from this, so they cannot drift.
export type ReceiptData = {
  status: PaymentStatus;
  tone: ReceiptTone;
  /** Worded for the viewer: a landlord reads "received", a tenant reads "successful". */
  title: string;
  amount: string;
  period: string;
  /** The other side of the payment: the tenant for a landlord, the landlord for a tenant. */
  partyLabel: "Tenant" | "Landlord";
  party: string;
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

const TITLES: Record<ReceiptViewer, Record<PaymentStatus, { title: string; tone: ReceiptTone }>> = {
  landlord: {
    Paid: { title: "Payment received", tone: "success" },
    Pending: { title: "Payment pending", tone: "warning" },
    Rejected: { title: "Payment declined", tone: "danger" },
    Failed: { title: "Payment failed", tone: "danger" },
    Unpaid: { title: "Unpaid", tone: "danger" },
  },
  // The same words as the tenant's on-screen receipt.
  tenant: {
    Paid: { title: "Payment Successful", tone: "success" },
    Pending: { title: "Payment Pending", tone: "warning" },
    Rejected: { title: "Cash Payment Rejected", tone: "danger" },
    Failed: { title: "Payment Failed", tone: "danger" },
    Unpaid: { title: "Unpaid", tone: "danger" },
  },
};

export function receiptData(payment: PaymentRecord, viewer: ReceiptViewer = "landlord"): ReceiptData {
  const status = paymentStatusLabel(payment.status);
  const reference = formatReferenceId(payment.reference_id);
  const period = payment.billing_kind === "lease_renewal" ? "Lease Renewal" : payment.billing_kind === "move_in"
    ? "Move-in payment"
    : ledgerPeriodLabel(payment.due_date ?? payment.period_start ?? payment.date);
  const amount = formatPesoDisplay(payment.amount ?? 0);
  return {
    status,
    ...TITLES[viewer][status],
    amount,
    period,
    partyLabel: viewer === "landlord" ? "Tenant" : "Landlord",
    party: (viewer === "landlord" ? payment.tenant_name : payment.landlord_name) ?? "—",
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
