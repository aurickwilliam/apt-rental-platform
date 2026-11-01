import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import CompleteProfile from "./complete-profile";

const mockRequestSignUpCode = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ email: "a@example.test", userSide: "landlord" }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock("heroui-native", () => jest.requireActual("../../tests/support/heroUINativeStub"));
jest.mock("components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return function MockScreenWrapper({ children }: { children: React.ReactNode }) { return <View>{children}</View>; };
});
jest.mock("@/components/inputs/DropdownField", () => () => null);
jest.mock("@/components/inputs/DateField", () => () => null);
jest.mock("@/components/display/ErrorDialog", () => () => null);
jest.mock("hooks/useTheme", () => ({
  useColors: () => ({ colors: { white: "#fff", textPrimary: "#000", gray400: "#999", success: "#0a0", textSecondary: "#666" } }),
}));
jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ colors: { white: "#fff", textPrimary: "#000", gray400: "#999", success: "#0a0", textSecondary: "#666" } }),
}));
jest.mock("@/service/auth/signUpService", () => ({
  requestSignUpCode: (...args: unknown[]) => mockRequestSignUpCode(...args),
}));

describe("CompleteProfile screen (email sign-up)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("asks for the details and a new password for the chosen account type", () => {
    render(<CompleteProfile />);

    expect(screen.getByText(/Complete Your Landlord Profile/)).toBeTruthy();
    expect(screen.getByDisplayValue("a@example.test")).toBeTruthy();
    expect(screen.getByPlaceholderText("Create a password")).toBeTruthy();
    expect(screen.getByPlaceholderText("Confirm your password")).toBeTruthy();
    expect(screen.getByLabelText("At least 8 characters: not met")).toBeTruthy();
  });

  it("starts with empty names", () => {
    render(<CompleteProfile />);

    expect(screen.getByPlaceholderText("Enter your first name").props.value).toBe("");
  });

  it("shows required errors, including the passwords, and creates no account", async () => {
    render(<CompleteProfile />);

    fireEvent.press(screen.getByLabelText("I have read and agree to the Privacy Policy"));
    fireEvent.press(screen.getByLabelText("I have read and agree to the Terms and Conditions"));
    fireEvent.press(screen.getByText("Submit"));

    await waitFor(() => expect(screen.getAllByText("This field is required").length).toBeGreaterThan(2));
    expect(mockRequestSignUpCode).not.toHaveBeenCalled();
  });

  it("reports a mismatched confirmation once submitted", async () => {
    render(<CompleteProfile />);

    fireEvent.changeText(screen.getByPlaceholderText("Create a password"), "Passw0rd!");
    fireEvent.changeText(screen.getByPlaceholderText("Confirm your password"), "Different1!");
    fireEvent.press(screen.getByLabelText("I have read and agree to the Privacy Policy"));
    fireEvent.press(screen.getByLabelText("I have read and agree to the Terms and Conditions"));
    fireEvent.press(screen.getByText("Submit"));

    await waitFor(() => expect(screen.getByText("Passwords do not match")).toBeTruthy());
  });
});
