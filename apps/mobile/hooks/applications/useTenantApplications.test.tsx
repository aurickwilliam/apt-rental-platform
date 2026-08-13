import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { useTenantApplications } from "./useTenantApplications";
import { createMobileQueryClient } from "@/utils/queryClient";

const TENANT_ID = "tenant-1";
const mockUseCurrentUser = jest.fn();
const mockFetchTenantApplications = jest.fn();

jest.mock("hooks/auth", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
  useProfile: () => ({ profile: { id: TENANT_ID }, loading: false }),
}));

jest.mock("@/service/tenantApplicationsService", () => ({
  fetchTenantApplications: (...args: unknown[]) => mockFetchTenantApplications(...args),
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
  mockUseCurrentUser.mockReturnValue({
    data: { id: TENANT_ID },
    isLoading: false,
    error: null,
  });
  mockFetchTenantApplications.mockResolvedValue([]);
});

describe("useTenantApplications", () => {
  it("fetches applications with the tenant-scoped keyed query", async () => {
    mockFetchTenantApplications.mockResolvedValue([
      { id: "application-1", status: "pending", documents: [] },
    ]);
    const { QueryWrapper } = createWrapper();

    const { result, unmount } = renderHook(() => useTenantApplications(), {
      wrapper: QueryWrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetchTenantApplications).toHaveBeenCalledWith(TENANT_ID);
    expect(result.current.applications[0]?.id).toBe("application-1");
    expect(result.current.error).toBeNull();

    unmount();
  });

  it("does not fetch before the current user resolves", async () => {
    mockUseCurrentUser.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });
    const { QueryWrapper } = createWrapper();

    const { result, unmount } = renderHook(() => useTenantApplications(), {
      wrapper: QueryWrapper,
    });

    expect(mockFetchTenantApplications).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);

    unmount();
  });

  it("surfaces a fetch failure as an error message", async () => {
    mockFetchTenantApplications.mockRejectedValue(new Error("RLS blocked"));
    const { QueryWrapper } = createWrapper();

    const { result, unmount } = renderHook(() => useTenantApplications(), {
      wrapper: QueryWrapper,
    });

    await waitFor(() => expect(result.current.error).toBe("RLS blocked"));
    expect(result.current.applications).toEqual([]);

    unmount();
  });
});
