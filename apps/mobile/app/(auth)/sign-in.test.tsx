import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import SignIn from "./sign-in";
import { saveServerLockout } from "@/service/auth/authLockoutStore";
import { useSuspensionStore } from "@/stores/useSuspensionStore";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockResend = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockSignOut = jest.fn();
const mockSingle = jest.fn();
const mockRestore = jest.fn();
const mockGetStatus = jest.fn();
const mockErrorDialog = jest.fn();
const mockLockoutDialog = jest.fn();

jest.mock("expo-router", () => ({ useRouter: () => ({ replace: mockReplace, push: mockPush }) }));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("constants/images", () => ({ IMAGES: { logo: "logo.png", googleLogo: "google.png" } }));
jest.mock("components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return function MockScreenWrapper({ children }: { children: React.ReactNode }) { return <View>{children}</View>; };
});
jest.mock("./components/AuthDivider", () => () => null);
jest.mock("./components/AuthButton", () => () => null);
jest.mock("@/components/display/ErrorDialog", () => (props: unknown) => {
  mockErrorDialog(props);
  return null;
});
jest.mock("@/service/auth/serverAuthService", () => ({
  // Sign-in goes through the web server; these tests stand in for its reply.
  signInViaServer: (...args: unknown[]) => mockSignInWithPassword(...args),
}));
jest.mock("@/components/auth/AuthLockoutDialog", () => (props: unknown) => {
  mockLockoutDialog(props);
  return null;
});
jest.mock("@/service/auth/suspensionService", () => ({
  ...jest.requireActual("@/service/auth/suspensionService"),
  getMySuspensionStatus: (...args: unknown[]) => mockGetStatus(...args),
}));
jest.mock("hooks/auth", () => ({
  useGoogleAuth: () => ({ signInWithGoogle: jest.fn(), loading: false, error: "", errorTitle: undefined, resetError: jest.fn() }),
}));
jest.mock("hooks/useTheme", () => ({ useColors: () => ({ colors: { white: "#fff", gray400: "#999" } }) }));
jest.mock("@/utils/queryClient", () => ({ clearQueryClient: jest.fn() }));
jest.mock("@/stores/usePortalStore", () => ({
  usePortalStore: { getState: () => ({ restore: (...args: unknown[]) => mockRestore(...args) }) },
}));
jest.mock("@repo/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      resend: (...args: unknown[]) => mockResend(...args),
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => mockSingle() }) }) }),
  },
}));
jest.mock("heroui-native", () => {
  const { Text, TextInput, TouchableOpacity, View } = jest.requireActual<typeof import("react-native")>("react-native");
  const Button = Object.assign(
    ({ children, onPress, isDisabled }: { children: React.ReactNode; onPress: () => void; isDisabled?: boolean }) => (
      <TouchableOpacity onPress={onPress} disabled={isDisabled}>{children}</TouchableOpacity>
    ),
    { Label: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text> },
  );
  const LinkButton = Object.assign(
    ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) => (
      <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>
    ),
    { Label: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text> },
  );
  return {
    Button,
    LinkButton,
    Text,
    TextField: View,
    Label: Text,
    FieldError: Text,
    Input: TextInput,
    InputGroup: Object.assign(View, { Input: TextInput, Suffix: View }),
    Spinner: () => null,
  };
});

describe("role-neutral mobile sign-in", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    // The suspension notice lives in a shared store: a test that shows it must not leak into the next.
    useSuspensionStore.getState().clear();
    mockSignInWithPassword.mockResolvedValue({ data: { user: { id: "account-a" } }, error: null });
    mockSingle.mockResolvedValue({ data: { roles: ["landlord", "tenant"] }, error: null });
    mockRestore.mockResolvedValue("tenant");
    mockSignOut.mockResolvedValue({ error: null });
    mockGetStatus.mockResolvedValue({ suspended: false, reason: null });
  });

  it("does not show tenant and landlord tabs and restores the saved portal", async () => {
    render(<SignIn />);
    expect(screen.queryByText("Tenant")).toBeNull();
    expect(screen.queryByText("Landlord")).toBeNull();

    fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "a@example.test");
    fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "password");
    fireEvent.press(screen.getByText("Sign In"));

    await waitFor(() => expect(mockRestore).toHaveBeenCalledWith("account-a", ["landlord", "tenant"]));
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(tenant)/rentals");
  });

  it("signs out a suspended account and shows the reason", async () => {
    mockGetStatus.mockResolvedValue({ suspended: true, reason: "Fake listings" });
    render(<SignIn />);

    fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "a@example.test");
    fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "password");
    fireEvent.press(screen.getByText("Sign In"));

    await waitFor(() =>
      expect(mockErrorDialog).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isOpen: true,
          title: "Account suspended",
          message: expect.stringContaining("Reason: Fake listings"),
        }),
      ),
    );
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockSingle).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows the notice left by the suspension guard", async () => {
    useSuspensionStore.getState().show("Fake listings");
    render(<SignIn />);

    await waitFor(() =>
      expect(mockErrorDialog).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isOpen: true,
          title: "Account suspended",
          message: expect.stringContaining("Reason: Fake listings"),
        }),
      ),
    );
  });

  it("signs out admin-only accounts without routing to a portal", async () => {
    mockSingle.mockResolvedValue({ data: { roles: ["admin"] }, error: null });
    render(<SignIn />);

    fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "a@example.test");
    fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "password");
    fireEvent.press(screen.getByText("Sign In"));

    await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
    expect(mockRestore).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("sends a confirmed account with no saved profile to finish it, keeping the session", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "account-a", email: "a@example.test" } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: null, error: null });
    render(<SignIn />);

    fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "a@example.test");
    fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "password");
    fireEvent.press(screen.getByText("Sign In"));

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: "/(auth)/finish-profile",
        params: { email: "a@example.test", profileMissing: "1" },
      }),
    );
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockRestore).not.toHaveBeenCalled();
  });

  it("offers to confirm an unconfirmed email with a fresh code instead of dead-ending", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Email not confirmed" },
    });
    mockResend.mockResolvedValue({ error: null });
    render(<SignIn />);

    fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "A@Example.test");
    fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "password");
    fireEvent.press(screen.getByText("Sign In"));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/(auth)/otp-verification",
        params: { email: "a@example.test", mode: "confirm" },
      }),
    );
    expect(mockResend).toHaveBeenCalledWith({ type: "signup", email: "A@Example.test" });
    expect(mockRestore).not.toHaveBeenCalled();
  });

  it("still signs out when the profile lookup itself fails", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "boom" } });
    render(<SignIn />);

    fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "a@example.test");
    fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "password");
    fireEvent.press(screen.getByText("Sign In"));

    await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("routes a mixed admin and consumer-role account to its saved portal", async () => {
    mockSingle.mockResolvedValue({ data: { roles: ["admin", "tenant", "landlord"] }, error: null });
    mockRestore.mockResolvedValue("landlord");
    render(<SignIn />);

    fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "a@example.test");
    fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "password");
    fireEvent.press(screen.getByText("Sign In"));

    await waitFor(() =>
      expect(mockRestore).toHaveBeenCalledWith("account-a", ["admin", "tenant", "landlord"]),
    );
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(landlord)/dashboard");
  });
  describe("attempt limit", () => {
    // The server counts attempts (shared with the website) and reports a lock as
    // `retryAfterSeconds`; the screen only shows it.
    const locked = (seconds: number) => ({
      data: { user: null },
      error: { code: "auth_locked", message: "Too many attempts.", retryAfterSeconds: seconds },
    });

    it("opens the lockout dialog and disables Sign in when the server reports a lock", async () => {
      mockSignInWithPassword.mockResolvedValue(locked(900));
      render(<SignIn />);
      fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "a@example.test");
      fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "wrong");

      fireEvent.press(screen.getByText("Sign In"));

      await waitFor(() =>
        expect(mockLockoutDialog).toHaveBeenLastCalledWith(
          expect.objectContaining({ isOpen: true, secondsLeft: expect.any(Number) }),
        ),
      );
      expect(mockLockoutDialog.mock.calls.at(-1)?.[0].secondsLeft).toBeGreaterThan(890);
      // The lock dialog replaces the "invalid password" error and the generic error dialog.
      expect(mockErrorDialog).not.toHaveBeenLastCalledWith(expect.objectContaining({ isOpen: true }));
      expect(await screen.findByText(/Try again in 1[45]:/)).toBeTruthy();

      // The button is disabled: another press never reaches the server.
      fireEvent.press(screen.getByText(/Try again in/));
      expect(mockSignInWithPassword).toHaveBeenCalledTimes(1);
    });

    it("still shows the ordinary error for a wrong password below the limit", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { code: "invalid_credentials", message: "Invalid login credentials" },
      });
      render(<SignIn />);
      fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "a@example.test");
      fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "wrong");

      fireEvent.press(screen.getByText("Sign In"));

      await waitFor(() =>
        expect(mockErrorDialog).toHaveBeenLastCalledWith(
          expect.objectContaining({ isOpen: true, message: "Invalid email or password. Please try again." }),
        ),
      );
      expect(screen.queryByText(/Try again in/)).toBeNull();
      expect(mockLockoutDialog).not.toHaveBeenLastCalledWith(expect.objectContaining({ isOpen: true }));
    });

    it("keeps Sign in disabled after the app was closed and reopened", async () => {
      await saveServerLockout("signin", "a@example.test", 600);
      render(<SignIn />);
      fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "a@example.test");
      fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "password");

      expect(await screen.findByText(/Try again in (9|10):/)).toBeTruthy();
      fireEvent.press(screen.getByText(/Try again in/));
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it("brings the lock back after the reminder was cleared, because the server still refuses", async () => {
      await saveServerLockout("signin", "a@example.test", 600);
      await AsyncStorage.clear(); // a reinstall or "clear data"
      mockSignInWithPassword.mockResolvedValue(locked(580));
      render(<SignIn />);
      fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "a@example.test");
      fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "password");

      fireEvent.press(await screen.findByText("Sign In"));

      expect(await screen.findByText(/Try again in (9|10):/)).toBeTruthy();
    });

    it("does not lock a different email", async () => {
      await saveServerLockout("signin", "someone-else@example.test", 600);
      render(<SignIn />);
      fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "a@example.test");
      fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "password");

      expect(await screen.findByText("Sign In")).toBeTruthy();
      expect(screen.queryByText(/Try again in/)).toBeNull();
    });
  });
});
