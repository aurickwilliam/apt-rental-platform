import {
  ALL_YEARS,
  availableLedgerYears,
  countLedgerByTab,
  filterLedgerByYear,
  isAwaitingCashConfirmation,
  ledgerDateLabel,
  ledgerGroup,
  ledgerPeriodLabel,
  matchesLedgerTab,
  sortLedger,
  summarizeLedger,
  type LedgerRow,
} from './landlordPayments';

const row = (id: string, status: string | null, date: string, amount: number | null = 1000, method: string | null = 'gcash'): LedgerRow => ({
  id,
  status,
  date,
  amount,
  method,
});

const rows = [
  row('a', 'paid', '2026-09-24', 45000),
  row('b', 'paid', '2026-08-05', 45000, 'cash'),
  row('c', 'pending', '2026-10-02', 45000, 'cash'),
  row('d', 'pending', '2026-10-03', 5000, 'gcash'),
  row('e', 'rejected', '2025-12-01', 45000, 'cash'),
  row('f', 'failed', '2025-11-01', 45000),
];

describe('ledgerGroup', () => {
  it('groups paid and pending, and everything else as declined', () => {
    expect(ledgerGroup('paid')).toBe('paid');
    expect(ledgerGroup('PAID')).toBe('paid');
    expect(ledgerGroup('pending')).toBe('pending');
    for (const status of ['rejected', 'failed', 'unpaid', 'refunded', '', null, undefined]) {
      expect(ledgerGroup(status)).toBe('declined');
    }
  });
});

describe('years', () => {
  it('lists years newest first from the row dates', () => {
    expect(availableLedgerYears(rows)).toEqual(['2026', '2025']);
  });

  it('filters to one year or keeps everything', () => {
    expect(filterLedgerByYear(rows, '2025').map((r) => r.id)).toEqual(['e', 'f']);
    expect(filterLedgerByYear(rows, ALL_YEARS)).toHaveLength(rows.length);
  });
});

describe('tabs', () => {
  it('matches and counts by group', () => {
    expect(matchesLedgerTab(row('x', 'unpaid', '2026-01-01'), 'declined')).toBe(true);
    expect(matchesLedgerTab(row('x', 'paid', '2026-01-01'), 'declined')).toBe(false);
    expect(matchesLedgerTab(row('x', 'paid', '2026-01-01'), 'all')).toBe(true);
    expect(countLedgerByTab(rows)).toEqual({ all: 6, paid: 2, pending: 2, declined: 2 });
  });
});

describe('isAwaitingCashConfirmation', () => {
  it('is only a pending cash payment', () => {
    expect(isAwaitingCashConfirmation(rows[2])).toBe(true);
    expect(isAwaitingCashConfirmation(rows[3])).toBe(false);
    expect(isAwaitingCashConfirmation(rows[1])).toBe(false);
    expect(isAwaitingCashConfirmation(row('x', 'pending', '2026-01-01', 1, null))).toBe(false);
  });
});

describe('summarizeLedger', () => {
  it('totals paid money only and separates cash awaiting confirmation', () => {
    expect(summarizeLedger(rows)).toEqual({
      collected: 90000,
      paidCount: 2,
      awaitingCount: 1,
      awaitingAmount: 45000,
      declinedCount: 2,
      lastPaid: { date: '2026-09-24', amount: 45000 },
    });
  });

  it('is zeroed with no last payment for nothing, and treats null amounts as zero', () => {
    expect(summarizeLedger([])).toEqual({ collected: 0, paidCount: 0, awaitingCount: 0, awaitingAmount: 0, declinedCount: 0, lastPaid: null });
    expect(summarizeLedger([row('n', 'paid', '2026-01-01', null)]).collected).toBe(0);
  });

  it('counts a pending online payment in neither money nor the cash total', () => {
    const summary = summarizeLedger([row('d', 'pending', '2026-10-03', 5000, 'gcash')]);
    expect(summary).toMatchObject({ collected: 0, awaitingCount: 0, declinedCount: 0 });
  });
});

describe('sortLedger', () => {
  it('honors direction without mutating its input', () => {
    const input = [rows[1], rows[0]];
    expect(sortLedger(input, 'newest').map((r) => r.id)).toEqual(['a', 'b']);
    expect(sortLedger(input, 'oldest').map((r) => r.id)).toEqual(['b', 'a']);
    expect(input.map((r) => r.id)).toEqual(['b', 'a']);
  });
});

describe('ledgerPeriodLabel', () => {
  it('names the month and year, and tolerates bad input', () => {
    expect(ledgerPeriodLabel('2026-09-01')).toBe('September 2026');
    expect(ledgerPeriodLabel('2026-03-05T10:00:00+08:00')).toBe('March 2026');
    expect(ledgerPeriodLabel(null)).toBe('—');
    expect(ledgerPeriodLabel('nonsense')).toBe('—');
  });
});

describe('ledgerDateLabel', () => {
  it('formats a short date and tolerates bad input', () => {
    expect(ledgerDateLabel('2026-03-05')).toBe('Mar 5, 2026');
    expect(ledgerDateLabel('2026-03-05T10:00:00+08:00')).toBe('Mar 5, 2026');
    expect(ledgerDateLabel(undefined)).toBe('—');
    expect(ledgerDateLabel('nonsense')).toBe('—');
  });
});
