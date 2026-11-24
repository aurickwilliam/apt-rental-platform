import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useReviewUnlock } from "./useReviewUnlock";
import { usePortalStore } from "@/stores/usePortalStore";

const mockFetch = jest.fn();
const mockMark = jest.fn();
jest.mock("@/service/ratings/reviewUnlockService", () => ({ fetchReviewUnlock: (...args: unknown[]) => mockFetch(...args) }));
jest.mock("@/service/ratings/reviewUnlockStorage", () => ({ markReviewUnlockSeen: (...args: unknown[]) => mockMark(...args) }));

const offer = { tenancyId: "stay-a", apartmentId: "apartment-a", apartmentName: "Cozy Cove" };
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}

beforeEach(() => {
  jest.clearAllMocks(); mockFetch.mockResolvedValue(offer); mockMark.mockResolvedValue(undefined);
  usePortalStore.setState({ authUserId: "auth-a", portal: "tenant", loading: false });
});

it("checks once, dismisses immediately, persists once and prevents duplicate actions", async () => {
  const { wrapper, client } = await setup();
  const { result, unmount } = await renderHook(() => useReviewUnlock("auth-a", "tenant-a", true), { wrapper });
  await waitFor(() => expect(result.current.candidate).toEqual(offer));
  const dismiss = result.current.dismiss;
  await act(() => { expect(dismiss(offer)).toBe(true); expect(dismiss(offer)).toBe(false); });
  expect(result.current.candidate).toBeNull();
  expect(mockMark).toHaveBeenCalledTimes(1);
  expect(mockMark).toHaveBeenCalledWith("auth-a", "stay-a");
  expect(mockFetch).toHaveBeenCalledTimes(1);
  await unmount(); client.clear();
});

it("does not query on other routes, loading portals, or the landlord portal", async () => {
  const { wrapper, client } = await setup();
  const { result, rerender, unmount } = await renderHook(({ enabled }: { enabled: boolean }) => useReviewUnlock("auth-a", "tenant-a", enabled), { wrapper, initialProps: { enabled: false } });
  expect(mockFetch).not.toHaveBeenCalled();
  usePortalStore.setState({ portal: "landlord" });
  await rerender({ enabled: true });
  expect(mockFetch).not.toHaveBeenCalled();
  expect(result.current.candidate).toBeNull();
  usePortalStore.setState({ portal: "tenant", loading: true });
  await rerender({ enabled: true });
  expect(mockFetch).not.toHaveBeenCalled();
  await unmount(); client.clear();
});

it("rejects late account reads and stale dismissal callbacks, even after switching back", async () => {
  let finish!: (value: typeof offer) => void;
  mockFetch.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const { wrapper, client } = await setup();
  const first = await renderHook(() => useReviewUnlock("auth-a", "tenant-a", true), { wrapper });
  const staleDismiss = first.result.current.dismiss;
  await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
  await first.unmount();
  usePortalStore.setState({ authUserId: "auth-b" });
  const next = await renderHook(() => useReviewUnlock("auth-b", "tenant-b", true), { wrapper });
  await waitFor(() => expect(next.result.current.candidate).toEqual(offer));
  await act(async () => { finish({ ...offer, apartmentName: "Old account" }); });
  expect(next.result.current.candidate?.apartmentName).toBe("Cozy Cove");
  usePortalStore.setState({ authUserId: "auth-a" });
  expect(staleDismiss(offer)).toBe(false);
  expect(mockMark).not.toHaveBeenCalled();
  await next.unmount(); client.clear();
});

it("fails quietly on eligibility errors and keeps in-memory dismissal if storage fails", async () => {
  const log = jest.spyOn(console, "warn").mockImplementation(() => {});
  const { wrapper, client } = await setup();
  mockFetch.mockRejectedValueOnce(new Error("private details"));
  const failed = await renderHook(() => useReviewUnlock("auth-a", "tenant-a", true), { wrapper });
  await waitFor(() => expect(log).toHaveBeenCalledWith("Could not check review prompt eligibility."));
  expect(failed.result.current.candidate).toBeNull();
  await failed.unmount(); client.clear();
  mockMark.mockRejectedValueOnce(new Error("private details"));
  const ready = await renderHook(() => useReviewUnlock("auth-a", "tenant-a", true), { wrapper });
  await waitFor(() => expect(ready.result.current.candidate).toEqual(offer));
  await act(async () => { ready.result.current.dismiss(offer); });
  expect(ready.result.current.candidate).toBeNull();
  expect(log).toHaveBeenLastCalledWith("Could not save review prompt dismissal.");
  await ready.unmount(); client.clear(); log.mockRestore();
});
