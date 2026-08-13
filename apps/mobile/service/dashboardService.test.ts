import { fetchDashboardStats } from "./dashboardService";

const LANDLORD_ID = "landlord-1";
const mockFrom = jest.fn();

type QueryResult = {
  data: { id: string }[] | null;
  count: number | null;
  error: Error | null;
};

interface QueryMock {
  select: jest.Mock;
  eq: jest.Mock;
  in: jest.Mock;
  is: jest.Mock;
  then: PromiseLike<QueryResult>["then"];
}

function createQuery(result: QueryResult): QueryMock {
  const query: QueryMock = {
    select: jest.fn(),
    eq: jest.fn(),
    in: jest.fn(),
    is: jest.fn(),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.is.mockReturnValue(query);

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
