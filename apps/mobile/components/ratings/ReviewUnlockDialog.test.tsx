import type { ReactNode } from "react";
import type { PressableProps, TextProps, ViewProps } from "react-native";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import ReviewUnlockDialog from "./ReviewUnlockDialog";

let mockHeight = 640;
jest.mock("react-native-safe-area-context", () => ({ SafeAreaInsetsContext: jest.requireActual<typeof import("react")>("react").createContext({ top: 24, bottom: 24, left: 0, right: 0 }) }));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { primary: "#376BF5", rating: "#FBBF24", secondaryForeground: "#FFFFFF" } }) }));
jest.mock("@tabler/icons-react-native", () => ({ IconHomeFilled: () => null, IconPencil: () => null, IconStarFilled: () => null }));
jest.mock("heroui-native", () => {
  const { View, Text, Pressable } = jest.requireActual<typeof import("react-native")>("react-native");
  const Dialog = ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) => isOpen ? <View>{children}</View> : null;
  Dialog.Portal = function Portal(props: ViewProps) { return <View {...props} />; };
  Dialog.Overlay = function Overlay(props: ViewProps) { return <View {...props} />; };
  Dialog.Content = function Content(props: ViewProps) { return <View {...props} testID="dialog-content" />; };
  Dialog.Close = function Close(props: PressableProps) { return <Pressable {...props} />; };
  Dialog.Title = function Title(props: TextProps) { return <Text {...props} />; };
  Dialog.Description = function Description(props: TextProps) { return <Text {...props} />; };
  const Button = (props: PressableProps) => <Pressable accessibilityRole="button" {...props} />;
  Button.Label = function Label(props: TextProps) { return <Text {...props} />; };
  return { Dialog, Button };
});

it.each([{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 320 }])("bounds the card and scrolls the body at $width x $height without scrolling its actions", ({ width, height }) => {
  mockHeight = height;
  const native = jest.requireActual<typeof import("react-native")>("react-native");
  const dimensions = jest.spyOn(native, "useWindowDimensions").mockReturnValue({ width, height: mockHeight, scale: 1, fontScale: 1.5 });
  const dismiss = jest.fn(); const review = jest.fn();
  const screen = render(<ReviewUnlockDialog isOpen apartmentName={"LongApartmentName".repeat(12)} onDismiss={dismiss} onReview={review} />);
  const card = screen.getByTestId("dialog-content");
  expect(StyleSheet.flatten(card.props.style).maxHeight).toBe(height - 88);
  const scroll = screen.UNSAFE_getByType(native.ScrollView);
  expect(scroll.findAllByType(native.Pressable)).toHaveLength(0);
  expect(StyleSheet.flatten(scroll.props.style).flexShrink).toBe(1);
  const action = screen.getByRole("button", { name: "Write a Review" });
  expect(StyleSheet.flatten(action.props.style)?.flex).toBe(width > height ? 1 : undefined);
  fireEvent.press(screen.getByText("Write a Review"));
  fireEvent.press(screen.getByText("Maybe later"));
  expect(review).toHaveBeenCalledTimes(1); expect(dismiss).toHaveBeenCalledTimes(1);
  const close = screen.getByLabelText("Close");
  expect(StyleSheet.flatten(close.props.style)).toMatchObject({ width: 44, height: 44 });
  dimensions.mockRestore();
});

it("does not render a closed prompt", () => {
  const screen = render(<ReviewUnlockDialog isOpen={false} apartmentName="Cozy Cove" onDismiss={() => {}} onReview={() => {}} />);
  expect(screen.queryByText("Write a Review")).toBeNull();
});
