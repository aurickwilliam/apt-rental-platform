import { fireEvent, render, screen } from "@testing-library/react-native";

import NewPasswordFields from "./NewPasswordFields";

jest.mock("heroui-native", () => jest.requireActual("../../tests/support/heroUINativeStub"));

jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ colors: { gray400: "#9CA3AF", success: "#22C55E", textSecondary: "#666" } }),
}));

const NO_REQUIREMENTS = {
  minLength: false,
  hasUppercase: false,
  hasLowercase: false,
  hasNumber: false,
  hasSpecialChar: false,
  passwordsMatch: false,
};

function renderFields(overrides: Partial<React.ComponentProps<typeof NewPasswordFields>> = {}) {
  const props = {
    password: "",
    confirmPassword: "",
    onPasswordChange: jest.fn(),
    onConfirmPasswordChange: jest.fn(),
    requirements: NO_REQUIREMENTS,
    ...overrides,
  };
  render(<NewPasswordFields {...props} />);
  return props;
}

describe("NewPasswordFields", () => {
  it("reports typing in each field to its own handler", () => {
    const props = renderFields();

    fireEvent.changeText(screen.getByPlaceholderText("Create a password"), "abc");
    fireEvent.changeText(screen.getByPlaceholderText("Confirm your password"), "abd");

    expect(props.onPasswordChange).toHaveBeenCalledWith("abc");
    expect(props.onConfirmPasswordChange).toHaveBeenCalledWith("abd");
  });

  it("shows each rule as met or not met, not by colour alone", () => {
    renderFields({ requirements: { ...NO_REQUIREMENTS, minLength: true, hasNumber: true } });

    expect(screen.getByLabelText("At least 8 characters: met")).toBeTruthy();
    expect(screen.getByLabelText("At least one number (0–9): met")).toBeTruthy();
    expect(screen.getByLabelText("At least one uppercase letter (A–Z): not met")).toBeTruthy();
    expect(screen.getByLabelText(/special character.*: not met/)).toBeTruthy();
  });

  it("shows field errors under the matching field", () => {
    renderFields({ passwordError: "Too weak", confirmPasswordError: "Passwords do not match" });

    expect(screen.getByText("Too weak")).toBeTruthy();
    expect(screen.getByText("Passwords do not match")).toBeTruthy();
  });

  it("hides passwords until the eye toggle is pressed", () => {
    renderFields({ password: "N3w!Passw0rd" });
    const input = screen.getByPlaceholderText("Create a password");

    expect(input.props.secureTextEntry).toBe(true);
    fireEvent.press(screen.getByLabelText("Show password"));
    expect(screen.getByPlaceholderText("Create a password").props.secureTextEntry).toBe(false);
    expect(screen.getByLabelText("Hide password")).toBeTruthy();
    // The confirm field toggles independently.
    expect(screen.getByPlaceholderText("Confirm your password").props.secureTextEntry).toBe(true);
  });

  it("can relabel the new-password field", () => {
    renderFields({ passwordLabel: "New Password:" });
    expect(screen.getByText("New Password:")).toBeTruthy();
    expect(screen.getByLabelText("Show new password")).toBeTruthy();
  });
});
