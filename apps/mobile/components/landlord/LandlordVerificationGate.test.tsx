import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import LandlordVerificationGate from "./LandlordVerificationGate";

const mockNavigate = jest.fn();
let mockProfile: { id: string; roles: string[]; account_status: string } | undefined;
let mockSegments: string[] = ["(tabs)", "(landlord)", "dashboard"];
let mockActiveTenancy = false;

jest.mock("expo-router", () => ({ useRouter: () => ({ navigate: mockNavigate }), useSegments: () => mockSegments }));
jest.mock("@/hooks/landlord/useHasActiveTenancy", () => ({ useHasActiveTenancy: () => mockActiveTenancy }));
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

const renderGate = async (allowTenancyScreens = false) =>
  await render(
    <LandlordVerificationGate allowTenancyScreens={allowTenancyScreens}>
      <Text>landlord tools</Text>
    </LandlordVerificationGate>,
  );

describe("LandlordVerificationGate", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSegments = ["(tabs)", "(landlord)", "dashboard"];
    mockActiveTenancy = false;
  });

  it.each(["unverified", "pending", "rejected"])("replaces the tools for a %s landlord", async (status) => {
    mockProfile = { id: "u1", roles: ["landlord"], account_status: status };
    await renderGate();
    expect(screen.queryByText("landlord tools")).toBeNull();
    expect(screen.getByLabelText("Verify your account to use landlord features.")).toBeTruthy();
  });

  it("explains a review in progress separately from missing verification", async () => {
    mockProfile = { id: "u1", roles: ["landlord"], account_status: "pending" };
    await renderGate();
    expect(screen.getByText("Your verification is under review")).toBeTruthy();
  });

  it("sends the landlord to the profile where verification lives", async () => {
    mockProfile = { id: "u1", roles: ["landlord"], account_status: "unverified" };
    await renderGate();
    await fireEvent.press(screen.getByText("Verify my account"));
    expect(mockNavigate).toHaveBeenCalledWith("/(tabs)/(landlord)/profile");
  });

  it("shows the tools to a verified landlord and while the profile loads", async () => {
    mockProfile = { id: "u1", roles: ["landlord"], account_status: "verified" };
    await renderGate();
    expect(screen.getByText("landlord tools")).toBeTruthy();
    await screen.unmount();
    mockProfile = undefined;
    await renderGate();
    expect(screen.getByText("landlord tools")).toBeTruthy();
  });

  it("offers payments and maintenance to a landlord with a running tenancy", async () => {
    mockProfile = { id: "u1", roles: ["landlord"], account_status: "unverified" };
    mockActiveTenancy = true;
    await renderGate();
    await fireEvent.press(screen.getByText("Payments"));
    expect(mockNavigate).toHaveBeenCalledWith("/landlord/payments");
    await fireEvent.press(screen.getByText("Maintenance requests"));
    expect(mockNavigate).toHaveBeenCalledWith("/landlord/maintenance-requests");
  });

  it("opens only the tenancy screens of the landlord stack, and only during a tenancy", async () => {
    mockProfile = { id: "u1", roles: ["landlord"], account_status: "unverified" };
    mockSegments = ["landlord", "payments"];
    await renderGate(true);
    expect(screen.queryByText("landlord tools")).toBeNull();
    await screen.unmount();

    mockActiveTenancy = true;
    await renderGate(true);
    expect(screen.getByText("landlord tools")).toBeTruthy();
    await screen.unmount();

    mockSegments = ["landlord", "analytics"];
    await renderGate(true);
    expect(screen.queryByText("landlord tools")).toBeNull();
  });
});
