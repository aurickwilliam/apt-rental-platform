import {
  ADVANCE_RENT_MONTH_OPTIONS,
  SECURITY_DEPOSIT_MONTH_OPTIONS,
  formatPricingMonths,
  isValidRentDueDay,
  pricingAmountFromMonths,
  pricingMonthsFromAmount,
  validateApartmentPricing,
} from "./apartmentPricing";

describe("pricingMonthsFromAmount", () => {
  it("maps exact multiples of rent to months", () => {
    expect(pricingMonthsFromAmount(5000, 10000, SECURITY_DEPOSIT_MONTH_OPTIONS)).toBe(2);
    expect(pricingMonthsFromAmount(5000, 5000, ADVANCE_RENT_MONTH_OPTIONS)).toBe(1);
  });

  it("treats a missing or zero amount as none", () => {
    expect(pricingMonthsFromAmount(5000, null, SECURITY_DEPOSIT_MONTH_OPTIONS)).toBe(0);
    expect(pricingMonthsFromAmount(5000, 0, ADVANCE_RENT_MONTH_OPTIONS)).toBe(0);
  });

  it("returns null for amounts outside the rule", () => {
    expect(pricingMonthsFromAmount(5000, 1500, SECURITY_DEPOSIT_MONTH_OPTIONS)).toBeNull();
    expect(pricingMonthsFromAmount(5000, 10000, ADVANCE_RENT_MONTH_OPTIONS)).toBeNull();
    expect(pricingMonthsFromAmount(0, 5000, SECURITY_DEPOSIT_MONTH_OPTIONS)).toBeNull();
  });
});

describe("validateApartmentPricing", () => {
  const valid = { monthlyRent: 5000, securityDepositMonths: 2, advanceRentMonths: 1, rentDueDay: 5 };

  it("accepts the allowed options", () => {
    expect(validateApartmentPricing(valid)).toEqual({});
    expect(validateApartmentPricing({ ...valid, securityDepositMonths: 0, advanceRentMonths: 0 })).toEqual({});
  });

  it("rejects rent below the minimum", () => {
    expect(validateApartmentPricing({ ...valid, monthlyRent: 999 }).monthlyRent).toBeDefined();
    expect(validateApartmentPricing({ ...valid, monthlyRent: Number.NaN }).monthlyRent).toBeDefined();
  });

  it("rejects months outside the options or not yet chosen", () => {
    expect(validateApartmentPricing({ ...valid, securityDepositMonths: 3 }).securityDepositMonths).toBeDefined();
    expect(validateApartmentPricing({ ...valid, advanceRentMonths: 2 }).advanceRentMonths).toBeDefined();
    expect(validateApartmentPricing({ ...valid, advanceRentMonths: null }).advanceRentMonths).toBeDefined();
  });

  it("checks the rent due day only when given", () => {
    expect(validateApartmentPricing({ ...valid, rentDueDay: 32 }).rentDueDay).toBeDefined();
    expect(validateApartmentPricing({ ...valid, rentDueDay: undefined })).toEqual({});
  });
});

describe("helpers", () => {
  it("formats month options", () => {
    expect(SECURITY_DEPOSIT_MONTH_OPTIONS.map(formatPricingMonths)).toEqual(["None", "1 month", "2 months"]);
  });

  it("computes amounts from months", () => {
    expect(pricingAmountFromMonths(7500, 2)).toBe(15000);
  });

  it("validates rent due days", () => {
    expect(isValidRentDueDay(1)).toBe(true);
    expect(isValidRentDueDay(31)).toBe(true);
    expect(isValidRentDueDay(0)).toBe(false);
    expect(isValidRentDueDay(5.5)).toBe(false);
    expect(isValidRentDueDay(null)).toBe(false);
  });
});
