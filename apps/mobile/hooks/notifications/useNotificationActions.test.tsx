import { createElement, type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useNotificationActions } from "./useNotificationActions";

const mockMarkNotificationRead = jest.fn();
const mockMarkNotificationsRead = jest.fn();

jest.mock("@repo/supabase", () => ({ supabase: {} }));
jest.mock("@/hooks/auth", () => ({ useCurrentUser: () => ({ data: null }) }));
jest.mock("@/stores/usePortalStore", () => ({ usePortalStore: () => null }));
jest.mock("@/service/notifications/notificationService", () => ({
  markNotificationRead: (...args: unknown[]) => mockMarkNotificationRead(...args),
  markNotificationsRead: (...args: unknown[]) => mockMarkNotificationsRead(...args),
}));

const row = (id: string, is_read = false) => ({ id, is_read });
const tenantKey = ["notifications", "u", "tenant"];
const landlordKey = ["notifications", "u", "landlord"];

let cleanup: () => void = () => {};

function setup() {
  const client = new QueryClient({
    // No garbage-collection timers, so the test process exits cleanly.
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } },
  });
  // "shared" is an account-wide row, so both portals' feeds hold it.
  client.setQueryData(tenantKey, [row("t1"), row("shared")]);
  client.setQueryData(landlordKey, [row("l1"), row("shared")]);
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  const hook = renderHook(() => useNotificationActions("u"), { wrapper });
  const read = (key: string[]) => (client.getQueryData(key) as { id: string; is_read: boolean }[])
    .filter((n) => n.is_read).map((n) => n.id);
  cleanup = () => {
    hook.unmount();
    client.clear();
  };
  return { client, hook, read };
}

afterEach(() => cleanup());

beforeEach(() => {
  jest.clearAllMocks();
  mockMarkNotificationRead.mockResolvedValue(undefined);
  mockMarkNotificationsRead.mockResolvedValue(undefined);
});

describe("useNotificationActions", () => {
  it("marks exactly the given rows read, leaving the other portal's rows unread", async () => {
    const { hook, read } = setup();

    await act(async () => {
      await hook.result.current.markAllAsRead.mutateAsync(["t1", "shared"]);
    });

    expect(mockMarkNotificationsRead).toHaveBeenCalledWith(["t1", "shared"]);
    expect(read(tenantKey)).toEqual(["t1", "shared"]);
    // A shared row reads everywhere; a landlord-only row stays unread.
    expect(read(landlordKey)).toEqual(["shared"]);
  });

  it("puts every feed back when marking all read fails", async () => {
    mockMarkNotificationsRead.mockRejectedValue(new Error("offline"));
    const { hook, read } = setup();

    await act(async () => {
      await hook.result.current.markAllAsRead.mutateAsync(["t1", "shared"]).catch(() => undefined);
    });

    await waitFor(() => expect(read(tenantKey)).toEqual([]));
    expect(read(landlordKey)).toEqual([]);
  });

  it("marks one row read in the cached feeds that hold it", async () => {
    const { hook, read } = setup();

    await act(async () => {
      hook.result.current.markAsRead("shared");
    });

    await waitFor(() => expect(mockMarkNotificationRead).toHaveBeenCalledWith("shared"));
    await act(async () => {}); // let the mutation settle
    expect(read(tenantKey)).toEqual(["shared"]);
    expect(read(landlordKey)).toEqual(["shared"]);
  });
});
