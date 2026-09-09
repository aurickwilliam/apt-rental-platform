export function toMoveInNumber(
  value: string | number | null | undefined,
): number {
  if (value == null || value === "") return 0;
  const num = Number(value);
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
