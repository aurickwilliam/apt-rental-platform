"use client";

import { Button, Link } from "@heroui/react";
import {
  IconCircleCheck as CircleCheck,
  IconClock as Clock,
  IconCreditCard as CreditCard,
  IconHistory as History,
} from "@tabler/icons-react";

import { formatPesoDisplay } from "@repo/utils";

import StatusChip from "@/app/components/display/StatusChip";

import type { LastPaidPayment, RentalSummary } from "../rental-summary";
import { formatMonthYear, formatShortDate } from "../utils";

const HISTORY_HREF = "/tenant/payment/history";
const CHIP_CLASS = "font-nunito font-semibold";
const CARD_CLASS =
  "flex h-full min-w-0 flex-col rounded-3xl border border-white/10 bg-primary p-5 text-white";

const FEE_ROW_LIMIT = 3;

interface BreakdownRow {
  label: string;
  value: string;
}

/** Every charge behind the amount above, each listed once, then the total. */
function buildBreakdownRows(summary: RentalSummary): BreakdownRow[] {
  const { bill } = summary;
  const rows: BreakdownRow[] = [];
  const rentDue = bill ? bill.rentDue : summary.monthlyRent;
  if (rentDue > 0 && !bill?.coveredByAdvance) {
    rows.push({ label: `${formatMonthYear(bill?.periodStart ?? summary.periodStart)} rent`, value: formatPesoDisplay(rentDue) });
  }
  if (bill?.kind === "move_in") {
    if (bill.securityDeposit > 0) rows.push({ label: "Security deposit", value: formatPesoDisplay(bill.securityDeposit) });
    if (bill.advanceRent > 0) {
      rows.push({
        label: bill.advancePeriodStart ? `${formatMonthYear(bill.advancePeriodStart)} advance rent` : "Advance rent",
        value: formatPesoDisplay(bill.advanceRent),
      });
    }
  }
  const listedFees = summary.pendingFees.slice(0, FEE_ROW_LIMIT);
  for (const fee of listedFees) {
    rows.push({ label: `Maintenance fee — ${fee.title}`, value: formatPesoDisplay(fee.amount) });
  }
  const otherFees = summary.pendingFees.slice(FEE_ROW_LIMIT);
  if (otherFees.length > 0) {
    rows.push({
      label: `+${otherFees.length} more maintenance fee${otherFees.length === 1 ? "" : "s"}`,
      value: formatPesoDisplay(otherFees.reduce((sum, fee) => sum + fee.amount, 0)),
    });
  }
  if (summary.pendingFees.length === 0) rows.push({ label: "Maintenance fees", value: "None" });
  return rows;
}

function describeLastPayment(payment: LastPaidPayment | null): string {
  if (!payment) return "None yet";
  const paidOn = `Paid ${formatShortDate(payment.date)}`;
  return payment.periodStart ? `${formatMonthYear(payment.periodStart)} · ${paidOn}` : paidOn;
}

function PaymentFact({ label, value }: BreakdownRow) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 font-inter text-xs">
      <dt className="text-white/75">{label}</dt>
      <dd className="text-white/90">{value}</dd>
    </div>
  );
}

/**
 * Mobile's brand-blue payment card: title with a status chip, the amount, its
 * month and due date, then Pay now beside a round History button. Because it
 * stretches to the photo's height on wide screens, it also lists the charges
 * behind the amount, the last confirmed payment and the month that follows.
 * Once the period is settled it names the paid month and the next payable one.
 */
export default function PaymentSummaryCard({ summary }: { summary: RentalSummary }) {
  const { bill, pendingPayment } = summary;
  const paymentPeriod = formatMonthYear(summary.periodStart);

  if (summary.isPeriodPaid) {
    const { nextPayablePeriod, nextPeriod } = summary;
    return (
      <section aria-label="Payment summary" className={CARD_CLASS}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-nunito text-lg font-bold">{summary.billTitle}</p>
          <StatusChip size="md" className={CHIP_CLASS} tone="success">
            <span className="flex items-center gap-1.5"><CircleCheck size={18} aria-hidden="true" />Paid</span>
          </StatusChip>
        </div>
        <p className="mt-2 font-nunito text-3xl font-bold">{paymentPeriod}</p>
        <p className="mt-1 font-inter text-sm text-white/90">
          {bill?.coveredByAdvance ? "This month’s rent was prepaid in your move-in payment." : "Payment received for this month."}
        </p>
        <div className="mt-4 rounded-2xl bg-white/10 px-4 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="font-nunito text-xs font-semibold text-white/75">Next Payment</p>
            <p className="font-inter text-xs text-white/85">{formatMonthYear(nextPayablePeriod.periodStart)}</p>
          </div>
          <p className="mt-0.5 font-nunito text-xl font-bold">{formatPesoDisplay(summary.nextPaymentTotal)}</p>
          <p className="font-inter text-sm text-white/90">Due {formatShortDate(nextPayablePeriod.dueDate)}</p>
          {summary.skippedNextPeriod && (
            <p className="mt-1 font-inter text-xs text-white/80">
              {summary.nextPeriodCoveredByAdvance
                ? `${formatMonthYear(nextPeriod.periodStart)} is covered by your advance rent.`
                : `${formatMonthYear(nextPeriod.periodStart)} is already paid.`}
            </p>
          )}
          {summary.pendingFeesTotal > 0 && (
            <p className="mt-1 font-inter text-xs text-white/80">
              Includes {formatPesoDisplay(summary.pendingFeesTotal)} in maintenance fees
            </p>
          )}
        </div>
        <dl className="mt-3">
          <PaymentFact label="Last payment" value={describeLastPayment(summary.lastPaidPayment)} />
        </dl>
        <div className="mt-auto pt-5">
          <Link href={HISTORY_HREF} className="block w-full no-underline">
            <Button className="h-11 w-full cursor-pointer rounded-full bg-white/15 font-nunito font-semibold text-white">
              <History size={20} aria-hidden="true" />
              Payment history
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  const isLate = !bill && summary.paymentStatus === "late";
  const breakdownRows = buildBreakdownRows(summary);
  const { nextPayablePeriod } = summary;
  return (
    <section aria-label="Payment summary" className={CARD_CLASS}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-nunito text-lg font-bold">{summary.billTitle}</p>
        {!bill && summary.paymentStatus === "paid" ? (
          <StatusChip size="md" className={CHIP_CLASS} tone="success">
            <span className="flex items-center gap-1.5"><CircleCheck size={18} aria-hidden="true" />Paid</span>
          </StatusChip>
        ) : (
          <StatusChip size="md" className={CHIP_CLASS} tone={isLate ? "danger" : "warning"}>
            <span className="flex items-center gap-1.5"><Clock size={18} aria-hidden="true" />{pendingPayment ? "Awaiting confirmation" : summary.dueLabel}</span>
          </StatusChip>
        )}
      </div>
      <p className="mt-2 break-words font-nunito text-4xl font-bold">
        {formatPesoDisplay(summary.totalDue)}
      </p>
      <p className="mt-1 font-inter text-sm font-semibold text-white">
        {bill ? `Due ${formatShortDate(summary.rentDueDate)}` : `${paymentPeriod} · Due ${formatShortDate(summary.rentDueDate)}`}
      </p>
      {pendingPayment && (
        <p className="mt-1 font-inter text-sm text-white/85">
          A payment is waiting for confirmation. Open it to check its status.
        </p>
      )}
      {bill?.coveredByAdvance && (
        <p className="mt-2 font-inter text-sm text-white/90">
          Rent due: {formatPesoDisplay(bill.rentDue)}. Only the separate maintenance fees below remain payable.
        </p>
      )}
      <dl className="mt-3 space-y-1.5 rounded-2xl bg-white/10 p-3 font-inter text-sm">
        {breakdownRows.map((row, index) => (
          <div key={`${index}:${row.label}`} className="flex justify-between gap-3">
            <dt className="min-w-0 break-words">{row.label}</dt>
            <dd className="shrink-0 font-nunito font-semibold">{row.value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-3 border-t border-white/20 pt-1.5">
          <dt className="font-nunito font-semibold">Total due</dt>
          <dd className="shrink-0 font-nunito font-bold">{formatPesoDisplay(summary.totalDue)}</dd>
        </div>
      </dl>
      <dl className="mt-3 space-y-1">
        <PaymentFact label="Last payment" value={describeLastPayment(summary.lastPaidPayment)} />
        <PaymentFact
          label="Next after this"
          value={`${formatMonthYear(nextPayablePeriod.periodStart)} · Due ${formatShortDate(nextPayablePeriod.dueDate)}`}
        />
      </dl>
      <div className="mt-auto flex items-center gap-3 pt-5">
        <Link href={summary.paymentHref} className="flex-1 no-underline">
          <Button className="h-11 w-full cursor-pointer rounded-full bg-white font-nunito text-base font-bold text-primary">
            <CreditCard size={18} aria-hidden="true" />
            {pendingPayment ? "View payment" : "Pay now"}
          </Button>
        </Link>
        <Link
          href={HISTORY_HREF}
          aria-label="View payment history"
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white no-underline transition-colors hover:bg-white/25"
        >
          <History size={22} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
