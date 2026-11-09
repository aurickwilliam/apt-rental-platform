import { renderHook, act } from "@testing-library/react-native";

import { useInAppNotificationBanner } from "./useInAppNotificationBanner";

const USER = "11111111-1111-4111-8111-111111111111";
const PEER = "22222222-2222-4222-8222-222222222222";
const APARTMENT = "33333333-3333-4333-8333-333333333333";

let mockRole: "tenant" | "landlord" = "tenant";
let mockOwnerId: string = PEER;
let capturedOnInsert: ((row: Record<string, unknown>) => void) | undefined;
const mockShowToast = jest.fn();

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }), usePathname: () => "/home" }));
jest.mock("heroui-native", () => ({ useToast: () => ({ toast: { show: jest.fn() } }) }));
jest.mock("@/components/display/NotificationToast", () => ({
  showNotificationToast: (...args: unknown[]) => mockShowToast(...args),
}));
jest.mock("@/hooks/auth", () => ({
  useCurrentUser: () => ({ data: { id: USER, user_id: "auth-1", roles: ["tenant", "landlord"] } }),
}));
jest.mock("@/hooks/notifications/useNotificationPreferences", () => ({
  useNotificationPreferences: () => ({
    loading: false,
    preferences: {
      notifications_enabled: true, show_chat_toasts: true,
      payment: true, message: true, maintenance: true, apartment: true, system: true,
    },
  }),
}));
jest.mock("@/hooks/notifications/useNotificationRealtime", () => ({
  useNotificationRealtime: (_userId: string | null, callbacks: { onInsert?: (row: Record<string, unknown>) => void }) => {
    capturedOnInsert = callbacks.onInsert;
  },
}));
jest.mock("@/service/notifications/notificationService", () => ({
  markNotificationRead: jest.fn(),
  resolveNotificationAudiences: async (rows: { data: { apartmentId?: string } }[]) =>
    rows.map((row) => ({
      ...row,
      resolvedChatAudience: row.data?.apartmentId ? (mockOwnerId === USER ? "landlord" : "tenant") : undefined,
    })),
}));
jest.mock("@/service/auth/portalPreference", () => ({ authorizedPortal: () => mockRole }));
jest.mock("@/stores/usePortalStore", () => ({
  usePortalStore: (select: (state: { portal: string; authUserId: string }) => unknown) =>
    select({ portal: mockRole, authUserId: "auth-1" }),
}));

const payment = (title: string) => ({
  id: title, user_id: USER, type: "payment", title, message: "", is_read: false,
  data: { screen: "payments" },
});
const chat = () => ({
  id: "chat", user_id: USER, type: "message", title: "Juan", message: "", is_read: false,
  data: { screen: "chat", senderId: PEER, apartmentId: APARTMENT },
});

async function receive(row: Record<string, unknown>) {
  await act(async () => {
    capturedOnInsert?.(row);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRole = "tenant";
  mockOwnerId = PEER;
  capturedOnInsert = undefined;
});

describe("useInAppNotificationBanner portal filtering", () => {
  it("toasts a notification the active portal shows", async () => {
    renderHook(() => useInAppNotificationBanner());

    await receive(payment("Payment Successful"));

    expect(mockShowToast).toHaveBeenCalledTimes(1);
  });

  it("stays silent for a notification only the other portal shows", async () => {
    renderHook(() => useInAppNotificationBanner());

    await receive(payment("Payment Received"));

    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it("toasts apartment chat only in the portal that owns the conversation", async () => {
    const tenant = renderHook(() => useInAppNotificationBanner());
    await receive(chat());
    expect(mockShowToast).toHaveBeenCalledTimes(1);
    tenant.unmount();

    mockShowToast.mockClear();
    mockRole = "landlord";
    renderHook(() => useInAppNotificationBanner());
    await receive(chat());
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
