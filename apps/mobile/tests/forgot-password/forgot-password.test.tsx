import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import ForgotPassword from "@/app/(auth)/forgot-password/index";
import { usePasswordRecoveryStore } from "@/stores/usePasswordRecoveryStore";
import { PasswordRecoveryError } from "@/service/auth/passwordRecoveryService";

const mockRequest = jest.fn();
const mockRouter = { push: jest.fn(), back: jest.fn() };

jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));

jest.mock("heroui-native", () => require("./heroUINativeStub"));

jest.mock("@repo/supabase", () => ({ supabase: {} }));

jest.mock("@/service/auth/passwordRecoveryService", () => ({
  ...jest.requireActual("@/service/auth/passwordRecoveryService"),
  requestPasswordRecovery: (...args: unknown[]) => mockRequest(...args),
}));

jest.mock("hooks/useTheme", () => ({
  useColors: () => ({ colors: { textPrimary: "#333", white: "#fff" } }),
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

function enterEmail(value: string) {
  fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), value);
}

describe("Forgot password email screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePasswordRecoveryStore.getState().reset();
  });

  it("shows the Google sign-in note without looking anything up", () => {
    render(<ForgotPassword />);
    expect(screen.getByText("Signed up with Google?")).toBeTruthy();
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("validates the email before sending", () => {
    render(<ForgotPassword />);

    fireEvent.press(screen.getByText("Send Code"));
    expect(screen.getByText("Please enter your email address.")).toBeTruthy();

    enterEmail("not-an-email");
    fireEvent.press(screen.getByText("Send Code"));
    expect(screen.getByText("Please enter a valid email address.")).toBeTruthy();
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("sends the code, keeps the email in memory and opens the code screen", async () => {
    mockRequest.mockResolvedValueOnce(undefined);
    render(<ForgotPassword />);

    enterEmail(`  ${EMAIL} `);
    fireEvent.press(screen.getByText("Send Code"));

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/forgot-password/otp-verification"));
    expect(mockRequest).toHaveBeenCalledWith(EMAIL);
    expect(usePasswordRecoveryStore.getState().email).toBe(EMAIL);
    expect(JSON.stringify(mockRouter.push.mock.calls)).not.toContain(EMAIL);
  });

  it("shows the pending state and ignores repeat presses", async () => {
    let resolveRequest: () => void = () => {};
    mockRequest.mockReturnValueOnce(new Promise<void>((resolve) => { resolveRequest = resolve; }));
    render(<ForgotPassword />);

    enterEmail(EMAIL);
    fireEvent.press(screen.getByText("Send Code"));
    expect(await screen.findByText("Sending Code...")).toBeTruthy();
    fireEvent.press(screen.getByText("Sending Code..."));
    expect(mockRequest).toHaveBeenCalledTimes(1);

    await act(async () => resolveRequest());
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
  });

  it("surfaces server errors and stays on the screen", async () => {
    mockRequest.mockRejectedValueOnce(new PasswordRecoveryError("rate_limited"));
    render(<ForgotPassword />);

    enterEmail(EMAIL);
    fireEvent.press(screen.getByText("Send Code"));

    expect(await screen.findByText(/Too many attempts/)).toBeTruthy();
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(usePasswordRecoveryStore.getState().email).toBe("");
  });

  it("shows an email Supabase rejects under the field", async () => {
    mockRequest.mockRejectedValueOnce(new PasswordRecoveryError("invalid_email"));
    render(<ForgotPassword />);

    enterEmail(EMAIL);
    fireEvent.press(screen.getByText("Send Code"));

    expect(await screen.findByText("Enter a valid email address.")).toBeTruthy();
    expect(screen.queryByText(/^Error:/)).toBeNull();
  });

  it("clears the remembered email when leaving the flow", () => {
    usePasswordRecoveryStore.getState().setEmail(EMAIL);
    render(<ForgotPassword />);

    fireEvent.press(screen.getByLabelText("Go back"));
    expect(mockRouter.back).toHaveBeenCalled();
    expect(usePasswordRecoveryStore.getState().email).toBe("");
  });
});
