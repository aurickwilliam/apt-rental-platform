import {
  getCurrentRentStatus,
  nextPaymentPeriod,
  nextUnpaidRentPeriod,
  type RentStatusTenancy,
  type TenancyBill,
} from "@repo/utils";

import type { CurrentTenancy, TenancyPayment } from "@/hooks/use-tenancy";

import type { PaymentStatus } from "./types";
import { normalizePaymentStatus } from "./utils";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface PendingFee {
  title: string;
  amount: number;
}

export interface RentalPeriod {
  periodStart: string;
  dueDate: string;
}

/** Everything the payment card shows, derived once. */
export interface RentalSummary {
  bill: TenancyBill | null;
  pendingPayment: TenancyBill["pendingPayment"];
  monthlyRent: number;
  /** The period being billed now is settled (nothing left to pay for it). */
  isPeriodPaid: boolean;
  billTitle: string;
  paymentStatus: PaymentStatus;
  periodStart: string;
  /** Due date of the period being billed (ISO date). */
  rentDueDate: string;
  nextPeriod: RentalPeriod;
  /** The next month still payable once prepaid months are skipped. */
  nextPayablePeriod: RentalPeriod;
  skippedNextPeriod: boolean;
  nextPeriodCoveredByAdvance: boolean;
  dueLabel: string;
  pendingFees: PendingFee[];
  pendingFeesTotal: number;
  /** What checkout will ask for now (the server bill's total when it has one). */
  totalDue: number;
  /** Rent plus pending fees for the next payable month. */
  nextPaymentTotal: number;
  /** Where Pay now / View payment goes: checkout or the pending receipt. */
  paymentHref: string;
}

interface BuildRentalSummaryInput {
  tenancy: CurrentTenancy;
  payments: TenancyPayment[];
  currentPayment: RentStatusTenancy["currentPayment"];
  pendingFees: PendingFee[];
  today: Date;
}

function pendingPaymentHref(pending: NonNullable<TenancyBill["pendingPayment"]>): string {
  const reference = encodeURIComponent(pending.referenceId ?? "");
  return pending.method === "cash"
    ? `/tenant/payment/success?referenceId=${reference}`
    : `/tenant/payment/verify?sessionId=${reference}`;
}

function describeDue(dueDate: Date, today: Date): string {
  const days = Math.ceil((dueDate.getTime() - today.getTime()) / MS_PER_DAY);
  if (days < 0) return `Overdue by ${Math.abs(days)} day${days === -1 ? "" : "s"}`;
  return `Due in ${days} day${days === 1 ? "" : "s"}`;
}

/**
 * The period being billed now follows the same rule as mobile and the server's
 * rent reminders; a server bill (new tenancies) overrides the derived totals so
 * the overview always matches checkout.
 */
export function buildRentalSummary({
  tenancy,
  payments,
  currentPayment,
  pendingFees,
  today,
}: BuildRentalSummaryInput): RentalSummary {
  const bill = tenancy.bill ?? null;
  const rent = getCurrentRentStatus({ ...tenancy, currentPayment }, payments);
  const { monthlyRent } = rent;
  const isPeriodPaid = bill ? bill.totalDue === 0 : rent.isFullyPaid;
  const billTitle = bill?.kind === "move_in" ? "Move-in payment"
    : bill?.coveredByAdvance ? "Covered by advance rent"
    : bill?.kind === "fees" && !isPeriodPaid ? "Maintenance fees" : "Monthly rent";

  const nextPeriod = nextPaymentPeriod(rent.periodStart, tenancy.rent_due_day);
  // Skip months already covered by confirmed rent (the move-in advance or a
  // paid future month), so the card never asks for rent that was prepaid.
  const nextPayablePeriod = nextUnpaidRentPeriod(rent.periodStart, tenancy.rent_due_day, monthlyRent, payments);
  const skippedNextPeriod = nextPayablePeriod.periodStart !== nextPeriod.periodStart;
  const nextPeriodCoveredByAdvance = skippedNextPeriod && payments.some(
    (payment) => payment.status === "paid"
      && payment.billing_kind === "move_in"
      && payment.advance_period_start === nextPeriod.periodStart
      && (payment.advance_amount ?? 0) > 0,
  );

  const periodPayment = payments.find((payment) => payment.period_start === rent.periodStart);
  const paymentStatus = normalizePaymentStatus(periodPayment?.status);

  // The next rent due: this period's, or the following one once it is paid.
  const dueDate = new Date(`${!bill && isPeriodPaid ? nextPeriod.dueDate : rent.dueDate}T00:00:00`);
  const pendingFeesTotal = pendingFees.reduce((sum, fee) => sum + fee.amount, 0);
  const pendingPayment = bill?.pendingPayment ?? null;

  return {
    bill,
    pendingPayment,
    monthlyRent,
    isPeriodPaid,
    billTitle,
    paymentStatus,
    periodStart: rent.periodStart,
    rentDueDate: rent.dueDate,
    nextPeriod,
    nextPayablePeriod,
    skippedNextPeriod,
    nextPeriodCoveredByAdvance,
    dueLabel: describeDue(dueDate, today),
    pendingFees,
    pendingFeesTotal,
    totalDue: bill?.totalDue ?? monthlyRent + pendingFeesTotal,
    nextPaymentTotal: monthlyRent + pendingFeesTotal,
    paymentHref: pendingPayment?.referenceId ? pendingPaymentHref(pendingPayment) : "/tenant/payment",
  };
}
