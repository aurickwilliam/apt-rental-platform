import type { TenancyBill } from "./tenancyBill";

// Rent billing periods, shared by web and mobile. Same rule as the server's
// rent reminders (`notify_rent_due_status()`): each period is a calendar
// month, due on the tenancy's `rent_due_day` (clamped to the month's last
// day), billing never starts before the lease, and a month whose due date
// falls before move-in is skipped.

// Rent falls due on this day when a tenancy has none (the database default).
export const DEFAULT_RENT_DUE_DAY = 5;

const padTwo = (value: number) => String(value).padStart(2, "0");
const monthKey = (year: number, monthIndex: number) => `${year}-${padTwo(monthIndex + 1)}`;

// The due date in a month, clamped to its last day (a 31st due day is
// Nov 30), matching the server's rent reminders.
function dueDateInMonth(year: number, monthIndex: number, dueDay: number): string {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return `${monthKey(year, monthIndex)}-${padTwo(Math.min(dueDay, lastDay))}`;
}

export interface PaymentPeriod {
  periodStart: string;
  periodEnd: string;
  dueDate: string;
}

// The whole calendar month, due on its (clamped) due day.
function monthPeriod(year: number, monthIndex: number, dueDay: number): PaymentPeriod {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const billingMonth = monthKey(year, monthIndex);
  return {
    periodStart: `${billingMonth}-01`,
    periodEnd: `${billingMonth}-${padTwo(lastDay)}`,
    dueDate: dueDateInMonth(year, monthIndex, dueDay),
  };
}

// The parts of a payment row the rent status needs (structural, so web and
// mobile payment records both fit).
export interface RentPeriodPayment {
  status: string | null;
  amount: number | null;
  period_start: string | null;
  billing_kind?: string | null;
  rent_amount?: number | null;
  advance_amount?: number | null;
  advance_period_start?: string | null;
}

// Sum of confirmed payments covering the given period start.
export function paidAmountForPeriod(payments: readonly RentPeriodPayment[], periodStart: string): number {
  return payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum
      + (payment.period_start === periodStart
        ? payment.billing_kind ? payment.rent_amount ?? 0 : payment.amount ?? 0
        : 0)
      + (payment.billing_kind && payment.advance_period_start === periodStart ? payment.advance_amount ?? 0 : 0), 0);
}

export interface PaymentPeriodLease {
  leaseStart?: string | null;
  rentDueDay?: number | null;
}

// The period being paid for: a calendar month, due on the tenancy's due day.
// Billing never starts before the lease, and a month whose due date falls
// before move-in is skipped (a lease starting Nov 8 with rent due on the 5th
// first bills December). The tenancy's current payment is reused when it
// covers that month.
export function resolvePaymentPeriod(
  currentPeriodStart: string | null,
  currentPeriodEnd: string | null,
  currentDueDate: string | null,
  lease: PaymentPeriodLease = {}
): PaymentPeriod {
  const dueDay = lease.rentDueDay ?? DEFAULT_RENT_DUE_DAY;
  const leaseStart = lease.leaseStart?.slice(0, 10) ?? null;
  const now = new Date();
  let year = now.getFullYear();
  let monthIndex = now.getMonth();

  if (leaseStart) {
    const [leaseYear, leaseMonth] = leaseStart.split("-").map(Number);
    if (leaseYear * 12 + leaseMonth - 1 > year * 12 + monthIndex) {
      year = leaseYear;
      monthIndex = leaseMonth - 1;
    }
    if (dueDateInMonth(year, monthIndex, dueDay) < leaseStart) {
      monthIndex += 1;
      if (monthIndex > 11) {
        monthIndex = 0;
        year += 1;
      }
    }
  }

  const period = monthPeriod(year, monthIndex, dueDay);

  if (currentPeriodStart?.startsWith(monthKey(year, monthIndex))) {
    return {
      periodStart: currentPeriodStart,
      periodEnd: currentPeriodEnd ?? currentPeriodStart,
      dueDate: currentDueDate ?? period.dueDate,
    };
  }

  return period;
}

// The month after the given period, due on the tenancy's due day.
export function nextPaymentPeriod(periodStart: string, rentDueDay?: number | null): PaymentPeriod {
  const [year, month] = periodStart.slice(0, 7).split("-").map(Number);
  // `month` is 1-based, so it is already the next month's 0-based index.
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonthIndex = month % 12;
  return monthPeriod(nextYear, nextMonthIndex, rentDueDay ?? DEFAULT_RENT_DUE_DAY);
}

// The parts of a tenancy the rent status needs (structural, so each app can
// pass its own tenancy type).
export interface RentStatusTenancy {
  bill?: TenancyBill | null;
  lease_start: string | null;
  rent_due_day: number | null;
  monthly_rent: number | null;
  apartment: { monthly_rent: number | null };
  currentPayment: {
    status: string | null;
    period_start: string | null;
    period_end: string | null;
    due_date: string | null;
  } | null;
}

export interface CurrentRentStatus extends PaymentPeriod {
  monthlyRent: number;
  // Paid payments for this period cover the full rent. The payment screens use
  // this as their double-payment guard.
  isFullyPaid: boolean;
  // What the tenant sees: also Paid when the tenancy's own current payment for
  // this period is marked paid, before the payment list has caught up.
  status: "Paid" | "Pending";
}

// Rent status for the period being billed now (rent is always billed whole).
export function getCurrentRentStatus(
  tenancy: RentStatusTenancy | null,
  payments: readonly RentPeriodPayment[]
): CurrentRentStatus {
  if (tenancy?.bill) {
    const bill = tenancy.bill;
    return {
      monthlyRent: bill.monthlyRent,
      periodStart: bill.periodStart,
      periodEnd: bill.periodEnd,
      dueDate: bill.dueDate,
      isFullyPaid: bill.rentPaid,
      status: bill.rentPaid ? "Paid" : "Pending",
    };
  }
  const monthlyRent = tenancy?.monthly_rent ?? tenancy?.apartment.monthly_rent ?? 0;
  const currentPayment = tenancy?.currentPayment ?? null;
  const period = resolvePaymentPeriod(
    currentPayment?.period_start ?? null,
    currentPayment?.period_end ?? null,
    currentPayment?.due_date ?? null,
    { leaseStart: tenancy?.lease_start, rentDueDay: tenancy?.rent_due_day }
  );

  const isFullyPaid =
    monthlyRent > 0 && paidAmountForPeriod(payments, period.periodStart) >= monthlyRent;
  const isCurrentPaymentPaid =
    currentPayment?.period_start === period.periodStart && currentPayment.status === "paid";

  return {
    monthlyRent,
    ...period,
    isFullyPaid,
    status: isFullyPaid || isCurrentPaymentPaid ? "Paid" : "Pending",
  };
}
