import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import RecoveryCodeVerification from "@/app/(auth)/forgot-password/otp-verification";
import { usePasswordRecoveryStore } from "@/stores/usePasswordRecoveryStore";
import { PasswordError, RECOVERY_RESEND_COOLDOWN_SECONDS } from "@repo/utils";

const mockRequest = jest.fn();
const mockVerify = jest.fn();
const mockRouter = { replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn() };
const mockRedirect = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  Redirect: ({ href }: { href: string }) => {
    mockRedirect(href);
    return null;
  },
}));

jest.mock("heroui-native", () => require("../support/heroUINativeStub"));

jest.mock("@repo/supabase", () => ({ supabase: {} }));

jest.mock("@/service/auth/passwordRecoveryService", () => ({
  ...jest.requireActual("@/service/auth/passwordRecoveryService"),
  requestPasswordRecovery: (...args: unknown[]) => mockRequest(...args),
  verifyPasswordRecoveryCode: (...args: unknown[]) => mockVerify(...args),
}));

jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ colors: { textPrimary: "#333", white: "#fff", primary: "#376BF5" } }),
}));

jest.mock("@/components/layout/ScreenWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/components/display/ErrorDialog", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    __esModule: true,
    default: ({ isOpen, message }: { isOpen: boolean; message: string | null }) =>
      isOpen ? React.createElement(Text, null, `Error: ${message}`) : null,
  };
});

const EMAIL = "tenant@example.com";
const CODE = "123456";

function enterCode(value: string) {
  fireEvent.changeText(screen.getByLabelText("Recovery code"), value);
}

// JSON.stringify drops Error messages; include them so leaks are caught.
const serialize = (value: unknown) =>
  JSON.stringify(value, (_key, item) =>
    item instanceof Error ? { name: item.name, message: item.message } : item);

describe("Recovery code screen", () => {
  const consoleSpies: jest.SpyInstance[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    usePasswordRecoveryStore.getState().setEmail(EMAIL);
    consoleSpies.push(
      jest.spyOn(console, "log").mockImplementation(() => {}),
      jest.spyOn(console, "warn").mockImplementation(() => {}),
      jest.spyOn(console, "error").mockImplementation(() => {}),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    const logged = serialize(consoleSpies.map((spy) => spy.mock.calls));
    expect(logged).not.toContain(CODE);
    expect(logged).not.toContain(EMAIL);
    consoleSpies.splice(0).forEach((spy) => spy.mockRestore());
  });

  it("starts the flow again when there is no email in memory", () => {
    usePasswordRecoveryStore.getState().reset();
    render(<RecoveryCodeVerification />);
    expect(mockRedirect).toHaveBeenCalledWith("/forgot-password");
  });

  it("shows a neutral message with the email the code was sent to", () => {
    render(<RecoveryCodeVerification />);
    expect(screen.getByText(/If an account exists for/)).toBeTruthy();
    expect(screen.getByText(EMAIL)).toBeTruthy();
  });

  it("verifies a complete code and opens the reset screen", async () => {
    mockVerify.mockResolvedValueOnce("ready");
    render(<RecoveryCodeVerification />);

    enterCode(CODE);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/forgot-password/reset-password"));
    expect(mockVerify).toHaveBeenCalledWith(EMAIL, CODE);
    const routed = JSON.stringify(mockRouter.replace.mock.calls);
    expect(routed).not.toContain(EMAIL);
    expect(routed).not.toContain(CODE);
  });

  it("shows invalid or expired codes inline and clears the input", async () => {
    mockVerify.mockRejectedValueOnce(new PasswordError("invalid_or_expired_code"));
    render(<RecoveryCodeVerification />);

    enterCode(CODE);

    expect(await screen.findByText(/That code is incorrect or has expired/)).toBeTruthy();
    expect(screen.getByLabelText("Recovery code").props.value).toBe("");
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("opens the error dialog for unexpected failures", async () => {
    mockVerify.mockRejectedValueOnce(new PasswordError("network"));
    render(<RecoveryCodeVerification />);

    enterCode(CODE);

    expect(await screen.findByText(/Error: Can't connect right now/)).toBeTruthy();
  });

  it("tells Google-only accounts to use Google and returns to sign-in", async () => {
    mockVerify.mockResolvedValueOnce("google_only");
    render(<RecoveryCodeVerification />);

    enterCode(CODE);

    expect(await screen.findByText("This account uses Google")).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText("Back to Sign In"));
    expect(mockRouter.dismissTo).toHaveBeenCalledWith("/sign-in");
    expect(usePasswordRecoveryStore.getState().email).toBe("");
  });

  it("keeps verify disabled until the code is complete", () => {
    render(<RecoveryCodeVerification />);
    const verify = () => screen.getByRole("button", { name: "Verify Code" });

    expect(verify().props.accessibilityState.disabled).toBe(true);
    enterCode("123");
    fireEvent.press(verify());
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("resends a real code only after the cooldown", async () => {
    jest.useFakeTimers();
    mockRequest.mockResolvedValueOnce(undefined);
    render(<RecoveryCodeVerification />);

    expect(screen.getByText(`Resend in ${RECOVERY_RESEND_COOLDOWN_SECONDS}s`)).toBeTruthy();
    expect(screen.queryByText("Resend")).toBeNull();

    for (let second = 0; second < RECOVERY_RESEND_COOLDOWN_SECONDS; second += 1) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }

    fireEvent.press(screen.getByText("Resend"));

    expect(await screen.findByText(/A new code is on its way/)).toBeTruthy();
    expect(mockRequest).toHaveBeenCalledWith(EMAIL);
    expect(screen.getByText(`Resend in ${RECOVERY_RESEND_COOLDOWN_SECONDS}s`)).toBeTruthy();
  });

  it("shows the server's rate limit when resending", async () => {
    jest.useFakeTimers();
    mockRequest.mockRejectedValueOnce(new PasswordError("rate_limited"));
    render(<RecoveryCodeVerification />);

    for (let second = 0; second < RECOVERY_RESEND_COOLDOWN_SECONDS; second += 1) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }
    fireEvent.press(screen.getByText("Resend"));

    expect(await screen.findByText(/Too many attempts/)).toBeTruthy();
  });
});
