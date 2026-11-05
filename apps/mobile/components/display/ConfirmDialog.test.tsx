import type { ReactNode } from "react";
import type { PressableProps, TextProps, ViewProps } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import ConfirmDialog from "./ConfirmDialog";

let mockChangeOpen: ((open: boolean) => void) | undefined;
jest.mock("@tabler/icons-react-native", () => ({ IconCheck: () => null }));
jest.mock("heroui-native", () => {
  const { View, Text, Pressable } = jest.requireActual<typeof import("react-native")>("react-native");
  const Dialog = ({ isOpen, onOpenChange, children }: { isOpen: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) => {
    mockChangeOpen = onOpenChange;
    return isOpen ? <View>{children}</View> : null;
  };
  Dialog.Portal = function Portal(props: ViewProps) { return <View {...props} />; };
  Dialog.Content = function Content(props: ViewProps) { return <View {...props} />; };
  Dialog.Title = function Title(props: TextProps) { return <Text {...props} />; };
  Dialog.Description = function Description(props: TextProps) { return <Text {...props} />; };
  Dialog.Overlay = function Overlay() { return <Pressable testID="overlay" onPress={() => mockChangeOpen?.(false)} />; };
  Dialog.Close = function Close({ isDisabled, ...props }: PressableProps & { isDisabled?: boolean }) { return <Pressable {...props} disabled={isDisabled} />; };
  const Button = ({ isDisabled, ...props }: PressableProps & { isDisabled?: boolean }) => <Pressable accessibilityRole="button" {...props} disabled={isDisabled} />;
  Button.Label = function Label(props: TextProps) { return <Text {...props} />; };
  return { Dialog, Button };
});

const props = { isOpen: true, title: "Hide Listing", description: "Your property will not be deleted.", confirmLabel: "Hide Listing", onConfirm: jest.fn(), onOpenChange: jest.fn() };
beforeEach(() => jest.clearAllMocks());

it("preserves ordinary confirmation and cancel behavior", () => {
  const screen = render(<ConfirmDialog {...props} />);
  fireEvent.press(screen.getByRole("button", { name: "Hide Listing" }));
  expect(props.onConfirm).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
  expect(props.onOpenChange).toHaveBeenCalledWith(false);
});

it("blocks confirm, cancel, close, and backdrop dismissal while pending", () => {
  const screen = render(<ConfirmDialog {...props} isPending />);
  fireEvent.press(screen.getByRole("button", { name: "Hide Listing" }));
  fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
  fireEvent.press(screen.getByLabelText("Close"));
  fireEvent.press(screen.getByTestId("overlay"));
  expect(props.onConfirm).not.toHaveBeenCalled();
  expect(props.onOpenChange).not.toHaveBeenCalled();
});

it("shows a database refusal as an accessible inline error", () => {
  const screen = render(<ConfirmDialog {...props} errorMessage="This property has an active tenancy." />);
  expect(screen.getByRole("alert").props.children).toBe("This property has an active tenancy.");
});
