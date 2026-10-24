// Pure view helpers for the landlord Payments page. Rows arrive with their status
// already mapped to a display label (`paymentStatusLabel`), so this file stays
// dependency-free and runs under `node --test`.

export type LedgerStatus = "Paid" | "Pending" | "Rejected" | "Failed" | "Unpaid";

export type LedgerRow = {
  id: string;
  status: LedgerStatus;
  method: string | null;
  amount: number | null;
  /** ISO date the payment was recorded or paid. */
  date: string;
};

export type LedgerTab = "all" | "paid" | "pending" | "declined";

export type LedgerSort = "newest" | "oldest";

export const ALL_YEARS = "all";

/** Pseudo unit id for the unit picker: every unit the landlord owns. */
export const ALL_APARTMENTS = "all";

export function ledgerYear(iso: string): string {
  return iso.slice(0, 4);
}

// Years are taken from the same date the table shows and sorts by, so a year
// filter can never hide a row under a different year than its date column.
export function availableLedgerYears(rows: readonly LedgerRow[]): string[] {
  return [...new Set(rows.map((row) => ledgerYear(row.date)))].sort((a, b) => Number(b) - Number(a));
}

export function filterByYear<T extends LedgerRow>(rows: readonly T[], year: string): T[] {
  return year === ALL_YEARS ? [...rows] : rows.filter((row) => ledgerYear(row.date) === year);
}

export function matchesTab(row: LedgerRow, tab: LedgerTab): boolean {
  if (tab === "all") return true;
  if (tab === "paid") return row.status === "Paid";
  if (tab === "pending") return row.status === "Pending";
  return row.status === "Rejected" || row.status === "Failed" || row.status === "Unpaid";
}

export function countByTab(rows: readonly LedgerRow[]): Record<LedgerTab, number> {
  const counts: Record<LedgerTab, number> = { all: rows.length, paid: 0, pending: 0, declined: 0 };
  for (const row of rows) {
    if (matchesTab(row, "paid")) counts.paid += 1;
    else if (matchesTab(row, "pending")) counts.pending += 1;
    else counts.declined += 1;
  }
  return counts;
}

export function sortLedger<T extends LedgerRow>(rows: readonly T[], sort: LedgerSort): T[] {
  const direction = sort === "newest" ? -1 : 1;
  return [...rows].sort((a, b) => direction * (new Date(a.date).getTime() - new Date(b.date).getTime()));
}

// A cash payment stays Pending until the landlord confirms the money arrived;
// online methods are confirmed by the payment provider, never by the landlord.
export function isAwaitingCashConfirmation(row: LedgerRow): boolean {
  return row.status === "Pending" && row.method === "cash";
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
    if (row.status === "Paid") {
      summary.collected += amount;
      summary.paidCount += 1;
      const isNewer = !summary.lastPaid || new Date(row.date).getTime() > new Date(summary.lastPaid.date).getTime();
      if (isNewer) summary.lastPaid = { date: row.date, amount };
    } else if (isAwaitingCashConfirmation(row)) {
      summary.awaitingCount += 1;
      summary.awaitingAmount += amount;
    } else if (matchesTab(row, "declined")) {
      summary.declinedCount += 1;
    }
  }
  return summary;
}

// "September 2026", so rows from different years stay distinguishable when the
// page is showing every year at once.
export function ledgerPeriodLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 7);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}
