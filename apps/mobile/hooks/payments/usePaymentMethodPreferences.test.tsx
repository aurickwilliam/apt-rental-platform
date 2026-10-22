import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { getPaymentMethodPreferencesQueryKey, usePaymentMethodPreferences } from "./usePaymentMethodPreferences";
import type { PaymentMethodPreference } from "@repo/utils";

const mockFetch = jest.fn();
const mockSave = jest.fn();
const mockFocus = jest.fn();
jest.mock("@/service/payments/paymentPreferencesService", () => ({
  fetchPaymentMethodPreferences: (...args: unknown[]) => mockFetch(...args),
  savePaymentMethodPreferences: (...args: unknown[]) => mockSave(...args),
}));
jest.mock("expo-router", () => ({ useFocusEffect: (callback: () => void) => {
  const { useEffect } = jest.requireActual<typeof import("react")>("react");
  mockFocus(callback);
  useEffect(callback, [callback]);
} }));

const CASH: PaymentMethodPreference = { savedMethods: ["Cash"], defaultMethod: "Cash" };
const MAYA: PaymentMethodPreference = { savedMethods: ["Maya"], defaultMethod: "Maya" };

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockImplementation(async (id: string) => id === "user-1" ? CASH : MAYA);
  mockSave.mockImplementation(async (_id: string, next: PaymentMethodPreference) => next);
});

it("deduplicates concurrent consumers and reuses fresh preferences on focus", async () => {
  const { client, wrapper } = setup();
  const first = renderHook(() => usePaymentMethodPreferences("user-1"), { wrapper });
  const second = renderHook(() => usePaymentMethodPreferences("user-1"), { wrapper });
  await waitFor(() => expect(first.result.current.hasLoaded && second.result.current.hasLoaded).toBe(true));
  expect(mockFetch).toHaveBeenCalledTimes(1);
  act(() => { mockFocus.mock.calls.at(-1)[0](); });
  expect(mockFetch).toHaveBeenCalledTimes(1);
  expect(second.result.current.preferences).toEqual(CASH);
  first.unmount(); second.unmount(); client.clear();
});

it("updates all consumers from the returned row without a post-save fetch", async () => {
  const { client, wrapper } = setup();
  const first = renderHook(() => usePaymentMethodPreferences("user-1"), { wrapper });
  const second = renderHook(() => usePaymentMethodPreferences("user-1"), { wrapper });
  await waitFor(() => expect(first.result.current.hasLoaded).toBe(true));
  const reads = mockFetch.mock.calls.length;
  await act(async () => { expect(await first.result.current.save(MAYA)).toEqual(MAYA); });
  await waitFor(() => expect(second.result.current.preferences).toEqual(MAYA));
  expect(mockSave).toHaveBeenCalledWith("user-1", MAYA);
  expect(mockFetch).toHaveBeenCalledTimes(reads);
  first.unmount(); second.unmount(); client.clear();
});

it("refreshes a stale preference on focus to pick up Web changes", async () => {
  const { client, wrapper } = setup();
  const { result, unmount } = renderHook(() => usePaymentMethodPreferences("user-1"), { wrapper });
  await waitFor(() => expect(result.current.hasLoaded).toBe(true));
  client.setQueryData(getPaymentMethodPreferencesQueryKey("user-1"), CASH, { updatedAt: Date.now() - 31_000 });
  mockFetch.mockResolvedValueOnce(MAYA);
  act(() => { mockFocus.mock.calls.at(-1)[0](); });
  await waitFor(() => expect(result.current.preferences).toEqual(MAYA));
  expect(mockFetch).toHaveBeenCalledTimes(2);
  unmount(); client.clear();
});

it("does not expose an old account's late read after switching accounts", async () => {
  let finish!: (value: PaymentMethodPreference) => void;
  mockFetch.mockImplementation((id: string) => id === "user-1"
    ? new Promise<PaymentMethodPreference>((resolve) => { finish = resolve; }) : Promise.resolve(MAYA));
  const { client, wrapper } = setup();
  const { result, rerender, unmount } = renderHook(({ userId }: { userId: string }) => usePaymentMethodPreferences(userId), { wrapper, initialProps: { userId: "user-1" } });
  await waitFor(() => expect(mockFetch).toHaveBeenCalled());
  rerender({ userId: "user-2" });
  await waitFor(() => expect(result.current.preferences).toEqual(MAYA));
  await act(async () => { finish(CASH); });
  expect(result.current.preferences).toEqual(MAYA);
  unmount(); client.clear();
});

it("shares pending save state and prevents duplicate writes across consumers", async () => {
  let finish!: (value: PaymentMethodPreference) => void;
  mockSave.mockImplementation(() => new Promise<PaymentMethodPreference>((resolve) => { finish = resolve; }));
  const { client, wrapper } = setup();
  const first = renderHook(() => usePaymentMethodPreferences("user-1"), { wrapper });
  const second = renderHook(() => usePaymentMethodPreferences("user-1"), { wrapper });
  await waitFor(() => expect(first.result.current.hasLoaded).toBe(true));
  let pending!: Promise<PaymentMethodPreference>;
  await act(async () => { pending = first.result.current.save(MAYA); });
  await waitFor(() => expect(second.result.current.isSaving).toBe(true));
  await act(async () => { await expect(second.result.current.save(CASH)).rejects.toThrow("already being saved"); });
  expect(mockSave).toHaveBeenCalledTimes(1);
  await act(async () => { finish(MAYA); await pending; });
  first.unmount(); second.unmount(); client.clear();
});

it("keeps the previous preference after a failed save", async () => {
  mockSave.mockRejectedValue(new Error("Write denied"));
  const { client, wrapper } = setup();
  const { result, unmount } = renderHook(() => usePaymentMethodPreferences("user-1"), { wrapper });
  await waitFor(() => expect(result.current.hasLoaded).toBe(true));
  await act(async () => { await expect(result.current.save(MAYA)).rejects.toThrow("Write denied"); });
  expect(result.current.preferences).toEqual(CASH);
  unmount(); client.clear();
});

it("exposes loading failure separately from an empty saved preference and supports retry", async () => {
  mockFetch.mockRejectedValueOnce(new Error("Offline"));
  const { client, wrapper } = setup();
  const { result, unmount } = renderHook(() => usePaymentMethodPreferences("user-1"), { wrapper });
  await waitFor(() => expect(result.current.error).not.toBeNull());
  expect(result.current.hasLoaded).toBe(false);
  await act(async () => { await result.current.refetch(); });
  await waitFor(() => expect(result.current.hasLoaded).toBe(true));
  expect(result.current.error).toBeNull();
  unmount(); client.clear();
});

it("isolates accounts and rejects a previous account's late save", async () => {
  let finish!: (value: PaymentMethodPreference) => void;
  mockSave.mockImplementation(() => new Promise<PaymentMethodPreference>((resolve) => { finish = resolve; }));
  const { client, wrapper } = setup();
  const { result, rerender, unmount } = renderHook(({ userId }: { userId: string }) => usePaymentMethodPreferences(userId), { wrapper, initialProps: { userId: "user-1" } });
  await waitFor(() => expect(result.current.hasLoaded).toBe(true));
  let pending!: Promise<PaymentMethodPreference>;
  await act(async () => { pending = result.current.save({ savedMethods: ["GCash"], defaultMethod: "GCash" }); });
  await waitFor(() => expect(mockSave).toHaveBeenCalled());
  rerender({ userId: "user-2" });
  await waitFor(() => expect(result.current.preferences).toEqual(MAYA));
  await act(async () => {
    finish({ savedMethods: ["GCash"], defaultMethod: "GCash" });
    await expect(pending).rejects.toThrow("account changed");
  });
  expect(client.getQueryData(getPaymentMethodPreferencesQueryKey("user-2"))).toEqual(MAYA);
  expect(client.getQueryData(getPaymentMethodPreferencesQueryKey("user-1"))).not.toEqual({ savedMethods: ["GCash"], defaultMethod: "GCash" });
  unmount(); client.clear();
});

it("does not repopulate a cleared cache from a late save", async () => {
  let finish!: (value: PaymentMethodPreference) => void;
  mockSave.mockImplementation(() => new Promise<PaymentMethodPreference>((resolve) => { finish = resolve; }));
  const { client, wrapper } = setup();
  const { result, unmount } = renderHook(() => usePaymentMethodPreferences("user-1"), { wrapper });
  await waitFor(() => expect(result.current.hasLoaded).toBe(true));
  let pending!: Promise<PaymentMethodPreference>;
  await act(async () => { pending = result.current.save(MAYA); });
  await waitFor(() => expect(mockSave).toHaveBeenCalled());
  unmount();
  client.clear();
  await act(async () => { finish(MAYA); await expect(pending).rejects.toThrow("account changed"); });
  expect(client.getQueryData(getPaymentMethodPreferencesQueryKey("user-1"))).toBeUndefined();
});

it("does not read or save when signed out", async () => {
  const { client, wrapper } = setup();
  const { result, unmount } = renderHook(() => usePaymentMethodPreferences(null), { wrapper });
  expect(mockFetch).not.toHaveBeenCalled();
  await act(async () => { await expect(result.current.save(CASH)).rejects.toThrow("sign in"); });
  expect(mockSave).not.toHaveBeenCalled();
  unmount(); client.clear();
});
