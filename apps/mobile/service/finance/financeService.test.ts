import { FINANCE_PAGE_SIZE } from "@repo/utils";
import { fetchExpensePage, fetchFinances, fetchRentLedger, saveExpense } from "./financeService";

const mockQuery = {
  select: jest.fn(), eq: jest.fn(), gte: jest.fn(), lt: jest.fn(), gt: jest.fn(), is: jest.fn(),
  order: jest.fn(), limit: jest.fn(), or: jest.fn(), insert: jest.fn(), update: jest.fn(), single: jest.fn(),
  then: jest.fn(),
};
const mockFrom = jest.fn();
const mockRpc = jest.fn();
jest.mock("@repo/supabase", () => ({ supabase: { from: (...args: unknown[]) => mockFrom(...args), rpc: (...args: unknown[]) => mockRpc(...args) } }));

describe("finance service boundaries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const [key, value] of Object.entries(mockQuery)) if (key !== "then") value.mockReturnValue(mockQuery);
    mockQuery.then.mockImplementation((resolve) => Promise.resolve({ data: [], error: null }).then(resolve));
    mockFrom.mockReturnValue(mockQuery); mockRpc.mockReturnValue(mockQuery);
  });
  test("expense reads are owner-scoped, month-bounded, keyset-paginated and exclude removed listings", async () => {
    await fetchExpensePage("owner", { month: "2026-12", apartmentId: "apt" }, "maintenance", { spent_on: "2026-12-05", id: "cursor" });
    expect(mockQuery.eq).toHaveBeenCalledWith("landlord_id", "owner");
    expect(mockQuery.eq).toHaveBeenCalledWith("apartment_id", "apt");
    expect(mockQuery.eq).toHaveBeenCalledWith("category", "maintenance");
    expect(mockQuery.gte).toHaveBeenCalledWith("spent_on", "2026-12-01");
    expect(mockQuery.lt).toHaveBeenCalledWith("spent_on", "2027-01-01");
    expect(mockQuery.is).toHaveBeenCalledWith("apartments.deleted_at", null);
    expect(mockQuery.limit).toHaveBeenCalledWith(FINANCE_PAGE_SIZE + 1);
    expect(mockQuery.or).toHaveBeenCalledWith("spent_on.lt.2026-12-05,and(spent_on.eq.2026-12-05,id.lt.cursor)");
  });
  test("rental-period collections use a separate bounded ledger, not cash-month totals", async () => {
    await fetchRentLedger({ month: "2026-10", apartmentId: null }, "overdue", "after");
    expect(mockRpc).toHaveBeenCalledWith("landlord_rent_ledger", { p_month: "2026-10-01", p_apartment_id: undefined });
    expect(mockQuery.eq).toHaveBeenCalledWith("status", "overdue");
    expect(mockQuery.gt).toHaveBeenCalledWith("id", "after");
    expect(mockQuery.limit).toHaveBeenCalledWith(FINANCE_PAGE_SIZE + 1);
  });
  test("save errors propagate instead of looking successful", async () => {
    mockQuery.single.mockResolvedValue({ error: { code: "42501" }, data: null });
    await expect(saveExpense("owner", { id: "id", apartment_id: "apt", amount: 10, category: "maintenance", treatment: "operating", spent_on: "2026-10-01", description: "Repair" }, false)).rejects.toEqual({ code: "42501" });
  });
  test("malformed finance responses are rejected", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    await expect(fetchFinances({ month: "2026-10", apartmentId: null })).rejects.toThrow("could not be read");
  });
  test("the month summary is mapped from the RPC's snake_case key", async () => {
    mockRpc.mockResolvedValue({
      data: {
        months: [],
        income_months: [
          { month: "2026-09", collected: 4500 },
          { month: "2026-10", collected: 0 },
        ],
      },
      error: null,
    });
    await expect(fetchFinances({ month: "2026-10", apartmentId: null })).resolves.toMatchObject({
      incomeMonths: [
        { month: "2026-09", collected: 4500 },
        { month: "2026-10", collected: 0 },
      ],
    });
  });
  test("reports from deployments without the month summary still load", async () => {
    mockRpc.mockResolvedValue({ data: { months: [] }, error: null });
    const report = await fetchFinances({ month: "2026-10", apartmentId: null });
    expect(report.incomeMonths).toBeUndefined();
  });
  test("malformed month summaries are rejected instead of shown as zero rent", async () => {
    mockRpc.mockResolvedValue({
      data: { months: [], income_months: [{ month: "2026-13", collected: 10 }] },
      error: null,
    });
    await expect(fetchFinances({ month: "2026-10", apartmentId: null })).rejects.toThrow("month summary");
  });
});
