import { fetchPendingMaintenanceFees, settleMaintenanceFees } from "./tenancyService";

const mockFrom = jest.fn();
jest.mock("@repo/supabase", () => ({ supabase: { from: (...args: unknown[]) => mockFrom(...args) } }));

function chain(data: unknown, error: unknown = null) {
  const result = { data, error };
  const query = {
    select: jest.fn(), eq: jest.fn(), update: jest.fn(), lte: jest.fn(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  for (const method of [query.select, query.eq, query.update, query.lte]) method.mockReturnValue(query);
  return query;
}

beforeEach(() => { jest.clearAllMocks(); });

describe("fetchPendingMaintenanceFees", () => {
  it("reads only this tenancy's pending fees for this tenant", async () => {
    const query = chain([{ id: "fee-1", title: "No water", fee_amount: 200 }]);
    mockFrom.mockReturnValue(query);
    expect(await fetchPendingMaintenanceFees("tenancy-1", "tenant-1")).toEqual([{ id: "fee-1", title: "No water", amount: 200 }]);
    expect(mockFrom).toHaveBeenCalledWith("maintenance_request");
    expect(query.eq).toHaveBeenCalledWith("tenancy_id", "tenancy-1");
    expect(query.eq).toHaveBeenCalledWith("tenant_id", "tenant-1");
    expect(query.eq).toHaveBeenCalledWith("fee_status", "pending");
  });

  it("ignores requests without a positive fee amount", async () => {
    mockFrom.mockReturnValue(chain([
      { id: "a", title: "Zero", fee_amount: 0 },
      { id: "b", title: "None", fee_amount: null },
      { id: "c", title: "Paint", fee_amount: "350.50" },
    ]));
    expect(await fetchPendingMaintenanceFees("tenancy-1", "tenant-1")).toEqual([{ id: "c", title: "Paint", amount: 350.5 }]);
  });

  it("surfaces a failed read instead of treating it as no fees", async () => {
    mockFrom.mockReturnValue(chain(null, new Error("permission denied")));
    await expect(fetchPendingMaintenanceFees("tenancy-1", "tenant-1")).rejects.toThrow("permission denied");
  });
});

describe("settleMaintenanceFees", () => {
  it("marks only this tenancy's pending fees raised before the payment as paid", async () => {
    const query = chain([{ id: "fee-1" }, { id: "fee-2" }]);
    mockFrom.mockReturnValue(query);
    expect(await settleMaintenanceFees("tenancy-1", "tenant-1", "2026-11-02T08:41:57.307Z")).toBe(2);
    expect(query.update).toHaveBeenCalledWith({ fee_status: "paid" });
    expect(query.eq).toHaveBeenCalledWith("tenancy_id", "tenancy-1");
    expect(query.eq).toHaveBeenCalledWith("tenant_id", "tenant-1");
    expect(query.eq).toHaveBeenCalledWith("fee_status", "pending");
    expect(query.lte).toHaveBeenCalledWith("created_at", "2026-11-02T08:41:57.307Z");
  });

  it("reports a failed write so the receipt can retry later", async () => {
    mockFrom.mockReturnValue(chain(null, new Error("blocked")));
    await expect(settleMaintenanceFees("tenancy-1", "tenant-1", "2026-11-02T00:00:00Z")).rejects.toThrow("blocked");
  });
});
