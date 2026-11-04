import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMaintenanceDashboard } from "./useMaintenanceDashboard";

const mockFocus = jest.fn();
const mockUser = jest.fn();
const mockRequests = jest.fn();
const mockOverview = jest.fn();
jest.mock("expo-router", () => ({ useFocusEffect: (callback: () => void) => mockFocus(callback) }));
jest.mock("@/hooks/auth/useCurrentUser", () => ({ useCurrentUser: () => mockUser() }));
jest.mock("@/service/maintenance-requests/maintenanceDashboardService", () => ({
  fetchMaintenanceDashboardRequests: (...args: unknown[]) => mockRequests(...args),
  fetchMaintenanceOverview: (...args: unknown[]) => mockOverview(...args),
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockUser.mockReturnValue({ data: { id: "tenant", user_id: "auth" }, isPending: false });
  mockRequests.mockResolvedValue({ active: [], history: [] });
  mockOverview.mockResolvedValue({ activeCount: 0, unpaidFees: 0 });
});

it("keys both reads by account and rental and refreshes exact resources on focus", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const invalidate = jest.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result, unmount } = renderHook(() => useMaintenanceDashboard("apartment"), { wrapper });
  await waitFor(() => expect(result.current.overview.isSuccess).toBe(true));
  expect(mockRequests).toHaveBeenCalledWith("apartment", "tenant");
  expect(mockOverview).toHaveBeenCalledWith("apartment", "tenant");
  act(() => { mockFocus.mock.calls.at(-1)[0](); });
  for (const resource of ["maintenance-dashboard", "maintenance-overview"]) {
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [resource, "auth", "tenant", "apartment"], exact: true }, { cancelRefetch: false });
  }
  unmount(); client.clear();
});

it("does not fetch unidentified rentals or display an old account's cached requests", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result, rerender, unmount } = renderHook(() => useMaintenanceDashboard("apartment"), { wrapper });
  await waitFor(() => expect(result.current.requests.isSuccess).toBe(true));
  mockUser.mockReturnValue({ data: null, isPending: false });
  rerender({});
  expect(result.current.requests.data).toBeUndefined();
  expect(result.current.identityError).toMatch(/unavailable/);
  expect(mockRequests).toHaveBeenCalledTimes(1);
  unmount(); client.clear();
});

it("reuses the history resource without loading or refreshing financial overview on the full history page", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const invalidate = jest.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result, unmount } = renderHook(() => useMaintenanceDashboard("apartment", { includeOverview: false }), { wrapper });
  await waitFor(() => expect(result.current.requests.isSuccess).toBe(true));
  expect(mockOverview).not.toHaveBeenCalled();
  act(() => { mockFocus.mock.calls.at(-1)[0](); });
  expect(invalidate).toHaveBeenCalledTimes(1);
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["maintenance-dashboard", "auth", "tenant", "apartment"], exact: true }, { cancelRefetch: false });
  await act(async () => { await result.current.refresh(); });
  expect(mockOverview).not.toHaveBeenCalled();
  unmount(); client.clear();
});
