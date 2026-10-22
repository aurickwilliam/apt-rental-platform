import { fetchPaymentMethodPreferences, savePaymentMethodPreferences } from "./paymentPreferencesService";

const mockFrom = jest.fn();
jest.mock("@repo/supabase", () => ({ supabase: { from: (...args: unknown[]) => mockFrom(...args) } }));

function chain(data: unknown, error: unknown = null) {
  const result = { data, error };
  const query = {
    select: jest.fn(), eq: jest.fn(), abortSignal: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn(),
    maybeSingle: jest.fn(async () => result), single: jest.fn(async () => result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  for (const method of [query.select, query.eq, query.abortSignal, query.insert, query.update, query.delete]) method.mockReturnValue(query);
  return query;
}

beforeEach(() => { jest.clearAllMocks(); });

it("reads only the account's preference fields and forwards cancellation", async () => {
  const query = chain({ saved_methods: ["gcash", "cash"], default_method: "cash" });
  mockFrom.mockReturnValue(query);
  const signal = new AbortController().signal;
  expect(await fetchPaymentMethodPreferences("user-1", signal)).toEqual({ savedMethods: ["GCash", "Cash"], defaultMethod: "Cash" });
  expect(mockFrom).toHaveBeenCalledTimes(1);
  expect(query.select).toHaveBeenCalledWith("saved_methods, default_method");
  expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
  expect(query.abortSignal).toHaveBeenCalledWith(signal);
});

it("returns empty preferences for an account without a row", async () => {
  mockFrom.mockReturnValue(chain(null));
  expect(await fetchPaymentMethodPreferences("user-1")).toEqual({ savedMethods: [], defaultMethod: null });
});

it("inserts method names and owner only when there is no existing row", async () => {
  const lookup = chain(null);
  const write = chain({ saved_methods: ["card"], default_method: "card" });
  mockFrom.mockReturnValueOnce(lookup).mockReturnValueOnce(write);
  expect(await savePaymentMethodPreferences("user-1", { savedMethods: ["Debit/Credit-Card"], defaultMethod: "Debit/Credit-Card" }))
    .toEqual({ savedMethods: ["Debit/Credit-Card"], defaultMethod: "Debit/Credit-Card" });
  expect(write.insert).toHaveBeenCalledWith({ user_id: "user-1", saved_methods: ["card"], default_method: "card" });
  expect(write.single).toHaveBeenCalledTimes(1);
  expect(write.update).not.toHaveBeenCalled();
  expect(mockFrom).toHaveBeenCalledTimes(2);
});

it("updates only editable columns and returns the canonical server row", async () => {
  const lookup = chain({ user_id: "user-1" });
  const write = chain({ saved_methods: ["maya"], default_method: "maya" });
  mockFrom.mockReturnValueOnce(lookup).mockReturnValueOnce(write);
  expect(await savePaymentMethodPreferences("user-1", { savedMethods: ["Maya", "Maya"], defaultMethod: "Maya" }))
    .toEqual({ savedMethods: ["Maya"], defaultMethod: "Maya" });
  expect(write.update).toHaveBeenCalledWith({ saved_methods: ["maya"], default_method: "maya", updated_at: expect.any(String) });
  expect(write.eq).toHaveBeenCalledWith("user_id", "user-1");
  expect(write.insert).not.toHaveBeenCalled();
});

it("clears all preferences with one account-scoped delete and no lookup", async () => {
  const query = chain(null);
  mockFrom.mockReturnValue(query);
  expect(await savePaymentMethodPreferences("user-1", { savedMethods: [], defaultMethod: null }))
    .toEqual({ savedMethods: [], defaultMethod: null });
  expect(query.delete).toHaveBeenCalledTimes(1);
  expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
  expect(query.maybeSingle).not.toHaveBeenCalled();
  expect(mockFrom).toHaveBeenCalledTimes(1);
});

it("propagates read and write failures rather than pretending preferences are empty or saved", async () => {
  mockFrom.mockReturnValueOnce(chain(null, { message: "Read failed" }));
  await expect(fetchPaymentMethodPreferences("user-1")).rejects.toEqual({ message: "Read failed" });
  mockFrom.mockReturnValueOnce(chain({ user_id: "user-1" })).mockReturnValueOnce(chain(null, { message: "Write denied" }));
  await expect(savePaymentMethodPreferences("user-1", { savedMethods: ["Cash"], defaultMethod: "Cash" }))
    .rejects.toEqual({ message: "Write denied" });
});
