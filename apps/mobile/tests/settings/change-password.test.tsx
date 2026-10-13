import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Keyboard } from "react-native";

import ChangePassword from "@/app/settings/change-password";
import { PasswordError } from "@repo/utils";

const mockChangePassword = jest.fn();
const mockRouter = { back: jest.fn(), push: jest.fn(), replace: jest.fn() };

jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));

jest.mock("heroui-native", () => jest.requireActual("../support/heroUINativeStub"));

jest.mock("@repo/supabase", () => ({ supabase: {} }));

jest.mock("@/service/auth/passwordChangeService", () => ({
  changePassword: (...args: unknown[]) => mockChangePassword(...args),
}));

jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({
    colors: { gray400: "#9CA3AF", success: "#22C55E", textSecondary: "#666", white: "#fff" },
  }),
}));

// Renders the footer too, since the Update Password button lives there.
jest.mock("@/components/layout/ScreenWrapper", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    __esModule: true,
    default: ({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children, footer),
  };
});

jest.mock("@/components/layout/StandardHeader", () => ({ __esModule: true, default: () => null }));

jest.mock("@/components/display/ErrorDialog", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    __esModule: true,
    default: ({ isOpen, message }: { isOpen: boolean; message: string | null }) =>
      isOpen ? React.createElement(Text, null, `Error: ${message}`) : null,
  };
});

const CURRENT = "0ld!Passw0rd";
const NEXT = "N3w!Passw0rd";

const mockToastShow: jest.Mock = jest.requireMock("heroui-native").mockToastShow;

// JSON.stringify drops Error messages; include them so leaks are caught.
const serialize = (value: unknown) =>
  JSON.stringify(value, (_key, item) =>
    item instanceof Error ? { name: item.name, message: item.message } : item);

const currentField = () => screen.getByPlaceholderText("Enter your current password");
const newField = () => screen.getByPlaceholderText("Create a password");
const confirmField = () => screen.getByPlaceholderText("Confirm your password");
const submitButton = () => screen.getByRole("button", { name: /Update Password|Updating/ });

function fillForm(current = CURRENT, next = NEXT, confirm = next) {
  fireEvent.changeText(currentField(), current);
  fireEvent.changeText(newField(), next);
  fireEvent.changeText(confirmField(), confirm);
}

describe("Change Password screen", () => {
  const consoleSpies: jest.SpyInstance[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpies.push(
      jest.spyOn(console, "log").mockImplementation(() => {}),
      jest.spyOn(console, "warn").mockImplementation(() => {}),
      jest.spyOn(console, "error").mockImplementation(() => {}),
    );
  });

  afterEach(() => {
    const leaked = serialize([
      consoleSpies.map((spy) => spy.mock.calls),
      mockRouter.back.mock.calls,
      mockRouter.push.mock.calls,
      mockRouter.replace.mock.calls,
    ]);
    expect(leaked).not.toContain(CURRENT);
    expect(leaked).not.toContain(NEXT);
    consoleSpies.splice(0).forEach((spy) => spy.mockRestore());
  });

  it("keeps Update Password disabled until the new password meets the rules", () => {
    render(<ChangePassword />);
    expect(submitButton().props.accessibilityState.disabled).toBe(true);

    fillForm(CURRENT, "weak", "weak");
    expect(submitButton().props.accessibilityState.disabled).toBe(true);

    fillForm();
    expect(submitButton().props.accessibilityState.disabled).toBe(false);
  });

  it("asks for the current password before calling the service", () => {
    render(<ChangePassword />);
    fillForm("");

    fireEvent.press(submitButton());

    expect(screen.getByText("Please enter your current password.")).toBeTruthy();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it("changes the password, shows a success toast and returns to Settings", async () => {
    mockChangePassword.mockResolvedValueOnce(undefined);
    const dismiss = jest.spyOn(Keyboard, "dismiss");
    render(<ChangePassword />);
    fillForm();

    fireEvent.press(submitButton());

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
    expect(dismiss).toHaveBeenCalled();
    expect(mockChangePassword).toHaveBeenCalledWith(CURRENT, NEXT);
    expect(mockToastShow).toHaveBeenCalledWith({
      variant: "success",
      label: "Password updated",
      description: "Other devices were signed out.",
    });
    // Sensitive fields are cleared before leaving.
    expect(currentField().props.value).toBe("");
    expect(newField().props.value).toBe("");
    expect(confirmField().props.value).toBe("");
    dismiss.mockRestore();
  });

  it("shows a wrong current password under that field and keeps the form", async () => {
    mockChangePassword.mockRejectedValueOnce(new PasswordError("wrong_current_password"));
    render(<ChangePassword />);
    fillForm();

    fireEvent.press(submitButton());

    expect(await screen.findByText("Your current password is incorrect.")).toBeTruthy();
    expect(currentField().props.value).toBe(CURRENT);
    expect(newField().props.value).toBe(NEXT);
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockToastShow).not.toHaveBeenCalled();

    // Editing the field clears the server message.
    fireEvent.changeText(currentField(), "different");
    expect(screen.queryByText("Your current password is incorrect.")).toBeNull();
  });

  it.each([
    ["same_password", "Your new password must be different from your current password."],
    ["weak_password", "This password is too weak. Please choose a stronger password."],
  ] as const)("shows %s under the new password field", async (reason, message) => {
    mockChangePassword.mockRejectedValueOnce(new PasswordError(reason));
    render(<ChangePassword />);
    fillForm();

    fireEvent.press(submitButton());

    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.queryByText(/^Error:/)).toBeNull();
    expect(newField().props.value).toBe(NEXT);
  });

  it("opens the error dialog for other failures", async () => {
    mockChangePassword.mockRejectedValueOnce(new PasswordError("reauthentication_required"));
    render(<ChangePassword />);
    fillForm();

    fireEvent.press(submitButton());

    expect(await screen.findByText(/Error: For your security, please sign in again/)).toBeTruthy();
  });

  it("logs unexpected failures by type only", async () => {
    mockChangePassword.mockRejectedValueOnce(new Error(`server echoed ${NEXT} and ${CURRENT}`));
    render(<ChangePassword />);
    fillForm();

    fireEvent.press(submitButton());

    expect(await screen.findByText("Error: Something went wrong. Please try again.")).toBeTruthy();
    expect(console.error).toHaveBeenCalledWith("Password change failed:", "Error");
  });

  it("shows the pending state and ignores repeat presses", async () => {
    let resolveChange: () => void = () => {};
    mockChangePassword.mockReturnValueOnce(new Promise<void>((resolve) => { resolveChange = resolve; }));
    render(<ChangePassword />);
    fillForm();

    fireEvent.press(submitButton());
    expect(await screen.findByText("Updating...")).toBeTruthy();
    fireEvent.press(submitButton());
    expect(mockChangePassword).toHaveBeenCalledTimes(1);

    await act(async () => resolveChange());
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });
});
