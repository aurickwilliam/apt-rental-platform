"use client";

import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { receiptNextAction } from "@/lib/receipt-next-action";
import type { ReceiptViewer } from "@/lib/receipt-data";
import ReceiptActions from "./ReceiptActions";
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
import { paymentBreakdown } from "@repo/utils";

// Shared receipt body for the success + per-row history routes
// (mobile parity: both render the same ReceiptCard).
export default function ReceiptView({
  payment,
  transparent = false,
  viewer = "tenant",
}: {
  payment: PaymentRecord;
  transparent?: boolean;
  /** The landlord's receipt page words the picture for them and has no tenant next step. */
  viewer?: ReceiptViewer;
}) {
  const dateLabel = formatDateFull(payment.date);
  const timeLabel = formatTimeShort(payment.created_at);
  const periodLabel = payment.period_start
    ? `${periodMonthLabel(payment.due_date ?? payment.period_start)}, ${payment.period_start.slice(0, 4)}`
    : undefined;
  const status = paymentStatusLabel(payment.status);
  const isCashPending =
    payment.status?.toLowerCase() === "pending" &&
    String(payment.method).toLowerCase() === "cash";

  const nextAction = viewer === "tenant" ? receiptNextAction(payment) : null;

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
        breakdown={paymentBreakdown(payment)}
        paymentLabel={payment.billing_kind === "lease_renewal" ? "Lease Renewal" : payment.billing_kind === "move_in" ? "Move-in payment" : undefined}
        periodLabel={periodLabel}
        backgroundColor={transparent ? "transparent" : "#376BF5"}
        actions={<ReceiptActions payment={payment} viewer={viewer} />}
      />

      {nextAction && (
        <Link
          href={nextAction.href}
          className={`${buttonVariants({ variant: "secondary" })} cursor-pointer rounded-full bg-white font-nunito text-primary no-underline`}
        >
          {nextAction.label}
        </Link>
      )}

      {isCashPending && (
        <p className="text-white/70 text-sm font-inter text-center max-w-md">
          Cash payment is pending — the landlord will confirm once received.
        </p>
      )}
    </>
  );
}
