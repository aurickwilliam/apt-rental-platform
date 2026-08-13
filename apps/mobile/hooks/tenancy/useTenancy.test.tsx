import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import fc from "fast-check";

import { useTenancy } from "./useTenancy";
import { createMobileQueryClient } from "@/utils/queryClient";

const TENANT_ID = "tenant-1";
const TENANCY_ID = "tenancy-1";
const mockUseCurrentUser = jest.fn();
const mockFetchTenancy = jest.fn();
const mockRemoveChannel = jest.fn();
const mockChannel = jest.fn();
let tenancyChangeCallback: ((payload: { new?: unknown; old?: unknown; eventType?: string }) => void) | undefined;
let tenancyChangeFilter: string | undefined;
let paymentChangeCallback: ((payload: { new?: unknown; old?: unknown; eventType?: string }) => void) | undefined;
let paymentChangeFilter: string | undefined;

jest.mock("@/hooks/auth", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

jest.mock("@/service/tenancyService", () => ({
  fetchTenancy: (...args: unknown[]) => mockFetchTenancy(...args),
}));

jest.mock("@repo/supabase", () => ({
  supabase: {
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

function createWrapper() {
  const client = createMobileQueryClient();

  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  return { client, QueryWrapper };
}

beforeEach(() => {
  jest.clearAllMocks();
  tenancyChangeCallback = undefined;
  tenancyChangeFilter = undefined;
  paymentChangeCallback = undefined;
  paymentChangeFilter = undefined;
  mockUseCurrentUser.mockReturnValue({
    data: { id: TENANT_ID },
    isLoading: false,
    error: null,
  });
  mockFetchTenancy.mockResolvedValue({ id: TENANCY_ID, currentPayment: null });
  mockChannel.mockImplementation(() => {
    const channel = {
      on: jest.fn(),
      subscribe: jest.fn(),
    };

    channel.on.mockImplementation(
      (
        _event: string,
        filter: { table?: string; filter?: string },
        callback: (payload: { new?: unknown; old?: unknown }) => void,
      ) => {
        if (filter.table === "tenancies") {
          tenancyChangeCallback = callback;
          tenancyChangeFilter = filter.filter;
        }
        if (filter.table === "payment") {
          paymentChangeCallback = callback;
          paymentChangeFilter = filter.filter;
        }
        return channel;
      },
    );
    channel.subscribe.mockReturnValue(channel);

    return channel;
  });
});

describe("useTenancy", () => {
  /** Validates: Requirements 2.8, 2.17 */
  it("refetches a null tenancy query when a matching active tenancy is created", async () => {
    mockFetchTenancy.mockResolvedValueOnce(null);
    const { client, QueryWrapper } = createWrapper();
    const { result, unmount } = renderHook(() => useTenancy(), { wrapper: QueryWrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(tenancyChangeCallback).toBeDefined());
    expect(tenancyChangeFilter).toBe(`tenant_id=eq.${TENANT_ID}`);
    const fetchesBeforeEvent = mockFetchTenancy.mock.calls.length;

    await act(async () => {
      tenancyChangeCallback?.({
        new: { id: TENANCY_ID, tenant_id: TENANT_ID, status: "active" },
      });
    });

    await waitFor(() => expect(result.current.tenancy?.id).toBe(TENANCY_ID));
    expect(mockFetchTenancy).toHaveBeenCalledTimes(fetchesBeforeEvent + 1);

    unmount();
    client.clear();
  });

  /** Validates: Requirements 2.8, 2.17 */
  it("does not refetch the active tenancy for an unrelated tenancy event", async () => {
    const { client, QueryWrapper } = createWrapper();
    const { result, unmount } = renderHook(() => useTenancy(), { wrapper: QueryWrapper });

    await waitFor(() => expect(result.current.tenancy?.id).toBe(TENANCY_ID));
    await waitFor(() => expect(tenancyChangeCallback).toBeDefined());
    const fetchesBeforeEvent = mockFetchTenancy.mock.calls.length;

    await act(async () => {
      tenancyChangeCallback?.({ new: { id: "unrelated-tenancy" } });
    });

    expect(mockFetchTenancy).toHaveBeenCalledTimes(fetchesBeforeEvent);
    unmount();
    client.clear();
  });

  /** Validates: Requirements 2.8, 2.17 */
  it("Property 4: generated nonmatching tenancy events leave the exact query untouched", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid().filter((id) => id !== TENANCY_ID),
        async (unrelatedTenancyId) => {
          const { client, QueryWrapper } = createWrapper();
          mockFetchTenancy.mockClear();
          const { result, unmount } = renderHook(() => useTenancy(), {
            wrapper: QueryWrapper,
          });

          await waitFor(() => expect(result.current.tenancy?.id).toBe(TENANCY_ID));
          await waitFor(() => expect(tenancyChangeCallback).toBeDefined());
          const fetchesBeforeEvent = mockFetchTenancy.mock.calls.length;

          await act(async () => {
            tenancyChangeCallback?.({ new: { id: unrelatedTenancyId } });
          });

          expect(mockFetchTenancy).toHaveBeenCalledTimes(fetchesBeforeEvent);
          unmount();
          client.clear();
        },
      ),
      { numRuns: 10 },
    );
  });

  /** Validates: Gap 5 — payment INSERT merges via setQueryData without refetch */
  it("merges a newer payment event into the cached tenancy without refetching", async () => {
    const { client, QueryWrapper } = createWrapper();
    const { result, unmount } = renderHook(() => useTenancy(), { wrapper: QueryWrapper });

    await waitFor(() => expect(result.current.tenancy?.id).toBe(TENANCY_ID));
    await waitFor(() => expect(paymentChangeCallback).toBeDefined());
    expect(paymentChangeFilter).toBe(`tenancy_id=eq.${TENANCY_ID}`);
    const fetchesBeforeEvent = mockFetchTenancy.mock.calls.length;

    const payment = {
      id: "payment-1",
      amount: 10000,
      status: "paid",
      period_start: "2026-08-01",
      tenancy_id: TENANCY_ID,
    };

    await act(async () => {
      paymentChangeCallback?.({
        eventType: "INSERT",
        new: payment,
        old: null,
      });
    });

    await waitFor(() =>
      expect(result.current.tenancy?.currentPayment?.period_start).toBe("2026-08-01"),
    );
    expect(mockFetchTenancy).toHaveBeenCalledTimes(fetchesBeforeEvent);
    unmount();
    client.clear();
  });

  /** Validates: Gap 5 — recency gate ignores older-period payment events */
  it("ignores a payment event with an older period_start than the cached current payment", async () => {
    const { client, QueryWrapper } = createWrapper();
    const { result, unmount } = renderHook(() => useTenancy(), { wrapper: QueryWrapper });

    await waitFor(() => expect(result.current.tenancy?.id).toBe(TENANCY_ID));
    await waitFor(() => expect(paymentChangeCallback).toBeDefined());

    await act(async () => {
      paymentChangeCallback?.({
        eventType: "INSERT",
        new: {
          id: "payment-newer",
          amount: 10000,
          status: "paid",
          period_start: "2026-08-01",
          tenancy_id: TENANCY_ID,
        },
        old: null,
      });
    });
    await waitFor(() =>
      expect(result.current.tenancy?.currentPayment?.period_start).toBe("2026-08-01"),
    );

    await act(async () => {
      paymentChangeCallback?.({
        eventType: "UPDATE",
        new: {
          id: "payment-newer",
          amount: 9000,
          status: "paid",
          period_start: "2026-07-01",
          tenancy_id: TENANCY_ID,
        },
        old: null,
      });
    });

    // Recency gate: the older period must not overwrite the cached value.
    expect(result.current.tenancy?.currentPayment?.period_start).toBe("2026-08-01");
    expect(result.current.tenancy?.currentPayment?.amount).toBe(10000);
    unmount();
    client.clear();
  });

  /** Validates: Gap 5 — payment DELETE still invalidates (shape change) */
  it("refetches on a payment DELETE event", async () => {
    const { client, QueryWrapper } = createWrapper();
    const { result, unmount } = renderHook(() => useTenancy(), { wrapper: QueryWrapper });

    await waitFor(() => expect(result.current.tenancy?.id).toBe(TENANCY_ID));
    await waitFor(() => expect(paymentChangeCallback).toBeDefined());
    const fetchesBeforeEvent = mockFetchTenancy.mock.calls.length;

    await act(async () => {
      paymentChangeCallback?.({
        eventType: "DELETE",
        new: null,
        old: { id: "payment-1", tenancy_id: TENANCY_ID, period_start: "2026-08-01" },
      });
    });

    await waitFor(() =>
      expect(mockFetchTenancy.mock.calls.length).toBe(fetchesBeforeEvent + 1),
    );
    unmount();
    client.clear();
  });
});