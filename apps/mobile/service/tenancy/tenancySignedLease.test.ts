import { fetchTenancy } from "./tenancyService";

const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockRead = jest.fn();
const mockRpc = jest.fn();
jest.mock("@repo/supabase", () => ({ supabase: {
  from: (table: string) => {
    const query = {
      select: (columns: string) => { mockSelect(table, columns); return query; },
      eq: (column: string, value: string) => { mockEq(table, column, value); return query; },
      order: () => query, limit: () => query,
      maybeSingle: () => table === "tenancies" ? mockRead() : Promise.resolve({ data: null, error: null }),
    };
    return query;
  },
  rpc: (...args: unknown[]) => mockRpc(...args),
} }));

beforeEach(() => {
  jest.clearAllMocks();
  mockRpc.mockImplementation(async(name:string)=>name==='get_effective_lease_terms'
    ?{data:{leaseEnd:'2027-11-01',monthlyRent:12000,renewalAgreementPath:null},error:null}
    :{ data: { tenancyId: "tenancy" }, error: null });
});

it("keeps signed-lease metadata in one active-tenancy query and resolves effective renewal dates separately", async () => {
  mockRead.mockResolvedValue({ data: {
    id: "tenancy", signed_lease_path: "tenancy/lease.pdf", signed_lease_uploaded_at: "2026-11-01",
    tenant_acknowledged_at: "2026-11-02", apartment: { apartment_images: [] },
  }, error: null });
  const result = await fetchTenancy("tenant");
  expect(result).toMatchObject({ signed_lease_path: "tenancy/lease.pdf",
    signed_lease_uploaded_at: "2026-11-01", tenant_acknowledged_at: "2026-11-02",lease_end:'2027-11-01',monthly_rent:12000 });
  expect(mockRpc).toHaveBeenCalledWith('get_effective_lease_terms',{p_tenancy_id:'tenancy'});
  expect(mockSelect).toHaveBeenCalledWith("tenancies", expect.stringContaining("signed_lease_path"));
  expect(mockEq).toHaveBeenCalledWith("tenancies", "tenant_id", "tenant");
  expect(mockEq).toHaveBeenCalledWith("tenancies", "status", "active");
  expect(mockRead).toHaveBeenCalledTimes(1);
});

it("normalizes missing lease values to null without confusing a failed read with not uploaded", async () => {
  mockRead.mockResolvedValueOnce({ data: { id: "tenancy", apartment: { apartment_images: [] } }, error: null });
  expect(await fetchTenancy("tenant")).toMatchObject({ signed_lease_path: null,
    signed_lease_uploaded_at: null, tenant_acknowledged_at: null });
  mockRead.mockResolvedValueOnce({ data: null, error: { message: "offline" } });
  await expect(fetchTenancy("tenant")).rejects.toEqual({ message: "offline" });
});
