import { canWaiveMaintenanceFee, getMaintenanceFeeError, normalizeMaintenanceFeeStatus } from "./maintenanceFee";

it.each([undefined, 0.01, 100, 2500.50])("accepts an optional positive fee %s", (amount) => {
  expect(getMaintenanceFeeError(amount)).toBeNull();
});

it.each([0, -1, NaN, Infinity, -Infinity])("rejects invalid fee %s", (amount) => {
  expect(getMaintenanceFeeError(amount)).toBe("Fee amount must be greater than ₱0.");
});

it.each(["pending", "paid", "waived"] as const)("preserves fee status %s", (status) => {
  expect(normalizeMaintenanceFeeStatus(status)).toBe(status);
});

it.each([null, undefined, "unknown"])("does not invent a fee status for %s", (status) => {
  expect(normalizeMaintenanceFeeStatus(status)).toBeNull();
});

it("allows waiving only positive pending fees", () => {
  expect(canWaiveMaintenanceFee({ fee_amount: 500, fee_status: "pending" })).toBe(true);
  for (const status of ["paid", "waived", null] as const) {
    expect(canWaiveMaintenanceFee({ fee_amount: 500, fee_status: status })).toBe(false);
  }
  expect(canWaiveMaintenanceFee({ fee_amount: 0, fee_status: "pending" })).toBe(false);
  expect(canWaiveMaintenanceFee({ fee_amount: null, fee_status: null })).toBe(false);
});
