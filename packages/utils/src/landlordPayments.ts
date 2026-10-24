// Pure view logic for a landlord's payment list: grouping by status, filtering by
// year, sorting, and the summary figures. It works on raw database statuses so the
// web and the mobile app read a list the same way. Money is only ever summed from
// paid rows; a cash payment waiting for the landlord is counted separately.

export type LedgerRow = {
  id: string;
  /** Raw database status: paid, pending, rejected, failed, unpaid. */
  status: string | null;
  method: string | null;
  amount: number | null;
  /** ISO date the payment was recorded or paid. */
  date: string;
};

export type LedgerGroup = 'paid' | 'pending' | 'declined';
export type LedgerTab = 'all' | LedgerGroup;
export type LedgerSort = 'newest' | 'oldest';

/** Pseudo ids for "every year" and "every apartment" in a picker. */
export const ALL_YEARS = 'all';
export const ALL_APARTMENTS = 'all';

/** Anything that is neither paid nor waiting (rejected, failed, unpaid or unknown) is declined. */
export function ledgerGroup(status: string | null | undefined): LedgerGroup {
  const value = (status ?? '').toLowerCase();
  if (value === 'paid') return 'paid';
  if (value === 'pending') return 'pending';
  return 'declined';
}

export function ledgerYear(iso: string): string {
  return iso.slice(0, 4);
}

// Years come from the same date the list shows and sorts by, so a year filter can
// never hide a row under a different year than its date.
export function availableLedgerYears(rows: readonly LedgerRow[]): string[] {
  return [...new Set(rows.map((row) => ledgerYear(row.date)))].sort((a, b) => Number(b) - Number(a));
}

export function filterLedgerByYear<T extends LedgerRow>(rows: readonly T[], year: string): T[] {
  return year === ALL_YEARS ? [...rows] : rows.filter((row) => ledgerYear(row.date) === year);
}

export function matchesLedgerTab(row: LedgerRow, tab: LedgerTab): boolean {
  return tab === 'all' || ledgerGroup(row.status) === tab;
}

export function countLedgerByTab(rows: readonly LedgerRow[]): Record<LedgerTab, number> {
  const counts: Record<LedgerTab, number> = { all: rows.length, paid: 0, pending: 0, declined: 0 };
  for (const row of rows) counts[ledgerGroup(row.status)] += 1;
  return counts;
}

export function sortLedger<T extends LedgerRow>(rows: readonly T[], sort: LedgerSort): T[] {
  const direction = sort === 'newest' ? -1 : 1;
  return [...rows].sort((a, b) => direction * (new Date(a.date).getTime() - new Date(b.date).getTime()));
}

// A cash payment stays pending until the landlord confirms the money arrived; online
// methods are confirmed by the payment provider, never by the landlord.
export function isAwaitingCashConfirmation(row: LedgerRow): boolean {
  return (row.status ?? '').toLowerCase() === 'pending' && (row.method ?? '').toLowerCase() === 'cash';
}

export type LedgerSummary = {
  collected: number;
  paidCount: number;
  awaitingCount: number;
  awaitingAmount: number;
  declinedCount: number;
  lastPaid: { date: string; amount: number } | null;
};

export function summarizeLedger(rows: readonly LedgerRow[]): LedgerSummary {
  const summary: LedgerSummary = {
    collected: 0,
    paidCount: 0,
    awaitingCount: 0,
    awaitingAmount: 0,
    declinedCount: 0,
    lastPaid: null,
  };
  for (const row of rows) {
    const amount = row.amount ?? 0;
    const group = ledgerGroup(row.status);
    if (group === 'paid') {
      summary.collected += amount;
      summary.paidCount += 1;
      const isNewer = !summary.lastPaid || new Date(row.date).getTime() > new Date(summary.lastPaid.date).getTime();
      if (isNewer) summary.lastPaid = { date: row.date, amount };
    } else if (isAwaitingCashConfirmation(row)) {
      summary.awaitingCount += 1;
      summary.awaitingAmount += amount;
    } else if (group === 'declined') {
      summary.declinedCount += 1;
    }
  }
  return summary;
}

// "September 2026": the year keeps rows from different years apart when every year is listed.
export function ledgerPeriodLabel(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

// "Mar 5, 2026".
export function ledgerDateLabel(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
