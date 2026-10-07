import {
  consolidateMonthlyRevenue,
  currentMonthKey,
  fetchDashboardData,
  monthLabel,
  monthRevenueTotal,
  summarizeRentDues,
  topPropertiesByRevenue,
} from "./dashboardService";

const LANDLORD_ID = "landlord-1";
const mockRpc = jest.fn();

jest.mock("@repo/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

const PAYLOAD = {
  stats: {
    totalProperties: 2,
    unitsOccupied: 1,
    pendingPayments: 1,
    maintenanceRequests: 1,
  },
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

describe("fetchDashboardData", () => {
  /** Validates: single RPC round trip returning the full dashboard payload. */
  it("calls get_landlord_dashboard with the landlord id and returns the payload", async () => {
    mockRpc.mockResolvedValue({ data: PAYLOAD, error: null });

    const result = await fetchDashboardData(LANDLORD_ID);

    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith("get_landlord_dashboard", {
      p_landlord_id: LANDLORD_ID,
    });
    expect(result).toEqual(PAYLOAD);
  });

  it("throws when the RPC returns an error", async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error("rpc failed") });

    await expect(fetchDashboardData(LANDLORD_ID)).rejects.toThrow("rpc failed");
  });
});

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
