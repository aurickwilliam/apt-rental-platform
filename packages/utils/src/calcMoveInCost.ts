import { extractRawNumber } from "./formatCurrencyInput";

export function toMoveInNumber(
  value: string | number | null | undefined,
): number {
  if (value == null || value === "") return 0;
  const raw = extractRawNumber(value);
  if (!raw || raw === ".") return 0;
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}

export function calcMoveInCost(
  monthlyRent: string | number | null | undefined,
  securityDeposit: string | number | null | undefined,
  advanceRent: string | number | null | undefined,
): number {
  return (
    toMoveInNumber(monthlyRent) +
    toMoveInNumber(securityDeposit) +
    toMoveInNumber(advanceRent)
  );
}
