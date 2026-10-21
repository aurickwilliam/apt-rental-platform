export type MaintenanceFeeStatus = "pending" | "paid" | "waived";

export function normalizeMaintenanceFeeStatus(value: unknown): MaintenanceFeeStatus | null {
  return value === "pending" || value === "paid" || value === "waived" ? value : null;
}

export function getMaintenanceFeeError(amount: number | undefined): string | null {
  return amount !== undefined && (!Number.isFinite(amount) || amount <= 0)
    ? "Fee amount must be greater than ₱0."
    : null;
}

export function canWaiveMaintenanceFee(request: {
  fee_amount: number | null;
  fee_status: MaintenanceFeeStatus | null;
}): boolean {
  return (request.fee_amount ?? 0) > 0 && request.fee_status === "pending";
}
