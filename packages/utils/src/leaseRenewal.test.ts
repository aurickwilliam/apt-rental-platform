import {
  calculateRenewalCharges, canRequestLeaseRenewal, canTakeRenewalAction,
  renewalCentavos, renewalDaysRemaining, renewalReminderMilestone, renewalStatusLabel,
  type RenewalChargeInput,
} from './leaseRenewal';

const input = (changes: Partial<RenewalChargeInput> = {}): RenewalChargeInput => ({
  currentMonthlyRent: 15000, monthlyRent: 15000, depositTarget: 30000,
  declaredRetainedDeposit: 30000, replenishmentKind: 'none', replenishmentReason: '',
  advanceMonths: 1, verifiedAdvanceCredit: 0, ...changes,
});

describe('lease renewal rules', () => {
  it('opens requests in the final 30 days only, on an active dated lease', () => {
    expect(canRequestLeaseRenewal('2026-12-06', '2026-11-06', true)).toBe(true);
    expect(canRequestLeaseRenewal('2026-12-07', '2026-11-06', true)).toBe(false);
    expect(canRequestLeaseRenewal('2026-11-06', '2026-11-06', true)).toBe(true);
    expect(canRequestLeaseRenewal('2026-11-05', '2026-11-06', true)).toBe(false);
    expect(canRequestLeaseRenewal(null, '2026-11-06', true)).toBe(false);
    expect(canRequestLeaseRenewal('2026-11-20', '2026-11-06', false)).toBe(false);
  });

  it('rejects normalized invalid dates and handles leap years without local timezone shifts', () => {
    expect(renewalDaysRemaining('2028-03-01', '2028-02-28')).toBe(2);
    expect(renewalDaysRemaining('2026-02-30', '2026-02-28')).toBeNull();
    expect(renewalDaysRemaining('2026-12-01', 'invalid')).toBeNull();
  });

  it('selects one applicable reminder rather than replaying old milestones', () => {
    expect([61, 60, 45, 30, 20, 14, 10, 7, 3, -1].map(renewalReminderMilestone))
      .toEqual([null, 60, 60, 30, 30, 14, 14, 7, 7, null]);
    expect(renewalReminderMilestone(1.5)).toBeNull();
  });

  it('separates scheduled renewal from effective renewal', () => {
    expect(renewalStatusLabel('renewed', '2026-12-01', '2026-11-06')).toBe('Renewed — scheduled');
    expect(renewalStatusLabel('renewed', '2026-11-06', '2026-11-06')).toBe('Renewed — effective');
  });

  it('uses chat without inventing a dispute transition or accepting terms', () => {
    expect(canTakeRenewalAction('awaiting_tenant_confirmation', 'tenant', 'discuss')).toBe(true);
    expect(canTakeRenewalAction('awaiting_tenant_confirmation', 'landlord', 'accept')).toBe(false);
    expect(canTakeRenewalAction('payment_verification_pending', 'landlord', 'propose')).toBe(false);
    expect(canTakeRenewalAction('renewed', 'tenant', 'decline')).toBe(false);
  });

  it('keeps advance and replenishment separate and deducts verified applicable credit', () => {
    expect(calculateRenewalCharges(input({ verifiedAdvanceCredit: 5000 }))).toEqual({ ok: true, charges: {
      advanceRent: 15000, advanceCredit: 5000, advanceDue: 10000, depositReplenishment: 0, total: 10000,
    } });
    expect(calculateRenewalCharges(input({ verifiedAdvanceCredit: 999999 }))).toMatchObject({ ok: true, charges: { total: 0 } });
  });

  it('supports justified partial and full replenishment, never a second intact deposit', () => {
    expect(calculateRenewalCharges(input({ replenishmentKind: 'partial', declaredRetainedDeposit: 20000,
      replenishmentReason: 'Documented repairs', advanceMonths: 0 }))).toMatchObject({ ok: true, charges: { total: 10000 } });
    expect(calculateRenewalCharges(input({ replenishmentKind: 'full', declaredRetainedDeposit: 0,
      replenishmentReason: 'Agreed deductions' }))).toMatchObject({ ok: true, charges: { total: 45000 } });
    expect(calculateRenewalCharges(input({ replenishmentKind: 'full' })).ok).toBe(false);
    expect(calculateRenewalCharges(input({ replenishmentKind: 'partial', declaredRetainedDeposit: 0 })).ok).toBe(false);
    expect(calculateRenewalCharges(input({ declaredRetainedDeposit: 20000 })).ok).toBe(false);
  });

  it('fails closed on unknown deposits, unjustified deductions and increases', () => {
    for (const changes of [
      { depositTarget: null }, { declaredRetainedDeposit: null }, { monthlyRent: 16000 },
      { monthlyRent: 999 }, { depositTarget: 30001 }, { declaredRetainedDeposit: -1 },
      { verifiedAdvanceCredit: NaN }, { replenishmentKind: 'full' as const, declaredRetainedDeposit: 0 },
    ]) expect(calculateRenewalCharges(input(changes)).ok).toBe(false);
    expect(calculateRenewalCharges(input({ monthlyRent: 14000, depositTarget: 28000, declaredRetainedDeposit: 28000 })).ok).toBe(true);
  });

  it('rejects fractions of a cent and unsafe or nonfinite money', () => {
    expect(renewalCentavos(0.29)).toBe(29);
    for (const amount of [1.001, -1, Infinity, NaN, Number.MAX_SAFE_INTEGER]) expect(renewalCentavos(amount)).toBeNull();
  });
});
