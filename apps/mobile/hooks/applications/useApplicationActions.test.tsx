import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { useApplicationActions } from "./useApplicationActions";
import { getLandlordApplicationsQueryKey } from "./useLandlordApplications";
import { createMobileQueryClient } from "@/utils/queryClient";

const APPLICATION_ID = "application-1";
const LANDLORD_ID = "landlord-1";
const mockUseCurrentUser = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockFrom = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('hooks/auth', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
  useProfile: () => ({ profile: { id: LANDLORD_ID }, loading: false }),
}));

jest.mock("@repo/supabase", () => ({
  supabase: {
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
  mockUseCurrentUser.mockReturnValue({
    data: { id: LANDLORD_ID },
    isLoading: false,
    error: null,
  });

  mockFrom.mockImplementation(() => ({
    update: (payload: unknown) => {
      mockUpdate(payload);
      return { eq: mockEq };
    },
  }));
  mockEq.mockResolvedValue({ error: null });
});

describe("useApplicationActions", () => {
  /** Validates: m8 — approve success invalidates the landlord-applications key */
  it("invalidates the landlord-applications query after a successful approve", async () => {
    const { client, QueryWrapper } = createWrapper();
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");

    const { result, unmount } = renderHook(
      () => useApplicationActions(APPLICATION_ID),
      { wrapper: QueryWrapper },
    );

    await act(async () => {
      await result.current.approve();
    });

    expect(mockUpdate).toHaveBeenCalledWith({ status: "approved" });
    expect(mockEq).toHaveBeenCalledWith("id", APPLICATION_ID);
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getLandlordApplicationsQueryKey(LANDLORD_ID),
        exact: true,
      }),
    );

    unmount();
    client.clear();
  });

  /** Validates: m8 — reject success invalidates the landlord-applications key */
  it("invalidates the landlord-applications query after a successful reject", async () => {
    const { client, QueryWrapper } = createWrapper();
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");

    const { result, unmount } = renderHook(
      () => useApplicationActions(APPLICATION_ID),
      { wrapper: QueryWrapper },
    );

    await act(async () => {
      await result.current.reject("Incomplete documents");
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      status: "rejected",
      rejected_reason: "Incomplete documents",
    });
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getLandlordApplicationsQueryKey(LANDLORD_ID),
        exact: true,
      }),
    );

    unmount();
    client.clear();
  });

  /** Validates: m8 — failed approve does not invalidate anything */
  it("does not invalidate when the update fails", async () => {
    mockEq.mockResolvedValue({ error: { message: "RLS blocked" } });
    const { client, QueryWrapper } = createWrapper();
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");

    const { result, unmount } = renderHook(
      () => useApplicationActions(APPLICATION_ID),
      { wrapper: QueryWrapper },
    );

    await act(async () => {
      await result.current.approve();
    });

    expect(result.current.errorMessage).toBe("RLS blocked");
    expect(invalidateSpy).not.toHaveBeenCalled();
    unmount();
    client.clear();
  });
});