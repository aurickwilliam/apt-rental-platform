import type { TextProps, ViewProps, PressableProps } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import PropertyActionMenu from "@/app/landlord/manage-apartment/[apartmentId]/components/PropertyActionMenu";
import PropertyCard from "@/app/(tabs)/components/units/PropertyCard";

jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("hooks/useTheme", () => ({ useColors: () => ({ colors: {} }) }));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: {} }) }));
jest.mock("@tabler/icons-react-native", () => ({ IconDotsVertical: () => null, IconLogout: () => null, IconCircleX: () => null, IconEye: () => null, IconEyeOff: () => null, IconShieldCheck: () => null }));
jest.mock("heroui-native", () => {
  const { View, Text, Pressable } = jest.requireActual<typeof import("react-native")>("react-native");
  const Button = ({ isDisabled, ...props }: PressableProps & { isDisabled?: boolean }) => <Pressable accessibilityRole="button" {...props} disabled={isDisabled} />;
  const Menu = Object.assign((props: ViewProps) => <View {...props} />, {
    Trigger: (props: ViewProps) => <View {...props} />,
    Portal: (props: ViewProps) => <View {...props} />,
    Overlay: () => null,
    Content: (props: ViewProps) => <View {...props} />,
    Label: (props: TextProps) => <Text {...props} />,
    ItemTitle: (props: TextProps) => <Text {...props} />,
    Item: Button,
  });
  const Card = Object.assign((props: ViewProps) => <View {...props} />, {
    Body: (props: ViewProps) => <View {...props} />,
    Title: (props: TextProps) => <Text {...props} />,
    Description: (props: TextProps) => <Text {...props} />,
  });
  const PressableFeedback = Object.assign((props: PressableProps) => <Pressable {...props} />, { Highlight: () => null });
  return { Button, Menu, Card, PressableFeedback };
});

it.each([false, true])("exposes the matching visibility action (hidden=%s)", async hidden => {
  const action = jest.fn();
  const screen = await render(<PropertyActionMenu onVacate={jest.fn()} onRemove={jest.fn()} isOccupied={false}
    visibilityLabel={hidden ? "Show Listing" : "Hide Listing"} isListingHidden={hidden} onVisibilityPress={action} />);
  await fireEvent.press(screen.getByText(hidden ? "Show Listing" : "Hide Listing"));
  expect(action).toHaveBeenCalledTimes(1);
});

it("does not render hide/show for an occupied property", async () => {
  const screen = await render(<PropertyActionMenu onVacate={jest.fn()} onRemove={jest.fn()} isOccupied />);
  expect(screen.queryByText("Hide Listing")).toBeNull();
  expect(screen.queryByText("Show Listing")).toBeNull();
});

it("shows maintenance hiding and administrator hiding as separate states on the unit card", async () => {
  const screen = await render(<PropertyCard apartmentName="Test unit" barangay="Barangay 1" city="Navotas" status="under_maintenance"
    isVerified isHiddenByAdmin thumbnailUrl={undefined} onPress={jest.fn()} monthlyRent={10000} />);
  expect(screen.getByText("Hidden · Under maintenance")).toBeTruthy();
  expect(screen.getByText("Hidden", { exact: true })).toBeTruthy();
});
