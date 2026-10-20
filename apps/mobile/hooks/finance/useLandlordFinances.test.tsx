import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useFinanceIncomeMonths, useLandlordFinances } from "./useLandlordFinances";
import { usePortalStore } from "@/stores/usePortalStore";

const mockFetchFinances = jest.fn();
const mockSaveExpense = jest.fn();
let mockRoles = ["tenant", "admin", "landlord"];

jest.mock("@/hooks/auth", () => ({
  useCurrentUser: () => ({
    data: { id: "owner", user_id: "account", roles: mockRoles },
    isLoading: false,
  }),
}));
jest.mock("@/service/finance/financeService", () => ({
  fetchFinances: (...args: unknown[]) => mockFetchFinances(...args),
  saveExpense: (...args: unknown[]) => mockSaveExpense(...args),
}));

function setup() {
  const client = new QueryClient({ defaultOptions: {
    queries: { retry: false, gcTime: 0 },
    mutations: { gcTime: 0 },
  } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useLandlordFinances({ month: "2026-10", apartmentId: null }), { wrapper });
}

function setupIncomeMonths(apartmentId: string | null = null, isOpen = true) {
  const client = new QueryClient({ defaultOptions: {
    queries: { retry: false, gcTime: 0 },
    mutations: { gcTime: 0 },
  } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useFinanceIncomeMonths("2026-10", apartmentId, isOpen), { wrapper });
}

describe("landlord finance portal access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRoles = ["tenant", "admin", "landlord"];
    mockFetchFinances.mockResolvedValue({ properties: [] });
    usePortalStore.setState({ authUserId: "account", portal: "landlord", loading: false });
  });
  afterEach(() => act(() => usePortalStore.getState().reset()));

  it("loads finances for a mixed-role landlord in the landlord portal", async () => {
    const { result } = setup();
    await waitFor(() => expect(mockFetchFinances).toHaveBeenCalledTimes(1));
    expect(result.current.enabled).toBe(true);
    expect(result.current.ownerId).toBe("owner");
  });

  it("still supports a landlord-only profile", async () => {
    mockRoles = ["landlord"];
    const { result } = setup();
    await waitFor(() => expect(mockFetchFinances).toHaveBeenCalledTimes(1));
    expect(result.current.enabled).toBe(true);
  });

  it.each([{ roles: ["admin"] }, { roles: ["tenant"] }, { roles: ["admin", "tenant"] }])("denies $roles without landlord membership", ({ roles }) => {
    mockRoles = roles;
    const { result } = setup();
    expect(result.current.enabled).toBe(false);
    expect(result.current.ownerId).toBeNull();
    expect(mockFetchFinances).not.toHaveBeenCalled();
  });

  it("does not fetch or retry from the tenant portal", () => {
    usePortalStore.setState({ portal: "tenant" });
    const { result } = setup();
    result.current.retry();
    expect(result.current.enabled).toBe(false);
    expect(mockFetchFinances).not.toHaveBeenCalled();
  });

  it("rejects a stale portal belonging to a different account", () => {
    usePortalStore.setState({ authUserId: "another-account" });
    const { result } = setup();
    expect(result.current.enabled).toBe(false);
    expect(mockFetchFinances).not.toHaveBeenCalled();
  });

  it("stops finance mutations after switching to the tenant portal", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.enabled).toBe(true));
    act(() => usePortalStore.setState({ portal: "tenant" }));
    await act(async () => {
      await expect(result.current.removeExpense.mutateAsync("expense")).rejects.toThrow("Switch to your landlord portal");
    });
    expect(result.current.ownerId).toBeNull();
    expect(mockSaveExpense).not.toHaveBeenCalled();
  });
});

describe("finance month picker indicators", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRoles = ["tenant", "admin", "landlord"];
    usePortalStore.setState({ authUserId: "account", portal: "landlord", loading: false });
  });
  afterEach(() => act(() => usePortalStore.getState().reset()));

  it("uses the RPC month summary when the deployment provides one", async () => {
    mockFetchFinances.mockResolvedValue({
      properties: [],
      months: [],
      incomeMonths: [{ month: "2026-10", collected: 12000 }],
    });
    const { result } = setupIncomeMonths();
    await waitFor(() =>
      expect(result.current.data).toEqual([{ month: "2026-10", collected: 12000 }]),
    );
    expect(mockFetchFinances).toHaveBeenCalledTimes(1);
  });

  it("covers the picker from two cached reports on older deployments", async () => {
    mockFetchFinances.mockImplementation((scope: { month: string }) =>
      Promise.resolve({
        properties: [],
        months: [
          {
            month: scope.month,
            collected: scope.month === "2026-10" ? 500 : 900,
            operating: 0,
            capital: 0,
            reviewed: false,
          },
        ],
      }),
    );
    const { result } = setupIncomeMonths("villa");
    await waitFor(() => expect(result.current.data).toHaveLength(2));
    expect(mockFetchFinances).toHaveBeenCalledWith({ month: "2026-10", apartmentId: "villa" });
    expect(mockFetchFinances).toHaveBeenCalledWith({ month: "2025-10", apartmentId: "villa" });
    expect(result.current.data).toEqual([
      { month: "2025-10", collected: 900 },
      { month: "2026-10", collected: 500 },
    ]);
  });

  it("stays idle until the sheet opens for a landlord", async () => {
    mockFetchFinances.mockResolvedValue({ properties: [], months: [] });
    const closed = setupIncomeMonths(null, false);
    await act(async () => {});
    expect(mockFetchFinances).not.toHaveBeenCalled();
    closed.unmount();
    mockRoles = ["tenant"];
    const withoutRole = setupIncomeMonths();
    await act(async () => {});
    expect(withoutRole.result.current.data).toBeUndefined();
    expect(mockFetchFinances).not.toHaveBeenCalled();
  });
});
