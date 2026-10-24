import { landlordReceiptStatus, receiptShareText } from './landlordReceipt';

describe('landlordReceiptStatus', () => {
  it.each([
    ['paid', 'Paid', 'Payment received', 'success'],
    ['PAID', 'Paid', 'Payment received', 'success'],
    ['pending', 'Pending', 'Payment pending', 'warning'],
    ['rejected', 'Rejected', 'Payment declined', 'danger'],
    ['failed', 'Failed', 'Payment failed', 'danger'],
    ['unpaid', 'Unpaid', 'Unpaid', 'danger'],
  ] as const)('words %s for the landlord', (status, label, title, tone) => {
    expect(landlordReceiptStatus(status)).toEqual({ label, title, tone });
  });

  it('never reads an unknown or missing status as money received', () => {
    for (const status of ['refunded', '', null, undefined]) {
      expect(landlordReceiptStatus(status).tone).toBe('danger');
      expect(landlordReceiptStatus(status).label).toBe('Unpaid');
    }
  });
});

describe('receiptShareText', () => {
  it('lists the receipt line by line', () => {
    expect(
      receiptShareText({
        title: 'Payment received',
        amount: '₱65,000',
        period: 'March 2026',
        tenant: 'MAHARTT Navales',
        apartment: 'San Jose Corner Suite 2BR',
        dateLabel: 'Paid on',
        date: 'Thursday, March 5, 2026, 10:00 AM',
        method: 'Cash',
        reference: 'APT-L44ZOUGS',
      }),
    ).toBe(
      [
        'Payment received: ₱65,000',
        'March 2026',
        '',
        'Tenant: MAHARTT Navales',
        'Apartment: San Jose Corner Suite 2BR',
        'Paid on: Thursday, March 5, 2026, 10:00 AM',
        'Method: Cash',
        'Reference No.: APT-L44ZOUGS',
      ].join('\n'),
    );
  });
});
