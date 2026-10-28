import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import LandlordVerificationGate from "./LandlordVerificationGate";

const mockNavigate = jest.fn();
let mockProfile: { roles: string[]; account_status: string } | undefined;

jest.mock("expo-router", () => ({ useRouter: () => ({ navigate: mockNavigate }) }));
jest.mock("@/hooks/auth/useCurrentUser", () => ({ useCurrentUser: () => ({ data: mockProfile }) }));
jest.mock("heroui-native", () => {
  const { Pressable, Text } = jest.requireActual("react-native");
  function Button({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
    return <Pressable accessibilityRole="button" onPress={onPress}>{children}</Pressable>;
  }
  function Label({ children }: { children: React.ReactNode }) {
    return <Text>{children}</Text>;
  }
  Button.Label = Label;
  return { Button };
});
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { gray500: "#6C757D" } }) }));
jest.mock("@/components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual("react-native");
  return { __esModule: true, default: ({ children }: { children: React.ReactNode }) => <View>{children}</View> };
});

const renderGate = () =>
  render(
    <LandlordVerificationGate>
      <Text>landlord tools</Text>
    </LandlordVerificationGate>,
  );

describe("LandlordVerificationGate", () => {
  beforeEach(() => mockNavigate.mockClear());

  it.each(["unverified", "pending", "rejected"])("replaces the tools for a %s landlord", (status) => {
    mockProfile = { roles: ["landlord"], account_status: status };
    renderGate();
    expect(screen.queryByText("landlord tools")).toBeNull();
    expect(screen.getByLabelText("Verify your account to use landlord features.")).toBeTruthy();
  });

  it("explains a review in progress separately from missing verification", () => {
    mockProfile = { roles: ["landlord"], account_status: "pending" };
    renderGate();
    expect(screen.getByText("Your verification is under review")).toBeTruthy();
  });

  it("sends the landlord to the profile where verification lives", () => {
    mockProfile = { roles: ["landlord"], account_status: "unverified" };
    renderGate();
    fireEvent.press(screen.getByText("Verify my account"));
    expect(mockNavigate).toHaveBeenCalledWith("/(tabs)/(landlord)/profile");
  });

  it("shows the tools to a verified landlord and while the profile loads", () => {
    mockProfile = { roles: ["landlord"], account_status: "verified" };
    renderGate();
    expect(screen.getByText("landlord tools")).toBeTruthy();
    screen.unmount();
    mockProfile = undefined;
    renderGate();
    expect(screen.getByText("landlord tools")).toBeTruthy();
  });
});
