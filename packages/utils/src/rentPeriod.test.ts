import {
  getCurrentRentStatus,
  nextPaymentPeriod,
  paidAmountForPeriod,
  type RentPeriodPayment,
  type RentStatusTenancy,
} from "./rentPeriod";

const payment = (overrides: Partial<RentPeriodPayment> = {}): RentPeriodPayment => ({
  status: "paid",
  amount: 1000,
  period_start: "2026-08-01",
  ...overrides,
});

describe("paidAmountForPeriod", () => {
  const payments: RentPeriodPayment[] = [
    payment({ amount: 1000 }),
    payment({ amount: 2000 }),
    payment({ amount: 5000, status: "pending" }),
    payment({ amount: 9000, period_start: "2026-07-01" }),
    payment({ amount: null }),
  ];

  it("sums only paid rows of the given period", () => {
    expect(paidAmountForPeriod(payments, "2026-08-01")).toBe(3000);
  });

  it("returns zero when nothing was paid", () => {
    expect(paidAmountForPeriod(payments, "2026-09-01")).toBe(0);
  });
});

describe("nextPaymentPeriod", () => {
  it("bills the following month on the due day", () => {
    expect(nextPaymentPeriod("2026-10-01", 5)).toEqual({
      periodStart: "2026-11-01",
      periodEnd: "2026-11-30",
      dueDate: "2026-11-05",
    });
  });

  it("clamps the due day to the end of the month", () => {
    expect(nextPaymentPeriod("2027-01-01", 31).dueDate).toBe("2027-02-28");
  });

  it("rolls December into January", () => {
    expect(nextPaymentPeriod("2026-12-01", 5).periodStart).toBe("2027-01-01");
  });

  it("falls back to the default due day", () => {
    expect(nextPaymentPeriod("2026-10-01", null).dueDate).toBe("2026-11-05");
  });
});

describe("getCurrentRentStatus", () => {
  const paid = (amount: number, periodStart: string): RentPeriodPayment =>
    payment({ amount, period_start: periodStart });

  const tenancy = (overrides: Partial<RentStatusTenancy> = {}): RentStatusTenancy => ({
    lease_start: "2026-01-15",
    rent_due_day: 5,
    monthly_rent: 10000,
    apartment: { monthly_rent: 12000 },
    currentPayment: null,
    ...overrides,
  });

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-10-14T09:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("bills the current month, due on the 5th, when there is no current payment", () => {
    expect(getCurrentRentStatus(tenancy(), [])).toEqual({
      monthlyRent: 10000,
      periodStart: "2026-10-01",
      periodEnd: "2026-10-31",
      dueDate: "2026-10-05",
      isFullyPaid: false,
      status: "Pending",
    });
  });

  it("falls back to the apartment's rent when the tenancy has none", () => {
    expect(getCurrentRentStatus(tenancy({ monthly_rent: null }), []).monthlyRent).toBe(12000);
  });

  it("is paid once paid payments for the period cover the rent", () => {
    const status = getCurrentRentStatus(tenancy(), [paid(4000, "2026-10-01"), paid(6000, "2026-10-01")]);

    expect(status.isFullyPaid).toBe(true);
    expect(status.status).toBe("Paid");
  });

  it("ignores payments for other periods and partial amounts", () => {
    const status = getCurrentRentStatus(tenancy(), [paid(10000, "2026-09-01"), paid(5000, "2026-10-01")]);

    expect(status.isFullyPaid).toBe(false);
    expect(status.status).toBe("Pending");
  });

  it("shows Paid from the tenancy's current payment before the payment list catches up", () => {
    const status = getCurrentRentStatus(
      tenancy({
        currentPayment: {
          status: "paid",
          period_start: "2026-10-01",
          period_end: "2026-10-31",
          due_date: "2026-10-05",
        },
      }),
      []
    );

    expect(status.isFullyPaid).toBe(false);
    expect(status.status).toBe("Paid");
  });

  it("reuses the current payment's dates when it covers the billing month", () => {
    const status = getCurrentRentStatus(
      tenancy({
        currentPayment: {
          status: "pending",
          period_start: "2026-10-01",
          period_end: "2026-10-30",
          due_date: "2026-10-07",
        },
      }),
      []
    );

    expect(status.periodEnd).toBe("2026-10-30");
    expect(status.dueDate).toBe("2026-10-07");
  });

  it("bills the lease's first month when the lease starts later, due on its due day", () => {
    const status = getCurrentRentStatus(tenancy({ lease_start: "2026-11-03" }), []);

    expect(status.periodStart).toBe("2026-11-01");
    expect(status.dueDate).toBe("2026-11-05");
  });

  it("skips a month whose due date falls before move-in, like the server reminders", () => {
    const status = getCurrentRentStatus(tenancy({ lease_start: "2026-11-08" }), []);

    expect(status.periodStart).toBe("2026-12-01");
    expect(status.periodEnd).toBe("2026-12-31");
    expect(status.dueDate).toBe("2026-12-05");
  });

  it("skips the current month when the lease began after its due date", () => {
    expect(getCurrentRentStatus(tenancy({ lease_start: "2026-10-08" }), []).periodStart).toBe("2026-11-01");
  });

  it("uses the tenancy's due day, clamped to the end of the month", () => {
    jest.setSystemTime(new Date("2026-11-10T09:00:00"));

    expect(getCurrentRentStatus(tenancy({ rent_due_day: 31 }), []).dueDate).toBe("2026-11-30");
  });

  it("rolls a December move-in past its due date into January", () => {
    expect(getCurrentRentStatus(tenancy({ lease_start: "2026-12-20" }), []).periodStart).toBe("2027-01-01");
  });

  it("never counts rent as paid when the rent is zero", () => {
    expect(getCurrentRentStatus(tenancy({ monthly_rent: 0, apartment: { monthly_rent: 0 } }), []).isFullyPaid).toBe(false);
  });
});
