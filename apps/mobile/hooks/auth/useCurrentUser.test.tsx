import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import fc from "fast-check";

import { useCurrentUser, useCurrentUserId } from "./useCurrentUser";
import {
  CURRENT_USER_QUERY_KEY,
  clearQueryClient,
  createMobileQueryClient,
  queryClient,
  shouldRetryTransientRead,
} from "@/utils/queryClient";

const profileRecord = {
  id: "internal-user-1",
  user_id: "auth-user-1",
  first_name: "Current",
  last_name: "User",
  middle_name: null,
  email: "current@example.test",
  mobile_number: null,
  avatar_url: null,
  account_status: "active",
  background_url: null,
  role: "tenant",
  gender: null,
  birth_date: null,
  street_address: null,
  barangay: null,
  city: null,
  province: null,
  postal_code: null,
};

const mockGetUser = jest.fn();
const mockFrom = jest.fn();

function createUserQuery(result: { data: typeof profileRecord | null; error: Error | null }) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.single.mockResolvedValue(result);

  return query;
}

jest.mock("@repo/supabase", () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
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
  clearQueryClient();
  mockGetUser.mockResolvedValue({ data: { user: { id: "auth-user-1" } }, error: null });
  mockFrom.mockImplementation(() => createUserQuery({ data: profileRecord, error: null }));
});

afterEach(() => {
  clearQueryClient();
});

describe("useCurrentUser", () => {
  /** Validates: Requirements 2.1, 2.2 */
  it("shares one auth/profile request between simultaneous consumers", async () => {
    const { client, QueryWrapper } = createWrapper();
    const first = renderHook(() => useCurrentUser(), { wrapper: QueryWrapper });
    const second = renderHook(() => useCurrentUser(), { wrapper: QueryWrapper });

    await waitFor(() => expect(first.result.current.data?.id).toBe(profileRecord.id));
    await waitFor(() => expect(second.result.current.data?.id).toBe(profileRecord.id));

    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledTimes(1);

    first.unmount();
    second.unmount();
    client.clear();
  });

  /** Validates: Requirements 2.1, 2.2 */
  it("Property 1: all generated simultaneous consumers coalesce one current-user read", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 2, max: 4 }), async (consumerCount) => {
        const { client, QueryWrapper } = createWrapper();
        mockGetUser.mockClear();
        mockFrom.mockClear();

        const consumers = Array.from({ length: consumerCount }, () =>
          renderHook(() => useCurrentUser(), { wrapper: QueryWrapper }),
        );

        await Promise.all(
          consumers.map(({ result }) =>
            waitFor(() => expect(result.current.data?.id).toBe(profileRecord.id)),
          ),
        );

        expect(mockGetUser).toHaveBeenCalledTimes(1);
        expect(mockFrom).toHaveBeenCalledTimes(1);

        consumers.forEach(({ unmount }) => unmount());
        client.clear();
      }),
      { numRuns: 10 },
    );
  });

  /** Validates: Requirements 2.1, 3.2 */
  it("serves a warm current-user read without another request and refetches when explicitly requested", async () => {
    const { client, QueryWrapper } = createWrapper();
    const first = renderHook(() => useCurrentUser(), { wrapper: QueryWrapper });

    await waitFor(() => expect(first.result.current.data?.id).toBe(profileRecord.id));
    first.unmount();

    const second = renderHook(() => useCurrentUser(), { wrapper: QueryWrapper });
    await waitFor(() => expect(second.result.current.data?.id).toBe(profileRecord.id));

    expect(mockGetUser).toHaveBeenCalledTimes(1);

    await act(async () => {
      await second.result.current.refetch();
    });

    expect(mockGetUser).toHaveBeenCalledTimes(2);
    expect(mockFrom).toHaveBeenCalledTimes(2);

    second.unmount();
    client.clear();
  });

  /** Validates: Requirements 3.7 */
  it("exposes an initial read error without stale data and keeps the ID selector null-safe", async () => {
    mockFrom.mockImplementation(() =>
      createUserQuery({ data: null, error: new Error("Profile read failed") }),
    );
    const { client, QueryWrapper } = createWrapper();
    const user = renderHook(() => useCurrentUser(), { wrapper: QueryWrapper });
    const userId = renderHook(() => useCurrentUserId(), { wrapper: QueryWrapper });

    await waitFor(() => expect(user.result.current.isError).toBe(true));

    expect(user.result.current.data).toBeUndefined();
    expect(userId.result.current).toBeNull();
    expect(mockGetUser).toHaveBeenCalledTimes(1);

    user.unmount();
    userId.unmount();
    client.clear();
  });

  /** Validates: Requirements 2.1, 3.2 */
  it("clears a previous account's cached identity for sign-out or account switching", () => {
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, profileRecord);

    clearQueryClient();

    expect(queryClient.getQueryData(CURRENT_USER_QUERY_KEY)).toBeUndefined();
  });

  it("retries only one transient read failure", () => {
    expect(shouldRetryTransientRead(0, new TypeError("Network request failed"))).toBe(true);
    expect(shouldRetryTransientRead(1, new TypeError("Network request failed"))).toBe(false);
    expect(shouldRetryTransientRead(0, new Error("RLS denied"))).toBe(false);
  });
});
