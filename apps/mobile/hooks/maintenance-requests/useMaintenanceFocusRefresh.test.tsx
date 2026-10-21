import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import { useMaintenanceFocusRefresh } from "./useMaintenanceFocusRefresh";

const mockFocus = jest.fn();
jest.mock("expo-router", () => ({ useFocusEffect: (callback: () => void) => mockFocus(callback) }));
jest.mock("@/hooks/tenancy/useTenancy", () => ({ getTenancyQueryKey: (id: string) => ["tenancy", id] }));
jest.mock("./useMaintenanceRequestHistory", () => ({ getMaintenanceRequestHistoryQueryKey: (id: string) => ["maintenance-request-history", id] }));
jest.mock("./useMaintenanceRequests", () => ({ getLatestMaintenanceRequestQueryKey: (id: string) => ["maintenance-request-latest", id] }));

it("refreshes the exact maintenance and bill resources on screen focus without canceling an in-flight read", () => {
  const client = new QueryClient();
  const invalidate = jest.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { unmount } = renderHook(() => useMaintenanceFocusRefresh("apartment-1", "tenant-1"), { wrapper });
  act(() => { mockFocus.mock.calls.at(-1)[0](); });
  expect(invalidate).toHaveBeenCalledTimes(3);
  for (const key of [["maintenance-request-history", "apartment-1"], ["maintenance-request-latest", "apartment-1"], ["tenancy", "tenant-1"]]) {
    expect(invalidate).toHaveBeenCalledWith({ queryKey: key, exact: true }, { cancelRefetch: false });
  }
  unmount(); client.clear();
});

it("does not refresh unidentified resources", () => {
  const client = new QueryClient();
  const invalidate = jest.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { unmount } = renderHook(() => useMaintenanceFocusRefresh(), { wrapper });
  act(() => { mockFocus.mock.calls.at(-1)[0](); });
  expect(invalidate).not.toHaveBeenCalled();
  unmount(); client.clear();
});
