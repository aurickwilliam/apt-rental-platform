import { generatePaymentReference, isPaymentReference } from './paymentReference';

describe('generatePaymentReference', () => {
  it('is APT- followed by eight capital letters or digits', () => {
    for (let run = 0; run < 200; run += 1) {
      expect(generatePaymentReference()).toMatch(/^APT-[A-Z0-9]{8}$/);
    }
  });

  it('uses the whole alphabet and stays in range at the extremes', () => {
    expect(generatePaymentReference(() => 0)).toBe('APT-AAAAAAAA');
    expect(generatePaymentReference(() => 0.999999)).toBe('APT-99999999');
  });

  it('does not repeat across a large batch', () => {
    const seen = new Set(Array.from({ length: 5000 }, () => generatePaymentReference()));
    expect(seen.size).toBe(5000);
  });
});

describe('isPaymentReference', () => {
  it('accepts the current format only', () => {
    expect(isPaymentReference('APT-8K2M9QX4')).toBe(true);
    expect(isPaymentReference('pay_muf5x339')).toBe(false);
    expect(isPaymentReference('DEMO-01fe7e59-baf9')).toBe(false);
    expect(isPaymentReference('APT-short')).toBe(false);
    expect(isPaymentReference(null)).toBe(false);
  });
});
