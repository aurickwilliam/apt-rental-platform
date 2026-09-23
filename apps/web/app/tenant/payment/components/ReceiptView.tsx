"use client";

import ReceiptCard from "./ReceiptCard";
import {
  formatDateFull,
  formatReferenceId,
  formatTimeShort,
  methodLabel,
  paymentStatusLabel,
  periodMonthLabel,
} from "../utils";
import type { PaymentRecord } from "@/service/paymentService";

// Shared receipt body for the success + per-row history routes
// (mobile parity: both render the same ReceiptCard).
export default function ReceiptView({ payment }: { payment: PaymentRecord }) {
  const dateLabel = formatDateFull(payment.date);
  const timeLabel = formatTimeShort(payment.created_at);
  const periodLabel = payment.period_start
    ? `${periodMonthLabel(payment.due_date ?? payment.period_start)}, ${payment.period_start.slice(0, 4)}`
    : undefined;
  const status = paymentStatusLabel(payment.status);
  const isCashPending =
    payment.status?.toLowerCase() === "pending" &&
    String(payment.method).toLowerCase() === "cash";

  return (
    <>
      <ReceiptCard
        apartmentName={payment.apartment_name ?? "—"}
        landlordName={payment.landlord_name ?? "—"}
        date={dateLabel}
        time={timeLabel}
        method={methodLabel(payment.method)}
        amount={payment.amount ?? 0}
        referenceNumber={formatReferenceId(payment.reference_id)}
        status={status}
        periodLabel={periodLabel}
        backgroundColor="#376BF5"
      />

      {isCashPending && (
        <p className="text-white/70 text-sm font-inter text-center max-w-md">
          Cash payment is pending — the landlord will confirm once received.
        </p>
      )}
    </>
  );
}
