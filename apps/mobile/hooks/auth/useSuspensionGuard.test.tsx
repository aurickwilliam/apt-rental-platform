import { renderHook, waitFor } from "@testing-library/react-native";

import { useSuspensionStore } from "@/stores/useSuspensionStore";
import { useSuspensionGuard } from "./useSuspensionGuard";

const mockReplace = jest.fn();
const mockGetSession = jest.fn();
const mockSignOut = jest.fn();
const mockGetStatus = jest.fn();
const mockClearQueryClient = jest.fn();
let appStateListener: ((state: string) => void) | undefined;

jest.mock("expo-router", () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock("react-native", () => ({
  AppState: {
    addEventListener: (_event: string, listener: (state: string) => void) => {
      appStateListener = listener;
      return { remove: jest.fn() };
    },
  },
}));
jest.mock("@repo/supabase", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
  },
}));
jest.mock("@/service/auth/suspensionService", () => ({
  getMySuspensionStatus: (...args: unknown[]) => mockGetStatus(...args),
}));
jest.mock("@/utils/queryClient", () => ({ clearQueryClient: () => mockClearQueryClient() }));

describe("useSuspensionGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSuspensionStore.getState().reset();
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "a" } } } });
    mockSignOut.mockResolvedValue({ error: null });
  });

  it("signs out a suspended account and leaves the reason for the sign-in screen", async () => {
    mockGetStatus.mockResolvedValue({ suspended: true, reason: "Spam" });

    renderHook(() => useSuspensionGuard());

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/(auth)/sign-in"));
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockClearQueryClient).toHaveBeenCalled();
    expect(useSuspensionStore.getState().notice).toEqual({ reason: "Spam" });
  });

  it("does nothing for an active account", async () => {
    mockGetStatus.mockResolvedValue({ suspended: false, reason: null });

    renderHook(() => useSuspensionGuard());

    await waitFor(() => expect(mockGetStatus).toHaveBeenCalledTimes(1));
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("skips the check when nobody is signed in", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    renderHook(() => useSuspensionGuard());

    await waitFor(() => expect(mockGetSession).toHaveBeenCalled());
    expect(mockGetStatus).not.toHaveBeenCalled();
  });

  it("checks again when the app returns to the foreground", async () => {
    mockGetStatus.mockResolvedValue({ suspended: false, reason: null });

    renderHook(() => useSuspensionGuard());
    await waitFor(() => expect(mockGetStatus).toHaveBeenCalledTimes(1));

    appStateListener?.("active");
    await waitFor(() => expect(mockGetStatus).toHaveBeenCalledTimes(2));
  });
});
