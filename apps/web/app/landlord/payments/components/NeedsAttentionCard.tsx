"use client";

import Link from "next/link";
import { IconCash, IconChevronRight, IconCircleCheck } from "@tabler/icons-react";
import { formatPesoDisplay } from "@repo/utils";
import { ledgerPeriodLabel } from "@/lib/landlord-payments-view";
import type { LandlordPaymentRecord } from "@/service/landlordPaymentService";

interface NeedsAttentionCardProps {
  /** Pending cash payments only. Each row opens the receipt, where the landlord confirms or rejects. */
  payments: LandlordPaymentRecord[];
  /** Names the unit on each row; on when the page lists several units at once. */
  showUnit: boolean;
}

// Confirming or rejecting cash stays on the payment's own page, where the full
// receipt is visible, so there is a single place that changes payment status.
export default function NeedsAttentionCard({ payments, showUnit }: NeedsAttentionCardProps) {
  if (payments.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-card p-5">
        <h2 className="mb-3 font-nunito text-xl font-bold text-primary">Needs attention</h2>
        <p className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <IconCircleCheck size={20} className="shrink-0 text-primary" aria-hidden="true" />
          You&apos;re all caught up. No cash payments are waiting for you.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-primary p-5 text-white">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-nunito text-xl font-bold">Needs attention</h2>
        <span
          className="flex min-w-7 items-center justify-center rounded-full bg-white px-2 py-0.5 text-sm font-bold text-primary"
          aria-label={`${payments.length} cash ${payments.length === 1 ? "payment" : "payments"} to confirm`}
        >
          {payments.length}
        </span>
      </div>
      <p className="mb-3 text-sm text-white/85">Confirm these cash payments once you have received the money.</p>
      <ul className="space-y-2">
        {payments.map((payment) => (
          <li key={payment.id}>
            <Link
              href={`/landlord/payments/${payment.id}?apartmentId=${payment.apartment_id}`}
              className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white/15 p-3 no-underline transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <IconCash size={20} className="shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {formatPesoDisplay(payment.amount ?? 0)}
                  {payment.tenant_name ? ` · ${payment.tenant_name}` : ""}
                </span>
                <span className="block truncate text-xs text-white/80">
                  {showUnit && payment.apartment_name ? `${payment.apartment_name} · ` : ""}
                  {payment.billing_kind === "move_in"
                    ? "Move-in payment"
                    : ledgerPeriodLabel(payment.due_date ?? payment.period_start ?? payment.date)}
                </span>
              </span>
              <IconChevronRight size={16} className="shrink-0" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
