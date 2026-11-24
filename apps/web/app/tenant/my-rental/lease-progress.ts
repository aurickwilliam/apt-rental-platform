const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface LeaseProgress {
  /** Share of the lease already elapsed, 0-100; null for an open-ended lease. */
  percent: number | null;
  /** Short status for the chip, e.g. "11 months left". */
  remainingLabel: string;
  /** The lease end date has passed. */
  ended: boolean;
}

/** Today's calendar date in Manila as YYYY-MM-DD (lease dates are date-only). */
function manilaDate(today: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(today);
}

const toUtc = (isoDate: string) => Date.parse(`${isoDate.slice(0, 10)}T00:00:00Z`);
const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? "" : "s"} left`;

/** Whole calendar months from one date to a later one. */
function wholeMonthsBetween(fromIso: string, toIso: string): number {
  const [fromYear, fromMonth, fromDay] = fromIso.slice(0, 10).split("-").map(Number);
  const [toYear, toMonth, toDay] = toIso.slice(0, 10).split("-").map(Number);
  return (toYear - fromYear) * 12 + (toMonth - fromMonth) - (toDay < fromDay ? 1 : 0);
}

/** How far through the lease the tenant is, and how long is left. */
export function describeLeaseProgress(leaseStart: string, leaseEnd: string | null, today: Date): LeaseProgress {
  if (!leaseEnd) return { percent: null, remainingLabel: "Ongoing", ended: false };

  const todayIso = manilaDate(today);
  const start = toUtc(leaseStart);
  const end = toUtc(leaseEnd);
  const now = toUtc(todayIso);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return { percent: null, remainingLabel: "Ongoing", ended: false };
  }

  const percent = Math.round(Math.min(1, Math.max(0, (now - start) / (end - start))) * 100);
  const daysLeft = Math.round((end - now) / MS_PER_DAY);
  if (daysLeft <= 0) return { percent: 100, remainingLabel: "Lease ended", ended: true };

  const monthsLeft = wholeMonthsBetween(todayIso, leaseEnd);
  return {
    percent,
    remainingLabel: monthsLeft >= 1 ? plural(monthsLeft, "month") : plural(daysLeft, "day"),
    ended: false,
  };
}

/** "15th of the month" for the tenancy's rent due day. */
export function formatRentDueDay(day: number): string {
  const teens = day % 100 >= 11 && day % 100 <= 13;
  const suffix = teens ? "th" : day % 10 === 1 ? "st" : day % 10 === 2 ? "nd" : day % 10 === 3 ? "rd" : "th";
  return `${day}${suffix} of the month`;
}
