import { findPendingOnlinePayment } from "./pendingOnlinePayment";

const payment = (overrides: Partial<Parameters<typeof findPendingOnlinePayment>[0][number]> = {}) => ({
  status: "pending", method: "card", reference_id: "APT-AAAA1111", period_start: "2026-12-01", created_at: "2026-11-02T10:00:00Z", ...overrides,
});

it("finds this period's unfinished online payment", () => {
  expect(findPendingOnlinePayment([payment()], "2026-12-01")?.reference_id).toBe("APT-AAAA1111");
});

it("ignores finished attempts, cash, other periods and rows without a reference", () => {
  const rows = [
    payment({ status: "failed" }),
    payment({ status: "paid" }),
    payment({ method: "cash" }),
    payment({ period_start: "2026-11-01" }),
    payment({ reference_id: null }),
  ];
  expect(findPendingOnlinePayment(rows, "2026-12-01")).toBeNull();
  expect(findPendingOnlinePayment([], "2026-12-01")).toBeNull();
});

it("returns the newest when several are unfinished", () => {
  const rows = [
    payment({ reference_id: "APT-OLD00000", created_at: "2026-11-02T10:00:00Z" }),
    payment({ reference_id: "APT-NEW00000", created_at: "2026-11-02T11:00:00Z" }),
  ];
  expect(findPendingOnlinePayment(rows, "2026-12-01")?.reference_id).toBe("APT-NEW00000");
});

it("matches a missing period only with a missing period", () => {
  expect(findPendingOnlinePayment([payment({ period_start: null })], null)).not.toBeNull();
  expect(findPendingOnlinePayment([payment({ period_start: null })], "2026-12-01")).toBeNull();
});
