import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import ResetPassword from "@/app/(auth)/forgot-password/reset-password";
import { usePasswordRecoveryStore } from "@/stores/usePasswordRecoveryStore";
import { PasswordRecoveryError } from "@/service/auth/passwordRecoveryService";

const mockHasSession = jest.fn();
const mockUpdatePassword = jest.fn();
const mockEndRecovery = jest.fn();
const mockClearQueryClient = jest.fn();
const mockRouter = { replace: jest.fn(), dismissAll: jest.fn() };
const mockRedirect = jest.fn();
let mockBeforeRemove: (() => void) | null = null;

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useNavigation: () => ({
    addListener: (event: string, handler: () => void) => {
      if (event === "beforeRemove") mockBeforeRemove = handler;
      return () => {};
    },
  }),
  Redirect: ({ href }: { href: string }) => {
    mockRedirect(href);
    return null;
  },
}));

jest.mock("heroui-native", () => require("./heroUINativeStub"));

jest.mock("@repo/supabase", () => ({ supabase: {} }));

jest.mock("@/service/auth/passwordRecoveryService", () => ({
  ...jest.requireActual("@/service/auth/passwordRecoveryService"),
  hasActiveRecoverySession: (...args: unknown[]) => mockHasSession(...args),
  updateRecoveredPassword: (...args: unknown[]) => mockUpdatePassword(...args),
  endPasswordRecovery: (...args: unknown[]) => mockEndRecovery(...args),
}));

jest.mock("@/utils/queryClient", () => ({ clearQueryClient: () => mockClearQueryClient() }));

jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ colors: { textSecondary: "#666", success: "#22C55E", white: "#fff" } }),
}));

jest.mock("@/components/layout/ScreenWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/components/inputs/AppInput", () => {
  const { TextInput } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: TextInput };
});

jest.mock("@expo/vector-icons/build/Ionicons", () => ({ __esModule: true, default: () => null }));

jest.mock("@/components/display/ErrorDialog", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    __esModule: true,
    default: ({ isOpen, message, onClose }: { isOpen: boolean; message: string | null; onClose: () => void }) =>
      isOpen
        ? React.createElement(Pressable, { onPress: onClose, accessibilityLabel: "Close error" },
            React.createElement(Text, null, `Error: ${message}`))
        : null,
  };
});

const PASSWORD = "N3w!Passw0rd";

async function renderWithSession(valid = true) {
  mockHasSession.mockResolvedValueOnce(valid);
  render(<ResetPassword />);
  await act(async () => {});
}

function fillPasswords(password = PASSWORD, confirm = password) {
  fireEvent.changeText(screen.getByPlaceholderText("Create a password"), password);
  fireEvent.changeText(screen.getByPlaceholderText("Confirm your password"), confirm);
}

const submitButton = () => screen.getByRole("button", { name: /Submit|Saving/ });

// JSON.stringify drops Error messages; include them so leaks are caught.
const serialize = (value: unknown) =>
  JSON.stringify(value, (_key, item) =>
    item instanceof Error ? { name: item.name, message: item.message } : item);

describe("Reset password screen", () => {
  const consoleSpies: jest.SpyInstance[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    mockBeforeRemove = null;
    mockEndRecovery.mockResolvedValue(undefined);
    usePasswordRecoveryStore.getState().setEmail("tenant@example.com");
    consoleSpies.push(
      jest.spyOn(console, "log").mockImplementation(() => {}),
      jest.spyOn(console, "warn").mockImplementation(() => {}),
      jest.spyOn(console, "error").mockImplementation(() => {}),
    );
  });

  afterEach(() => {
    const leaked = serialize([
      consoleSpies.map((spy) => spy.mock.calls),
      mockRouter.replace.mock.calls,
      mockRedirect.mock.calls,
    ]);
    expect(leaked).not.toContain(PASSWORD);
    consoleSpies.splice(0).forEach((spy) => spy.mockRestore());
  });

  it("logs unexpected failures without the password", async () => {
    mockUpdatePassword.mockRejectedValueOnce(new Error(`server rejected ${PASSWORD}`));
    await renderWithSession();

    fillPasswords();
    fireEvent.press(submitButton());

    expect(await screen.findByText(/Error: Something went wrong/)).toBeTruthy();
  });

  it("sends visitors without a recovery session back to the start", async () => {
    await renderWithSession(false);
    expect(mockRedirect).toHaveBeenCalledWith("/forgot-password");

    mockBeforeRemove?.();
    expect(mockEndRecovery).not.toHaveBeenCalled();
  });

  it("keeps submit disabled until the session is confirmed", () => {
    mockHasSession.mockReturnValueOnce(new Promise(() => {}));
    render(<ResetPassword />);
    fillPasswords();
    expect(submitButton().props.accessibilityState.disabled).toBe(true);
  });

  it("saves the new password, signs out everywhere and shows the success screen", async () => {
    mockUpdatePassword.mockResolvedValueOnce(undefined);
    await renderWithSession();

    fillPasswords();
    fireEvent.press(submitButton());

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/forgot-password/updated"));
    expect(mockUpdatePassword).toHaveBeenCalledWith(PASSWORD);
    expect(mockEndRecovery).toHaveBeenCalledWith("global");
    expect(mockClearQueryClient).toHaveBeenCalled();
    expect(mockRouter.dismissAll).toHaveBeenCalled();
    expect(usePasswordRecoveryStore.getState().email).toBe("");

    // Leaving after success is not an abandoned reset.
    mockBeforeRemove?.();
    expect(mockEndRecovery).toHaveBeenCalledTimes(1);
  });

  it("checks the password locally before calling the server", async () => {
    await renderWithSession();

    fillPasswords("weak", "weak");
    fireEvent.press(submitButton());

    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it("ignores repeat presses while saving", async () => {
    let resolveUpdate: () => void = () => {};
    mockUpdatePassword.mockReturnValueOnce(new Promise<void>((resolve) => { resolveUpdate = resolve; }));
    await renderWithSession();

    fillPasswords();
    fireEvent.press(submitButton());
    expect(await screen.findByText("Saving...")).toBeTruthy();
    fireEvent.press(submitButton());
    expect(mockUpdatePassword).toHaveBeenCalledTimes(1);

    await act(async () => resolveUpdate());
  });

  it("keeps the form and shows server password rules inline", async () => {
    mockUpdatePassword.mockRejectedValueOnce(new PasswordRecoveryError("same_password"));
    await renderWithSession();

    fillPasswords();
    fireEvent.press(submitButton());

    expect(await screen.findByText(/must be different from your current password/)).toBeTruthy();
    expect(screen.getByPlaceholderText("Create a password").props.value).toBe(PASSWORD);
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockEndRecovery).not.toHaveBeenCalled();
  });

  it("restarts the flow after an expired session once the message is closed", async () => {
    mockUpdatePassword.mockRejectedValueOnce(new PasswordRecoveryError("session_expired"));
    await renderWithSession();

    fillPasswords();
    fireEvent.press(submitButton());

    expect(await screen.findByText(/Your reset session has expired/)).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText("Close error"));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/forgot-password"));
    expect(mockEndRecovery).toHaveBeenCalledWith();
  });

  it("signs this device out when the reset is abandoned", async () => {
    await renderWithSession();

    mockBeforeRemove?.();

    expect(mockEndRecovery).toHaveBeenCalledWith();
    expect(usePasswordRecoveryStore.getState().email).toBe("");
  });
});
