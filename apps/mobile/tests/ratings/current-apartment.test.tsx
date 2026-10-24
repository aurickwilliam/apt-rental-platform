import type { ReactNode } from "react";
import type { PressableProps, TextProps } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import CurrentApartmentDetails from "@/app/tenant/current-apartment";

const mockPush = jest.fn();
const mockOpenLease = jest.fn();
const apartment = {
  id: "cozy-cove", name: "Cozy Cove Apartment", street_address: "Test Street", barangay: "158", city: "Caloocan",
  monthly_rent: 15000, description: "Current rental", type: "Apartment", no_bedrooms: 1, no_bathrooms: 1,
  area_sqm: 30, amenities: [], lease_agreement_url: "cozy-cove/lease.pdf",
};
const tenancy = { id: "current-stay", lease_start: "2026-01-01", lease_end: "2027-01-01", monthly_rent: 15000, apartment, landlord: null };
let mockTenancy: typeof tenancy | null = tenancy;
let mockLoading = false;
let mockError: string | null = null;

jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("hooks/tenancy", () => ({ useTenancy: () => ({ tenancy: mockTenancy, loading: mockLoading, error: mockError }) }));
jest.mock("@/hooks/apartments", () => ({ useLeaseAgreement: () => ({ openLeaseAgreement: mockOpenLease, isLoading: false }) }));
jest.mock("hooks/useTheme", () => ({ useColors: () => ({ colors: { primary: "#376BF5", textPrimary: "#333333", gray300: "#BDBDBD" } }) }));
jest.mock("components/display/PerkItem", () => ({ __esModule: true, default: () => null }));
jest.mock("components/layout/StandardHeader", () => ({ __esModule: true, default: () => null }));
jest.mock("components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: function Screen({ children }: { children: ReactNode }) { return <View>{children}</View>; } };
});
jest.mock("heroui-native", () => {
  const { Pressable, Text, View } = jest.requireActual<typeof import("react-native")>("react-native");
  const Button = ({ isDisabled, ...props }: PressableProps & { isDisabled?: boolean }) => <Pressable accessibilityRole="button" disabled={isDisabled} {...props} />;
  Button.Label = function Label(props: TextProps) { return <Text {...props} />; };
  return { Button, Separator: View, Spinner: View };
});

beforeEach(() => { jest.clearAllMocks(); mockTenancy = tenancy; mockLoading = false; mockError = null; });

it("places Ratings & Reviews immediately after the lease action and opens the current apartment", () => {
  const screen = render(<CurrentApartmentDetails />);
  const actions = screen.getAllByRole("button");
  expect(actions).toHaveLength(2);
  expect(actions[0]).toBe(screen.getByRole("button", { name: "View Lease Agreement" }));
  expect(actions[1]).toBe(screen.getByRole("button", { name: "Ratings & Reviews" }));
  fireEvent.press(actions[1]);
  expect(mockPush).toHaveBeenCalledWith({ pathname: "/apartment/[apartmentId]/ratings", params: { apartmentId: "cozy-cove" } });
  fireEvent.press(actions[0]);
  expect(mockOpenLease).toHaveBeenCalledWith("cozy-cove/lease.pdf");
});

it("keeps reviews available when there is no lease file", () => {
  mockTenancy = { ...tenancy, apartment: { ...apartment, lease_agreement_url: "" } };
  const screen = render(<CurrentApartmentDetails />);
  expect(screen.getByRole("button", { name: "View Lease Agreement" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Ratings & Reviews" })).toBeEnabled();
  fireEvent.press(screen.getByText("Ratings & Reviews"));
  expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ params: { apartmentId: "cozy-cove" } }));
});

it("uses the newly loaded current apartment rather than retaining a previous destination", () => {
  const screen = render(<CurrentApartmentDetails />);
  mockTenancy = { ...tenancy, apartment: { ...apartment, id: "new-current-apartment" } };
  screen.rerender(<CurrentApartmentDetails />);
  fireEvent.press(screen.getByText("Ratings & Reviews"));
  expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ params: { apartmentId: "new-current-apartment" } }));
});

it.each(["loading", "no tenancy", "error"])("does not offer review navigation during %s", state => {
  mockLoading = state === "loading";
  mockTenancy = state === "no tenancy" ? null : tenancy;
  mockError = state === "error" ? "Unable to load tenancy" : null;
  const screen = render(<CurrentApartmentDetails />);
  expect(screen.queryByText("Ratings & Reviews")).toBeNull();
  expect(mockPush).not.toHaveBeenCalled();
});
