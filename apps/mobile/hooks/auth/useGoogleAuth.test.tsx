import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useGoogleAuth } from "./useGoogleAuth";

const mockReplace = jest.fn();
const mockOpenAuthSessionAsync = jest.fn();
const mockExchangeCodeForSession = jest.fn();
const mockSignOut = jest.fn();
const mockSingle = jest.fn();
const mockRestore = jest.fn();
const mockGetStatus = jest.fn();

jest.mock("expo-router", () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock("expo-linking", () => ({
  createURL: () => "apt://auth/callback",
  addEventListener: () => ({ remove: jest.fn() }),
}));
jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: (...args: unknown[]) => mockOpenAuthSessionAsync(...args),
}));
jest.mock("@repo/supabase", () => ({
  supabase: {
    auth: {
      signInWithOAuth: jest.fn().mockResolvedValue({ data: { url: "https://accounts.example.test" }, error: null }),
      exchangeCodeForSession: (...args: unknown[]) => mockExchangeCodeForSession(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
    from: () => ({ select: () => ({ eq: () => ({ single: () => mockSingle() }) }) }),
    rpc: jest.fn(),
  },
}));
jest.mock("@/service/auth/suspensionService", () => ({
  ...jest.requireActual("@/service/auth/suspensionService"),
  getMySuspensionStatus: (...args: unknown[]) => mockGetStatus(...args),
}));
jest.mock("@/stores/usePortalStore", () => ({
  usePortalStore: { getState: () => ({ restore: (...args: unknown[]) => mockRestore(...args) }) },
}));

const session = { user: { id: "account-a", email: "a@example.test", user_metadata: { full_name: "A Person" } } };

describe("Google sign-in without a role tab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenAuthSessionAsync.mockResolvedValue({ type: "success", url: "apt://auth/callback?code=code-1" });
    mockExchangeCodeForSession.mockResolvedValue({ data: { session }, error: null });
    mockSignOut.mockResolvedValue({ error: null });
    mockGetStatus.mockResolvedValue({ suspended: false, reason: null });
  });

  it("signs out a suspended account and shows the reason", async () => {
    mockGetStatus.mockResolvedValue({ suspended: true, reason: "Spam" });

    const { result } = renderHook(() => useGoogleAuth());
    await act(async () => { await result.current.signInWithGoogle(); });

    expect(mockSignOut).toHaveBeenCalled();
    expect(result.current.errorTitle).toBe("Account suspended");
    expect(result.current.error).toContain("Reason: Spam");
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockSingle).not.toHaveBeenCalled();
  });

  it("shows the redirect error description when Google sign-in fails", async () => {
    mockOpenAuthSessionAsync.mockResolvedValue({
      type: "success",
      url: "apt://auth/callback?error_code=server_error&error_description=Something+broke",
    });

    const { result } = renderHook(() => useGoogleAuth());
    await act(async () => { await result.current.signInWithGoogle(); });

    expect(result.current.error).toBe("Something broke");
    expect(result.current.errorTitle).toBeUndefined();
  });

  it("restores the saved portal for a completed dual-role account", async () => {
    mockSingle.mockResolvedValue({ data: { roles: ["tenant", "landlord"], mobile_number: "09123456789" }, error: null });
    mockRestore.mockResolvedValue("landlord");

    const { result } = renderHook(() => useGoogleAuth());
    await act(async () => { await result.current.signInWithGoogle(); });

    expect(mockRestore).toHaveBeenCalledWith("account-a", ["tenant", "landlord"]);
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(landlord)/dashboard");
  });

  it("ignores sign-up role selection for an already completed Google account", async () => {
    mockSingle.mockResolvedValue({ data: { roles: ["tenant", "landlord"], mobile_number: "09123456789" }, error: null });
    mockRestore.mockResolvedValue("tenant");

    const { result } = renderHook(() => useGoogleAuth());
    await act(async () => { await result.current.signInWithGoogle("landlord"); });

    expect(mockRestore).toHaveBeenCalledWith("account-a", ["tenant", "landlord"]);
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(tenant)/rentals");
  });

  it("defers role choice to profile onboarding for an incomplete Google account", async () => {
    mockSingle.mockResolvedValue({ data: { roles: ["landlord"], mobile_number: null }, error: null });

    const { result } = renderHook(() => useGoogleAuth());
    await act(async () => { await result.current.signInWithGoogle(); });

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith({
      pathname: "../(auth)/auth-complete-profile",
      params: {
        email: "a@example.test",
        suggestedRole: "landlord",
        firstName: "A",
        lastName: "Person",
      },
    }));
    expect(mockRestore).not.toHaveBeenCalled();
  });

  it("keeps the role chosen on sign-up for incomplete Google onboarding", async () => {
    mockSingle.mockResolvedValue({ data: { roles: ["tenant"], mobile_number: null }, error: null });

    const { result } = renderHook(() => useGoogleAuth());
    await act(async () => { await result.current.signInWithGoogle("landlord"); });

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(expect.objectContaining({
      params: expect.objectContaining({ userSide: "landlord", suggestedRole: "tenant" }),
    })));
  });

  it("does not allow an admin profile into the mobile app", async () => {
    mockSingle.mockResolvedValue({ data: { roles: ["admin", "tenant"], mobile_number: "09123456789" }, error: null });

    const { result } = renderHook(() => useGoogleAuth());
    await act(async () => { await result.current.signInWithGoogle(); });

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockRestore).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
