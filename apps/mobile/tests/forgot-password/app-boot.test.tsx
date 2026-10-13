import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, render } from "@testing-library/react-native";

import Index from "@/app/index";

type AuthCallback = (event: string, session: { user: { id: string } } | null) => Promise<void>;

const mockReplace = jest.fn();
const mockFrom = jest.fn();
const mockAbandon = jest.fn();
let mockAuthCallback: AuthCallback | null = null;

jest.mock("expo-router", () => ({ router: { replace: (path: string) => mockReplace(path) } }));

jest.mock("@repo/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      signOut: jest.fn(),
      onAuthStateChange: (callback: AuthCallback) => {
        mockAuthCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      },
    },
  },
}));

jest.mock("@/service/auth/passwordRecoveryService", () => ({
  abandonUnfinishedPasswordRecovery: () => mockAbandon(),
}));

jest.mock("hooks/useTheme", () => ({ useTheme: () => ({ isDark: false }) }));

describe("App boot with a password reset", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    await AsyncStorage.setItem("hasLaunched", "true");
  });

  it("signs out an unfinished reset instead of restoring it into a portal", async () => {
    mockAbandon.mockResolvedValueOnce(true);
    render(<Index />);

    await act(async () => {
      await mockAuthCallback?.("INITIAL_SESSION", { user: { id: "auth-user" } });
    });

    expect(mockReplace).toHaveBeenCalledWith("/sign-in");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("boots normally when no reset was left unfinished", async () => {
    mockAbandon.mockResolvedValueOnce(false);
    render(<Index />);

    await act(async () => {
      await mockAuthCallback?.("INITIAL_SESSION", null);
    });

    expect(mockAbandon).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/sign-in");
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
