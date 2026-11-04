import { fetchMaintenanceDashboardRequests, fetchMaintenanceOverview, orderActiveRequests } from "./maintenanceDashboardService";
import { MAINTENANCE_DASHBOARD_LIMIT } from "@/constants/maintenance-dashboard";
import type { MaintenanceRequest } from "./maintenanceService";

const mockFrom = jest.fn();
const mockMedia = jest.fn();
jest.mock("@repo/supabase", () => ({ supabase: { from: (...args: unknown[]) => mockFrom(...args) } }));
jest.mock("@/service/media/privateMediaResolver", () => ({ resolvePrivateMediaUrls: (...args: unknown[]) => mockMedia(...args) }));

function chain(data: unknown, error: unknown = null, count: number | null = null) {
  const result = { data, error, count };
  const query = {
    select: jest.fn(), eq: jest.fn(), in: jest.fn(), order: jest.fn(), limit: jest.fn(), gt: jest.fn(), maybeSingle: jest.fn(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  for (const method of [query.select, query.eq, query.in, query.order, query.limit, query.gt, query.maybeSingle]) method.mockReturnValue(query);
  return query;
}

beforeEach(() => { jest.clearAllMocks(); });

it("keeps progress first, uses its recorded update, and orders pending by submission without mutating input", () => {
  const rows = [
    { id: "pending", status: "Pending", created_at: "2026-11-04", updated_at: "2026-12-01" },
    { id: "old-progress", status: "In Progress", created_at: "2026-11-01" },
    { id: "progress", status: "In Progress", created_at: "2026-10-01", updated_at: "2026-11-03" },
    { id: "closed", status: "Resolved", created_at: "2026-11-04" },
  ] as MaintenanceRequest[];
  expect(orderActiveRequests(rows).map((row) => row.id)).toEqual(["progress", "old-progress", "pending"]);
  expect(rows[0].id).toBe("pending");
});

it("independently bounds active and closed reads to the account and apartment, without photo signing", async () => {
  const progress = chain([{ id: "a", status: "in_progress", created_at: "2026-11-01" }]);
  const pending = chain([{ id: "b", status: "pending", created_at: "2026-11-02" }]);
  const history = chain([{ id: "c", status: "resolved", created_at: "2026-11-03" }]);
  mockFrom.mockReturnValueOnce(progress).mockReturnValueOnce(pending).mockReturnValueOnce(history);
  const result = await fetchMaintenanceDashboardRequests("apartment", "tenant");
  expect(result.active.map((row) => row.id)).toEqual(["a", "b"]);
  expect(result.history.map((row) => row.id)).toEqual(["c"]);
  for (const query of [progress, pending, history]) {
    expect(query.eq).toHaveBeenCalledWith("tenant_id", "tenant");
    expect(query.eq).toHaveBeenCalledWith("apartment_id", "apartment");
    expect(query.limit).toHaveBeenCalledWith(MAINTENANCE_DASHBOARD_LIMIT);
    expect(query.order).toHaveBeenCalledWith("id", { ascending: false });
  }
  expect(progress.in).toHaveBeenCalledWith("status", ["in_progress"]);
  expect(history.in).toHaveBeenCalledWith("status", ["resolved", "cancelled"]);
  expect(mockMedia).not.toHaveBeenCalled();
});

it("counts all active rows and pages all positive pending fees only for the running tenancy", async () => {
  const active = chain(null, null, 423);
  const tenancy = chain({ id: "current-tenancy" });
  const firstFees = chain(Array.from({ length: 200 }, (_, i) => ({ id: `fee-${i}`, fee_amount: "1.50" })));
  const lastFees = chain([{ id: "last", fee_amount: 25 }]);
  mockFrom.mockReturnValueOnce(active).mockReturnValueOnce(tenancy).mockReturnValueOnce(firstFees).mockReturnValueOnce(lastFees);
  expect(await fetchMaintenanceOverview("apartment", "tenant")).toEqual({ activeCount: 423, unpaidFees: 325, hasActiveTenancy: true });
  expect(active.select).toHaveBeenCalledWith("id", { count: "exact", head: true });
  expect(tenancy.eq).toHaveBeenCalledWith("status", "active");
  for (const query of [firstFees, lastFees]) {
    expect(query.eq).toHaveBeenCalledWith("tenancy_id", "current-tenancy");
    expect(query.eq).toHaveBeenCalledWith("tenant_id", "tenant");
    expect(query.eq).toHaveBeenCalledWith("apartment_id", "apartment");
    expect(query.eq).toHaveBeenCalledWith("fee_status", "pending");
    expect(query.gt).toHaveBeenCalledWith("fee_amount", 0);
  }
  expect(lastFees.gt).toHaveBeenCalledWith("id", "fee-199");
});

it("does not borrow fees from a past tenancy when none is active", async () => {
  mockFrom.mockReturnValueOnce(chain(null, null, 0)).mockReturnValueOnce(chain(null));
  expect(await fetchMaintenanceOverview("apartment", "tenant")).toEqual({ activeCount: 0, unpaidFees: 0, hasActiveTenancy: false });
  expect(mockFrom).toHaveBeenCalledTimes(2);
});

it("fails instead of presenting a false zero when a count or fee read fails", async () => {
  mockFrom.mockReturnValueOnce(chain(null, new Error("denied"))).mockReturnValueOnce(chain(null));
  await expect(fetchMaintenanceOverview("apartment", "tenant")).rejects.toThrow("denied");
  mockFrom.mockReturnValueOnce(chain(null, null, 2)).mockReturnValueOnce(chain({ id: "current" })).mockReturnValueOnce(chain(null, new Error("fees denied")));
  await expect(fetchMaintenanceOverview("apartment", "tenant")).rejects.toThrow("fees denied");
});
