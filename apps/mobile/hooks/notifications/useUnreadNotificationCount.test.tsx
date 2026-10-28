import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useUnreadNotificationCount } from "./useUnreadNotificationCount";

let mockProfile: { id: string; roles: string[]; account_status: string };
let mockPortal: "tenant" | "landlord";

jest.mock("@/hooks/auth", () => ({ useCurrentUser: () => ({ data: mockProfile }) }));
jest.mock("@/stores/usePortalStore", () => ({
  usePortalStore: (select: (state: { portal: string }) => unknown) => select({ portal: mockPortal }),
}));
jest.mock("@/hooks/notifications/useNotificationRealtime", () => ({ useNotificationRealtime: jest.fn() }));
jest.mock("@/service/notifications/notificationService", () => ({
  fetchUnreadNotificationCount: jest.fn().mockResolvedValue(4),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useUnreadNotificationCount", () => {
  it("shows no landlord badge while an unverified landlord's portal is closed", async () => {
    mockProfile = { id: "u1", roles: ["landlord"], account_status: "unverified" };
    mockPortal = "landlord";
    const { result } = renderHook(() => useUnreadNotificationCount(), { wrapper });
    await waitFor(() => expect(result.current.unreadCount).toBe(0));
  });

  it("keeps the count for verified landlords and for the tenant portal", async () => {
    mockProfile = { id: "u1", roles: ["landlord"], account_status: "verified" };
    mockPortal = "landlord";
    const verified = renderHook(() => useUnreadNotificationCount(), { wrapper });
    await waitFor(() => expect(verified.result.current.unreadCount).toBe(4));

    mockProfile = { id: "u1", roles: ["landlord", "tenant"], account_status: "unverified" };
    mockPortal = "tenant";
    const tenantSide = renderHook(() => useUnreadNotificationCount(), { wrapper });
    await waitFor(() => expect(tenantSide.result.current.unreadCount).toBe(4));
  });
});
