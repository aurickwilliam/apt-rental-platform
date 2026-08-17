import {
  fetchDashboardStats,
  fetchMonthlyRevenue,
  fetchRevenueByProperty,
  fetchRentDues,
} from "./dashboardService";

const LANDLORD_ID = "landlord-1";
const mockFrom = jest.fn();

type QueryResult = {
  data: unknown[] | null;
  count: number | null;
  error: Error | null;
};

interface QueryMock {
  select: jest.Mock;
  eq: jest.Mock;
  in: jest.Mock;
  is: jest.Mock;
  gte: jest.Mock;
  lte: jest.Mock;
  neq: jest.Mock;
  not: jest.Mock;
  order: jest.Mock;
  then: PromiseLike<QueryResult>["then"];
}

function createQuery(result: QueryResult): QueryMock {
  const query: QueryMock = {
    select: jest.fn(),
    eq: jest.fn(),
    in: jest.fn(),
    is: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),
    neq: jest.fn(),
    not: jest.fn(),
    order: jest.fn(),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.is.mockReturnValue(query);
  query.gte.mockReturnValue(query);
  query.lte.mockReturnValue(query);
  query.neq.mockReturnValue(query);
  query.not.mockReturnValue(query);
  query.order.mockReturnValue(query);

  return query;
}

jest.mock("@repo/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

describe("fetchDashboardStats", () => {
  /** Validates: Requirements 1.6, 2.6 */
  it("fetches apartment IDs once before resolving independent counts in parallel", async () => {
    const apartmentsQuery = createQuery({
      data: [{ id: "apartment-1" }, { id: "apartment-2" }],
      count: null,
      error: null,
    });
    const unitsQuery = createQuery({ data: null, count: 1, error: null });
    const paymentsQuery = createQuery({ data: null, count: 2, error: null });
    const maintenanceQuery = createQuery({ data: null, count: 3, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "apartments") return apartmentsQuery;
      if (table === "tenancies") return unitsQuery;
      if (table === "payment") return paymentsQuery;
      if (table === "maintenance_request") return maintenanceQuery;
      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(fetchDashboardStats(LANDLORD_ID)).resolves.toEqual({
      totalProperties: 2,
      unitsOccupied: 1,
      pendingPayments: 2,
      maintenanceRequests: 3,
    });

    expect(mockFrom.mock.calls.filter(([table]) => table === "apartments")).toHaveLength(1);
    expect(paymentsQuery.in).toHaveBeenCalledWith("apartment_id", ["apartment-1", "apartment-2"]);
    expect(maintenanceQuery.in).toHaveBeenCalledWith("apartment_id", ["apartment-1", "apartment-2"]);
  });
});

describe("fetchMonthlyRevenue", () => {
  const apartmentsQuery = () => createQuery({
    data: [{ id: "apartment-1", name: "Sunset Apartments" }],
    count: null,
    error: null,
  });

  function mockApartmentsAndPayments(payments: unknown[]) {
    const aptQuery = apartmentsQuery();
    const paymentsQuery = createQuery({ data: payments, count: null, error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "apartments") return aptQuery;
      if (table === "payment") return paymentsQuery;
      throw new Error(`Unexpected table: ${table}`);
    });
    return { aptQuery, paymentsQuery };
  }

  it("returns an empty list when the landlord has no apartments", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "apartments") return createQuery({ data: [], count: null, error: null });
      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(fetchMonthlyRevenue(LANDLORD_ID)).resolves.toEqual([]);
  });

  it("sums paid payments by month across the trailing window", async () => {
    const { paymentsQuery } = mockApartmentsAndPayments([
      { date: "2026-07-15", amount: 12000 },
      { date: "2026-07-20", amount: 8000 },
      { date: "2025-10-05", amount: 10000 },
      { date: "2026-06-01", amount: 5000 },
    ]);

    const result = await fetchMonthlyRevenue(LANDLORD_ID, 12);

    expect(paymentsQuery.in).toHaveBeenCalledWith("apartment_id", ["apartment-1"]);
    expect(paymentsQuery.eq).toHaveBeenCalledWith("status", "paid");
    expect(paymentsQuery.gte).toHaveBeenCalled();
    expect(paymentsQuery.lte).toHaveBeenCalled();

    expect(result).toHaveLength(12);
    expect(result[11]).toEqual({ month: "Aug", amount: 0 });
    expect(result[10]).toEqual({ month: "Jul", amount: 20000 });
    expect(result[9]).toEqual({ month: "Jun", amount: 5000 });
    expect(result[1]).toEqual({ month: "Oct", amount: 10000 });
    expect(result.every((point) => point.amount >= 0)).toBe(true);
  });
});

describe("fetchRevenueByProperty", () => {
  it("returns per-apartment paid sums for the month, filtered and sorted", async () => {
    const aptQuery = createQuery({
      data: [
        { id: "apartment-1", name: "Sunset Apartments" },
        { id: "apartment-2", name: "Maple Residences" },
      ],
      count: null,
      error: null,
    });
    const paymentsQuery = createQuery({
      data: [
        { apartment_id: "apartment-1", amount: 12000 },
        { apartment_id: "apartment-1", amount: 4000 },
        { apartment_id: "apartment-2", amount: 9000 },
      ],
      count: null,
      error: null,
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "apartments") return aptQuery;
      if (table === "payment") return paymentsQuery;
      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await fetchRevenueByProperty(LANDLORD_ID, 2026, 5);

    expect(paymentsQuery.eq).toHaveBeenCalledWith("status", "paid");
    expect(paymentsQuery.gte).toHaveBeenCalledWith("date", "2026-06-01");
    expect(paymentsQuery.lte).toHaveBeenCalledWith("date", "2026-06-30");
    expect(result).toEqual([
      { apartmentId: "apartment-1", apartmentName: "Sunset Apartments", amount: 16000 },
      { apartmentId: "apartment-2", apartmentName: "Maple Residences", amount: 9000 },
    ]);
  });

  it("excludes apartments with no payments that month", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "apartments") {
        return createQuery({
          data: [{ id: "apartment-1", name: "Sunset Apartments" }],
          count: null,
          error: null,
        });
      }
      if (table === "payment") return createQuery({ data: [], count: null, error: null });
      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(fetchRevenueByProperty(LANDLORD_ID, 2026, 6)).resolves.toEqual([]);
  });
});

describe("fetchRentDues", () => {
  it("maps unpaid payments with apartment and tenant names, flagging overdue dues", async () => {
    const aptQuery = createQuery({
      data: [{ id: "apartment-1", name: "Sunset Apartments" }],
      count: null,
      error: null,
    });
    const paymentsQuery = createQuery({
      data: [
        {
          id: "payment-1",
          apartment_id: "apartment-1",
          due_date: "2026-07-05",
          amount: 12000,
          apartment: { name: "Sunset Apartments" },
          tenant: { first_name: "Juan", last_name: "Dela Cruz" },
        },
        {
          id: "payment-2",
          apartment_id: "apartment-1",
          due_date: "2026-09-10",
          amount: 12000,
          apartment: { name: "Sunset Apartments" },
          tenant: { first_name: "Maria", last_name: null },
        },
      ],
      count: null,
      error: null,
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "apartments") return aptQuery;
      if (table === "payment") return paymentsQuery;
      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await fetchRentDues(LANDLORD_ID);

    expect(paymentsQuery.neq).toHaveBeenCalledWith("status", "paid");
    expect(paymentsQuery.order).toHaveBeenCalledWith("due_date", { ascending: true });
    expect(result).toEqual([
      {
        id: "payment-1",
        apartmentId: "apartment-1",
        apartmentName: "Sunset Apartments",
        tenantName: "Juan Dela Cruz",
        dueDate: "2026-07-05",
        amount: 12000,
        isOverdue: true,
      },
      {
        id: "payment-2",
        apartmentId: "apartment-1",
        apartmentName: "Sunset Apartments",
        tenantName: "Maria",
        dueDate: "2026-09-10",
        amount: 12000,
        isOverdue: false,
      },
    ]);
  });
});
