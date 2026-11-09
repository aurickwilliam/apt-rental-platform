import { renderHook } from "@testing-library/react-native";

import { useNotifications } from "./useNotifications";

let mockPortal: "tenant" | "landlord" | null = "tenant";
let mockUserError: Error | null = null;
const mockUseQuery = jest.fn();
const mockFetchPortalNotifications = jest.fn();

const feed = [
  { id: "a", is_read: false },
  { id: "b", is_read: true },
  { id: "c", is_read: false },
];

jest.mock("@tanstack/react-query", () => ({
  useQuery: (options: unknown) => mockUseQuery(options),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock("@/hooks/auth", () => ({
  useCurrentUser: () => ({
    data: { id: "u", user_id: "auth-1", roles: ["tenant", "landlord"] },
    isLoading: false,
    error: mockUserError,
  }),
}));
jest.mock("@/hooks/notifications/useNotificationRealtime", () => ({ useNotificationRealtime: jest.fn() }));
jest.mock("@/service/notifications/notificationService", () => ({
  fetchPortalNotifications: (...args: unknown[]) => mockFetchPortalNotifications(...args),
}));
jest.mock("@/stores/usePortalStore", () => ({
  usePortalStore: (select: (state: { portal: string | null; authUserId: string }) => unknown) =>
    select({ portal: mockPortal, authUserId: "auth-1" }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockPortal = "tenant";
  mockUserError = null;
  mockUseQuery.mockReturnValue({ data: feed, isLoading: false, error: null, refetch: jest.fn() });
});

describe("useNotifications", () => {
  it("counts the unread rows of the portal feed", () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.notifications).toHaveLength(3);
    expect(result.current.unreadIds).toEqual(["a", "c"]);
    expect(result.current.unreadCount).toBe(2);
  });

  it("keeps a separate cached feed per portal", () => {
    renderHook(() => useNotifications());
    expect(mockUseQuery.mock.calls[0][0].queryKey).toEqual(["notifications", "u", "tenant"]);

    mockPortal = "landlord";
    renderHook(() => useNotifications());
    expect(mockUseQuery.mock.calls[1][0].queryKey).toEqual(["notifications", "u", "landlord"]);
  });

  it("loads that portal's feed through the service", () => {
    mockPortal = "landlord";
    renderHook(() => useNotifications());

    const options = mockUseQuery.mock.calls[0][0];
    options.queryFn();

    expect(options.enabled).toBe(true);
    expect(mockFetchPortalNotifications).toHaveBeenCalledWith("u", "landlord");
  });

  it("does not fetch, and never reports loading, while the portal is unknown", () => {
    mockPortal = null;
    mockUserError = new Error("profile failed");
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, error: null, refetch: jest.fn() });

    const { result } = renderHook(() => useNotifications());

    expect(mockUseQuery.mock.calls[0][0].enabled).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("profile failed");
    expect(result.current.notifications).toEqual([]);
  });
});
