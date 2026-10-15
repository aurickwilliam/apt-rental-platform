// Listing pricing rules shared by web and mobile. The database enforces the
// same rule in `guard_apartment_pricing()`; keep both in sync.

export const MIN_MONTHLY_RENT = 1000;

/** Security deposit: none, 1 month, or 2 months of rent. */
export const SECURITY_DEPOSIT_MONTH_OPTIONS = [0, 1, 2] as const;

/** Advance rent: none or 1 month of rent. */
export const ADVANCE_RENT_MONTH_OPTIONS = [0, 1] as const;

export const MIN_RENT_DUE_DAY = 1;
export const MAX_RENT_DUE_DAY = 31;

export type SecurityDepositMonths = (typeof SECURITY_DEPOSIT_MONTH_OPTIONS)[number];
export type AdvanceRentMonths = (typeof ADVANCE_RENT_MONTH_OPTIONS)[number];

export interface ApartmentPricingInput {
  monthlyRent: number;
  /** `null` when the landlord has not picked an option yet. */
  securityDepositMonths: number | null;
  advanceRentMonths: number | null;
  rentDueDay?: number | null;
}

export type ApartmentPricingErrorField =
  | "monthlyRent"
  | "securityDepositMonths"
  | "advanceRentMonths"
  | "rentDueDay";

export type ApartmentPricingErrors = Partial<Record<ApartmentPricingErrorField, string>>;

/** "None", "1 month", "2 months". */
export function formatPricingMonths(months: number): string {
  if (months === 0) return "None";
  return months === 1 ? "1 month" : `${months} months`;
}

/** Peso amount stored on the listing for a number of months of rent. */
export function pricingAmountFromMonths(monthlyRent: number, months: number): number {
  return monthlyRent * months;
}

/**
 * Months of rent a stored amount represents, or `null` when it is not one of
 * `options` (listings priced before the shared rule). A missing amount is none.
 */
export function pricingMonthsFromAmount(
  monthlyRent: number | null | undefined,
  amount: number | null | undefined,
  options: readonly number[],
): number | null {
  const value = amount ?? 0;
  if (value === 0) return options.includes(0) ? 0 : null;
  if (!monthlyRent || monthlyRent <= 0) return null;
  return options.find((months) => months > 0 && monthlyRent * months === value) ?? null;
}

export function isValidRentDueDay(day: number | null | undefined): boolean {
  return (
    typeof day === "number" &&
    Number.isInteger(day) &&
    day >= MIN_RENT_DUE_DAY &&
    day <= MAX_RENT_DUE_DAY
  );
}

export function validateApartmentPricing(input: ApartmentPricingInput): ApartmentPricingErrors {
  const errors: ApartmentPricingErrors = {};

  if (!Number.isFinite(input.monthlyRent) || input.monthlyRent < MIN_MONTHLY_RENT) {
    errors.monthlyRent = `Monthly rent must be at least ₱${MIN_MONTHLY_RENT.toLocaleString("en-PH")}.`;
  }

  if (
    input.securityDepositMonths === null ||
    !(SECURITY_DEPOSIT_MONTH_OPTIONS as readonly number[]).includes(input.securityDepositMonths)
  ) {
    errors.securityDepositMonths = "Security deposit must be none, 1 month, or 2 months of rent.";
  }

  if (
    input.advanceRentMonths === null ||
    !(ADVANCE_RENT_MONTH_OPTIONS as readonly number[]).includes(input.advanceRentMonths)
  ) {
    errors.advanceRentMonths = "Advance rent must be none or 1 month of rent.";
  }

  if (input.rentDueDay !== undefined && !isValidRentDueDay(input.rentDueDay)) {
    errors.rentDueDay = `Enter a day between ${MIN_RENT_DUE_DAY} and ${MAX_RENT_DUE_DAY}.`;
  }

  return errors;
}
