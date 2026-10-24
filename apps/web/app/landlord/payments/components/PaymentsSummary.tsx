"use client";

import { IconAlertCircle, IconCash, IconCircleCheck, IconClockHour4 } from "@tabler/icons-react";
import { formatPesoDisplay } from "@repo/utils";
import StatTile from "@/app/landlord/dashboard/components/StatTile";
import { formatDateShort } from "@/app/tenant/payment/utils";
import type { LedgerSummary } from "@/lib/landlord-payments-view";

interface PaymentsSummaryProps {
  summary: LedgerSummary;
  /** "All years" or the selected year, shown under the collected figure. */
  scopeLabel: string;
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export default function PaymentsSummary({ summary, scopeLabel }: PaymentsSummaryProps) {
  const { collected, paidCount, awaitingCount, awaitingAmount, declinedCount, lastPaid } = summary;

  return (
    <section aria-label="Payment summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        label="Collected"
        icon={IconCash}
        value={formatPesoDisplay(collected)}
        caption={`${scopeLabel} · ${plural(paidCount, "paid payment")}`}
      />
      <StatTile
        label="Cash to confirm"
        icon={IconClockHour4}
        value={formatPesoDisplay(awaitingAmount)}
        caption={awaitingCount === 0 ? "Nothing waiting for you" : `${plural(awaitingCount, "payment")} waiting`}
      />
      <StatTile
        label="Last payment"
        icon={IconCircleCheck}
        value={lastPaid ? formatPesoDisplay(lastPaid.amount) : "—"}
        caption={lastPaid ? `Paid ${formatDateShort(lastPaid.date)}` : "No paid payments yet"}
      />
      <StatTile
        label="Declined or failed"
        icon={IconAlertCircle}
        value={String(declinedCount)}
        isAlert={declinedCount > 0}
        caption={declinedCount === 0 ? "All clear" : "Rejected, failed or unpaid"}
      />
    </section>
  );
}
