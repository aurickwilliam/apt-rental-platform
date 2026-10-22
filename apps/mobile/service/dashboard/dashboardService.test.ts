import {
  EMPTY_ATTENTION,
  EMPTY_THIS_MONTH,
  fetchDashboardData,
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
  attention: {
    overdueCount: 1,
    overdueAmount: 12000,
    pendingCashCount: 1,
    pendingCashAmount: 5000,
    pendingCashApartmentId: "apartment-1",
    pendingApplications: 2,
    pendingVisitRequests: 0,
  },
  thisMonth: { collected: 15000, outstanding: 5000 },
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

  it("defaults attention and thisMonth when the RPC predates them", async () => {
    const { attention, thisMonth, ...legacyPayload } = PAYLOAD;
    mockRpc.mockResolvedValue({ data: legacyPayload, error: null });

    const result = await fetchDashboardData(LANDLORD_ID);

    expect(result.attention).toEqual(EMPTY_ATTENTION);
    expect(result.thisMonth).toEqual(EMPTY_THIS_MONTH);
    expect(result.stats).toEqual(PAYLOAD.stats);
  });

  it("throws when the RPC returns an error", async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error("rpc failed") });

    await expect(fetchDashboardData(LANDLORD_ID)).rejects.toThrow("rpc failed");
  });
});
