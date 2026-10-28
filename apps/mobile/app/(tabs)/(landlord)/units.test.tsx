import { fireEvent, render, screen } from "@testing-library/react-native";

import Units from "./units";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@/components/landlord/LandlordVerificationGate", () => ({ __esModule: true, default: ({ children }: { children: React.ReactNode }) => children }));
jest.mock("@/components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual("react-native");
  return { __esModule: true, default: ({ children }: { children: React.ReactNode }) => <View>{children}</View> };
});
jest.mock("@/components/layout/CustomTabBar", () => ({ FLOATING_TAB_BAR_HEIGHT: 0, FLOATING_TAB_BAR_BOTTOM_OFFSET: 0 }));
jest.mock("@/app/(tabs)/components/QuickActionButton", () => {
  const { Pressable, Text } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ label, onPress, columns }: { label: string; onPress?: () => void; columns?: number }) => (
      <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={`columns ${columns}`} onPress={onPress}><Text>{label}</Text></Pressable>
    ),
  };
});
jest.mock("../components/units/PropertyStats", () => ({ __esModule: true, default: () => null }));
jest.mock("../components/units/PropertyCard", () => ({ __esModule: true, default: () => null }));
jest.mock("../components/units/EmptyProperties", () => ({ __esModule: true, default: () => null }));
jest.mock("../components/units/PropertyCardSkeleton", () => ({ __esModule: true, default: () => null }));
jest.mock("../components/units/PropertyFilterSheet", () => ({ __esModule: true, default: () => null }));
jest.mock("@/hooks/apartments", () => ({
  useLandlordUnits: () => ({ apartments: [], monthlyProfit: 0, loading: false }),
  useLandlordActionBadges: () => ({ counts: { maintenance: 0, visits: 0, applications: 0 } }),
}));
jest.mock("heroui-native", () => {
  const { View } = jest.requireActual("react-native");
  const Passthrough = ({ children }: { children?: React.ReactNode }) => <View>{children}</View>;
  const SearchField = Object.assign(Passthrough, { Group: Passthrough, SearchIcon: () => null, Input: () => null, ClearButton: () => null });
  return { SearchField, Separator: () => null };
});

beforeEach(() => mockPush.mockClear());

describe("Units tab property actions", () => {
  it("lists the four existing actions and then a Payments action, in that order", () => {
    render(<Units />);
    const labels = screen.getAllByRole("button").map((node) => node.props.accessibilityLabel);
    expect(labels).toEqual(["Add Property", "Maintenance Request", "Visit Request", "Tenant Applications", "Payments"]);
  });

  it("fits all five actions in one compact row, as the five-column layout", () => {
    render(<Units />);
    const hints = screen.getAllByRole("button").map((node) => node.props.accessibilityHint);
    expect(hints).toEqual(Array(5).fill("columns 5"));
  });

  it("opens the all-units Payments screen from the Payments action", () => {
    render(<Units />);
    fireEvent.press(screen.getByLabelText("Payments"));
    expect(mockPush).toHaveBeenCalledWith("/landlord/payments");
  });

  it("keeps the other actions going where they went", () => {
    render(<Units />);
    fireEvent.press(screen.getByLabelText("Tenant Applications"));
    expect(mockPush).toHaveBeenCalledWith("/landlord/tenant-applications");
  });
});
