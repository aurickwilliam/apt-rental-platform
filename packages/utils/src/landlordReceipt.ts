// What a landlord's receipt says about a payment, kept apart from how it is drawn so
// the web and the mobile app word it the same way. It reads the raw database status.

export type ReceiptTone = 'success' | 'warning' | 'danger';
export type ReceiptStatusLabel = 'Paid' | 'Pending' | 'Rejected' | 'Failed' | 'Unpaid';

export type LandlordReceiptStatus = {
  label: ReceiptStatusLabel;
  /** Worded for the landlord reading it, not the tenant who paid. */
  title: string;
  tone: ReceiptTone;
};

const STATUSES: Record<ReceiptStatusLabel, LandlordReceiptStatus> = {
  Paid: { label: 'Paid', title: 'Payment received', tone: 'success' },
  Pending: { label: 'Pending', title: 'Payment pending', tone: 'warning' },
  Rejected: { label: 'Rejected', title: 'Payment declined', tone: 'danger' },
  Failed: { label: 'Failed', title: 'Payment failed', tone: 'danger' },
  Unpaid: { label: 'Unpaid', title: 'Unpaid', tone: 'danger' },
};

/** Anything unrecognized reads as Unpaid, never as money received. */
export function landlordReceiptStatus(status: string | null | undefined): LandlordReceiptStatus {
  switch ((status ?? '').toLowerCase()) {
    case 'paid':
    case 'completed':
    case 'succeeded':
      return STATUSES.Paid;
    case 'pending':
      return STATUSES.Pending;
    case 'rejected':
    case 'declined':
      return STATUSES.Rejected;
    case 'failed':
      return STATUSES.Failed;
    default:
      return STATUSES.Unpaid;
  }
}

export type ReceiptShareFields = {
  title: string;
  amount: string;
  period: string;
  tenant: string;
  apartment: string;
  /** "Paid on" or "Recorded on". */
  dateLabel: string;
  date: string;
  method: string;
  reference: string;
};

/** The receipt as plain text, for the system share sheet. */
export function receiptShareText(fields: ReceiptShareFields): string {
  return [
    `${fields.title}: ${fields.amount}`,
    fields.period,
    '',
    `Tenant: ${fields.tenant}`,
    `Apartment: ${fields.apartment}`,
    `${fields.dateLabel}: ${fields.date}`,
    `Method: ${fields.method}`,
    `Reference No.: ${fields.reference}`,
  ].join('\n');
}

/** A receipt's date as the landlord reads it, e.g. "Thursday, March 5, 2026". */
export function formatReceiptDate(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-PH', { dateStyle: 'full' }).format(date);
}
