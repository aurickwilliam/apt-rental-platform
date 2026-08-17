import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { useNotificationPreferences } from "./useNotificationPreferences";
import { createMobileQueryClient } from "@/utils/queryClient";

import type { NotificationPreferences } from "@/service/notificationService";

const USER_ID = "user-1";
const mockUseCurrentUser = jest.fn();
const mockFetchNotificationPreferences = jest.fn();
const mockUpdateNotificationPreferences = jest.fn();
let storedPreferences: NotificationPreferences | null = null;

jest.mock("@/hooks/auth", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

jest.mock("@/service/notificationService", () => ({
  DEFAULT_NOTIFICATION_PREFERENCES: {
    notifications_enabled: true,
    payment: true,
    message: true,
    maintenance: true,
    apartment: true,
    system: true,
  },
  fetchNotificationPreferences: (...args: unknown[]) =>
    mockFetchNotificationPreferences(...args),
  updateNotificationPreferences: (...args: unknown[]) =>
    mockUpdateNotificationPreferences(...args),
}));

function createWrapper() {
  const client = createMobileQueryClient();
  client.setDefaultOptions({ mutations: { gcTime: Infinity } });

  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  return { client, QueryWrapper };
}

beforeEach(() => {
  jest.clearAllMocks();
  storedPreferences = null;
  mockUseCurrentUser.mockReturnValue({
    data: { id: USER_ID },
    isLoading: false,
    error: null,
  });
  mockFetchNotificationPreferences.mockImplementation(() => Promise.resolve(storedPreferences));
  mockUpdateNotificationPreferences.mockImplementation(
    (_userId: string, next: NotificationPreferences) => {
      storedPreferences = next;
      return Promise.resolve(undefined);
    },
  );
});

describe("useNotificationPreferences", () => {
  it("returns defaults when the user has no preference row", async () => {
    const { client, QueryWrapper } = createWrapper();
    const { result, unmount } = renderHook(() => useNotificationPreferences(), {
      wrapper: QueryWrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.preferences).toEqual({
      notifications_enabled: true,
      payment: true,
      message: true,
      maintenance: true,
      apartment: true,
      system: true,
    });

    unmount();
    client.clear();
  });

  it("composes rapid toggles on the latest cached value", async () => {
    const { client, QueryWrapper } = createWrapper();
    const { result, unmount } = renderHook(() => useNotificationPreferences(), {
      wrapper: QueryWrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.setPreferences((prev) => ({ ...prev, payment: !prev.payment }));
    });

    await waitFor(() => expect(result.current.preferences.payment).toBe(false));

    await act(async () => {
      result.current.setPreferences((prev) => ({ ...prev, system: !prev.system }));
    });

    await waitFor(() => expect(mockUpdateNotificationPreferences).toHaveBeenCalledTimes(2));

    const firstPayload = mockUpdateNotificationPreferences.mock.calls[0]?.[1] as NotificationPreferences;
    const secondPayload = mockUpdateNotificationPreferences.mock.calls[1]?.[1] as NotificationPreferences;

    expect(firstPayload.payment).toBe(false);
    expect(firstPayload.system).toBe(true);

    expect(secondPayload.payment).toBe(false);
    expect(secondPayload.system).toBe(false);
    expect(secondPayload.notifications_enabled).toBe(true);

    unmount();
    client.clear();
  });
});