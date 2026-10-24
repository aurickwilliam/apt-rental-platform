import {
  EMPTY_ATTENTION,
  EMPTY_THIS_MONTH,
  buildAttentionItems,
  buildRequestItems,
  buildTrendSeries,
  collectionProgress,
  consolidateMonthlyRevenue,
  currentMonthKey,
  monthLabel,
  monthRevenueTotal,
  normalizeDashboardData,
  summarizeCollection,
  summarizeRentDues,
  topPropertiesByRevenue,
} from "./landlordDashboard";
import type { DashboardData } from "./landlordDashboard";

const PAYLOAD = {
  stats: {
    totalProperties: 2,
    unitsOccupied: 1,
    pendingPayments: 1,
    maintenanceRequests: 1,
  },
  attention: {
    overdueCount: 1,
    overdueAmount: 12000,
    pendingCashCount: 1,
    pendingCashAmount: 5000,
    pendingCashApartmentId: "apartment-1",
    pendingApplications: 2,
    pendingVisitRequests: 0,
    pendingMaintenance: 3,
  },
  thisMonth: { collected: 15000, outstanding: 5000 },
  collectionByMonth: [
    { month: "2026-07", collected: 10000, unpaid: 0 },
    { month: "2026-08", collected: 15000, unpaid: 5000 },
  ],
  monthlyRevenue: [
    { month: "2025-09", amount: 0 },
    { month: "2025-10", amount: 0 },
    { month: "2025-11", amount: 0 },
    { month: "2025-12", amount: 0 },
    { month: "2026-01", amount: 0 },
    { month: "2026-02", amount: 0 },
    { month: "2026-03", amount: 0 },
    { month: "2026-04", amount: 0 },
    { month: "2026-05", amount: 0 },
    { month: "2026-06", amount: 0 },
    { month: "2026-07", amount: 0 },
    { month: "2026-08", amount: 15000 },
  ],
  revenueByProperty: [
    {
      apartmentId: "apartment-1",
      apartmentName: "Sunrise Tower",
      months: [{ month: "2026-08", amount: 15000 }],
    },
  ],
  rentDues: [
    {
      id: "payment-1",
      apartmentId: "apartment-1",
      apartmentName: "Sunrise Tower",
      tenantName: "Juan Dela Cruz",
      dueDate: "2026-08-15",
      amount: 12000,
      isOverdue: true,
    },
  ],
};

describe("monthLabel", () => {
  it("maps a YYYY-MM key to its short label", () => {
    expect(monthLabel("2026-08")).toBe("Aug");
    expect(monthLabel("2026-01")).toBe("Jan");
    expect(monthLabel("2026-12")).toBe("Dec");
  });

  it("passes through an unrecognized key", () => {
    expect(monthLabel("garbage")).toBe("garbage");
  });
});

describe("dashboard derivations", () => {
  it("reads the current month bucket and defaults to zero when absent", () => {
    expect(currentMonthKey(new Date(2026, 7, 15))).toBe("2026-08");
    expect(monthRevenueTotal(PAYLOAD.monthlyRevenue, "2026-08")).toBe(15000);
    expect(monthRevenueTotal(PAYLOAD.monthlyRevenue, "2026-07")).toBe(0);
    expect(monthRevenueTotal([], "2026-08")).toBe(0);
  });

  it("ranks properties by total paid revenue, highest first", () => {
    const ranked = topPropertiesByRevenue([
      ...PAYLOAD.revenueByProperty,
      {
        apartmentId: "apartment-2",
        apartmentName: "Blue House",
        months: [
          { month: "2026-07", amount: 10000 },
          { month: "2026-08", amount: 12000 },
        ],
      },
      { apartmentId: "apartment-3", apartmentName: "Empty Lot", months: [] },
    ]);

    expect(ranked.map((p) => p.apartmentName)).toEqual([
      "Blue House",
      "Sunrise Tower",
      "Empty Lot",
    ]);
    expect(ranked[0].total).toBe(22000);
    expect(topPropertiesByRevenue([], 3)).toEqual([]);
  });

  it("splits dues into pending vs overdue totals", () => {
    expect(summarizeRentDues(PAYLOAD.rentDues)).toEqual({
      pendingTotal: 0,
      overdueTotal: 12000,
      totalDue: 12000,
    });
    expect(
      summarizeRentDues([
        PAYLOAD.rentDues[0],
        { ...PAYLOAD.rentDues[0], id: "due-2", amount: 8000, isOverdue: false },
      ]),
    ).toEqual({ pendingTotal: 8000, overdueTotal: 12000, totalDue: 20000 });
    expect(summarizeRentDues([])).toEqual({ pendingTotal: 0, overdueTotal: 0, totalDue: 0 });
  });

  it("sums duplicate month keys while preserving chronological order", () => {
    expect(
      consolidateMonthlyRevenue([
        { month: "2026-08", amount: 15000 },
        { month: "2026-09", amount: 15000 },
        { month: "2026-09", amount: 45000 },
      ]),
    ).toEqual([
      { month: "2026-08", amount: 15000 },
      { month: "2026-09", amount: 60000 },
    ]);
    expect(monthRevenueTotal(
      consolidateMonthlyRevenue([
        { month: "2026-09", amount: 15000 },
        { month: "2026-09", amount: 45000 },
      ]),
      "2026-09",
    )).toBe(60000);
  });

  it("passes through unique months and skips malformed rows", () => {
    expect(consolidateMonthlyRevenue(PAYLOAD.monthlyRevenue)).toHaveLength(12);
    expect(consolidateMonthlyRevenue([])).toEqual([]);
    expect(
      consolidateMonthlyRevenue([
        { month: "2026-09", amount: 10000 },
        { month: null, amount: 5000 } as unknown as { month: string; amount: number },
        { month: "2026-10", amount: Number.NaN } as unknown as { month: string; amount: number },
      ]),
    ).toEqual([{ month: "2026-09", amount: 10000 }]);
  });
});

describe("collectionProgress", () => {
  it("reports collected against collected + outstanding", () => {
    expect(collectionProgress({ collected: 15000, outstanding: 5000 })).toEqual({
      collected: 15000,
      expected: 20000,
      percent: 75,
    });
  });

  it("is 0% when nothing is expected and 100% when fully collected", () => {
    expect(collectionProgress(EMPTY_THIS_MONTH)).toEqual({
      collected: 0,
      expected: 0,
      percent: 0,
    });
    expect(collectionProgress({ collected: 8000, outstanding: 0 }).percent).toBe(100);
  });
});

describe("buildRequestItems", () => {
  it("returns only requests that are waiting, in a fixed order", () => {
    expect(buildRequestItems(PAYLOAD.attention)).toEqual([
      { key: "applications", count: 2 },
      { key: "maintenance", count: 3 },
    ]);
    expect(
      buildRequestItems({ ...PAYLOAD.attention, pendingVisitRequests: 1 }),
    ).toEqual([
      { key: "applications", count: 2 },
      { key: "visits", count: 1 },
      { key: "maintenance", count: 3 },
    ]);
  });

  it("is empty when nothing is waiting", () => {
    expect(buildRequestItems(EMPTY_ATTENTION)).toEqual([]);
  });
});

describe("buildAttentionItems", () => {
  it("lists every open item most urgent first, with its peso total", () => {
    expect(buildAttentionItems(PAYLOAD.attention)).toEqual([
      { key: "overdue", count: 1, amount: 12000 },
      { key: "cash", count: 1, amount: 5000 },
      { key: "applications", count: 2 },
      { key: "maintenance", count: 3 },
    ]);
  });

  it("drops cleared rows and is empty when nothing needs attention", () => {
    expect(
      buildAttentionItems({
        ...EMPTY_ATTENTION,
        pendingVisitRequests: 1,
      }),
    ).toEqual([{ key: "visits", count: 1 }]);
    expect(buildAttentionItems(EMPTY_ATTENTION)).toEqual([]);
  });
});

describe("normalizeDashboardData", () => {
  it("defaults attention and thisMonth for a payload that predates them", () => {
    const { attention, thisMonth, collectionByMonth, ...legacy } = PAYLOAD;
    const result = normalizeDashboardData(legacy as unknown as DashboardData);

    expect(result.attention).toEqual(EMPTY_ATTENTION);
    expect(result.thisMonth).toEqual(EMPTY_THIS_MONTH);
    expect(result.collectionByMonth).toEqual([]);
    expect(result.stats).toEqual(PAYLOAD.stats);
  });

  it("keeps the values a current payload provides", () => {
    const result = normalizeDashboardData(PAYLOAD as unknown as DashboardData);

    expect(result.attention).toEqual(PAYLOAD.attention);
    expect(result.thisMonth).toEqual(PAYLOAD.thisMonth);
    expect(result.collectionByMonth).toEqual(PAYLOAD.collectionByMonth);
  });
});

describe("buildTrendSeries", () => {
  const POINTS = [
    { month: "2026-01", amount: 1000 },
    { month: "2026-02", amount: 2000 },
    { month: "2026-04", amount: 500 },
    { month: "2027-01", amount: 700 },
  ];

  it("keeps each month with its short label", () => {
    expect(buildTrendSeries(POINTS, "Monthly")).toEqual([
      { label: "Jan", value: 1000 },
      { label: "Feb", value: 2000 },
      { label: "Apr", value: 500 },
      { label: "Jan", value: 700 },
    ]);
  });

  it("sums into quarters per year, in chronological order", () => {
    expect(buildTrendSeries(POINTS, "Quarterly")).toEqual([
      { label: "Q1", value: 3000 },
      { label: "Q2", value: 500 },
      { label: "Q1", value: 700 },
    ]);
  });

  it("sums into one bucket per year", () => {
    expect(buildTrendSeries(POINTS, "Yearly")).toEqual([
      { label: "2026", value: 3500 },
      { label: "2027", value: 700 },
    ]);
    expect(buildTrendSeries([], "Yearly")).toEqual([]);
  });
});

describe("summarizeCollection", () => {
  it("totals collected and unpaid rent and reports the collected share", () => {
    expect(summarizeCollection(PAYLOAD.collectionByMonth)).toEqual({
      collected: 25000,
      unpaid: 5000,
      percent: 83,
    });
  });

  it("is zero when nothing was billed", () => {
    expect(summarizeCollection([])).toEqual({ collected: 0, unpaid: 0, percent: 0 });
  });
});
