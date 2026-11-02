import { fetchAcceptedMethodsForApartment } from "./acceptedMethodsService";

const mockRpc = jest.fn();
jest.mock("@repo/supabase", () => ({ supabase: { rpc: (...args: unknown[]) => mockRpc(...args) } }));

function rpcResult(data: unknown, error: unknown = null) {
  const result = { data, error };
  const query = { abortSignal: jest.fn(), then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve) };
  query.abortSignal.mockReturnValue(query);
  return query;
}

beforeEach(() => { jest.clearAllMocks(); });

it("reads the apartment's accepted methods in the app's order, passing only the apartment id", async () => {
  mockRpc.mockReturnValue(rpcResult(["cash", "gcash"]));
  expect(await fetchAcceptedMethodsForApartment("apt-1")).toEqual(["GCash", "Cash"]);
  expect(mockRpc).toHaveBeenCalledWith("get_apartment_accepted_methods", { p_apartment_id: "apt-1" });
});

it("returns null when the listing is not publicly readable, rather than every method", async () => {
  mockRpc.mockReturnValue(rpcResult(null));
  expect(await fetchAcceptedMethodsForApartment("hidden")).toBeNull();
});

it("surfaces a failed read so the section can simply stay out", async () => {
  mockRpc.mockReturnValue(rpcResult(null, new Error("network")));
  await expect(fetchAcceptedMethodsForApartment("apt-1")).rejects.toThrow("network");
});
