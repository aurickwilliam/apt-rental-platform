import type { ReactNode } from "react";
import type { PressableProps, TextProps, ViewProps } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import AppUpdateDialog from "./AppUpdateDialog";

let mockRequestClose: ((open: boolean) => void) | undefined;
let mockSwipeable: boolean | undefined;

jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { secondaryForeground: "#FFFFFF" } }) }));
jest.mock("@tabler/icons-react-native", () => ({ IconDownload: () => null }));
jest.mock("heroui-native", () => {
  const { View, Text, Pressable } = jest.requireActual<typeof import("react-native")>("react-native");
  const Dialog = ({ isOpen, onOpenChange, children }: { isOpen: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) => {
    mockRequestClose = onOpenChange;
    return isOpen ? <View>{children}</View> : null;
  };
  Dialog.Portal = function Portal(props: ViewProps) { return <View {...props} />; };
  Dialog.Overlay = function Overlay(props: ViewProps) { return <View {...props} />; };
  Dialog.Content = function Content({ isSwipeable, ...props }: ViewProps & { isSwipeable?: boolean }) {
    mockSwipeable = isSwipeable;
    return <View {...props} />;
  };
  Dialog.Close = function Close(props: PressableProps) { return <Pressable {...props} />; };
  Dialog.Title = function Title(props: TextProps) { return <Text {...props} />; };
  Dialog.Description = function Description(props: TextProps) { return <Text {...props} />; };
  const Button = (props: PressableProps) => <Pressable accessibilityRole="button" {...props} />;
  Button.Label = function Label(props: TextProps) { return <Text {...props} />; };
  return { Dialog, Button };
});

function renderDialog() {
  const onUpdate = jest.fn();
  const onDismiss = jest.fn();
  const screen = render(
    <AppUpdateDialog latestVersion="1.3.0" releaseNotes="Fixes" errorMessage={null} onUpdate={onUpdate} onDismiss={onDismiss} />,
  );
  return { screen, onUpdate, onDismiss };
}

it("cannot be closed by the close button, a backdrop tap, a swipe or the back button", () => {
  const { screen, onDismiss } = renderDialog();
  expect(screen.queryByLabelText("Close")).toBeNull();
  expect(mockSwipeable).toBe(false);
  mockRequestClose?.(false);
  expect(onDismiss).not.toHaveBeenCalled();
});

it("closes only through Maybe later and opens the download through Update", () => {
  const { screen, onUpdate, onDismiss } = renderDialog();
  fireEvent.press(screen.getByText("Update"));
  expect(onUpdate).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByText("Maybe later"));
  expect(onDismiss).toHaveBeenCalledTimes(1);
});
