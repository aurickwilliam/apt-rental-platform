import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type TextProps, type ViewStyle } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import RenewalFileButton from "@/components/renewals/RenewalFileButton";
import { FONT_FAMILIES } from "@repo/constants";
import { queryAllByHostType } from "../../tests/support/testTraversal";

interface ButtonStubProps {
  children: ReactNode;
  onPress: () => void;
  isDisabled?: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

// Keep native Text and Pressable props intact: the usual shared HeroUI stub
// intentionally drops layout props and cannot guard this wrapping contract.
jest.mock("heroui-native", () => {
  const { Pressable, Text } = jest.requireActual("react-native");
  function ButtonStub({ children, onPress, isDisabled, accessibilityLabel, style }: ButtonStubProps) {
    return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!isDisabled }} disabled={isDisabled} onPress={onPress} style={style}>{children}</Pressable>;
  }
  function LabelStub(props: TextProps) { return <Text {...props} />; }
  return { Button: Object.assign(ButtonStub, { Label: LabelStub }) };
});
jest.mock("@tabler/icons-react-native", () => ({ IconFileText: () => null }));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { textPrimary: "#333333", secondaryForeground: "#FFFFFF" } }) }));

it.each([
  "View original agreement", "View supporting document", "View renewal agreement",
  "View preserved agreement", "Upload signed agreement", "Add document", "Change document",
])("keeps the full visible and accessible file-action label: %s", async (label) => {
  const onPress = jest.fn();
  await render(<RenewalFileButton label={label} onPress={onPress} />);
  expect(screen.getByText(label)).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: label }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it.each([240, 320])("gives the wrapping label a bounded row in a %spx parent", async (width) => {
  await render(<View style={{ width }}><RenewalFileButton label="View supporting document" onPress={jest.fn()} /></View>);
  const button = screen.getByRole("button", { name: "View supporting document" });
  const label = screen.getByText("View supporting document");
  expect(StyleSheet.flatten(button.props.style)).toEqual(expect.objectContaining({ height: "auto", minHeight: 48, paddingVertical: 12 }));
  expect(label.props.numberOfLines).toBe(0);
  expect(label.props.textBreakStrategy).toBe("simple");
  expect(label.props.allowFontScaling).not.toBe(false);
  expect(StyleSheet.flatten(label.props.style)).toEqual(expect.objectContaining({ flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0, textAlign: "center", fontFamily: FONT_FAMILIES.nunito.semiBold }));
  const rows = queryAllByHostType(screen.root!, "View").filter(
    (node) => StyleSheet.flatten(node.props.style)?.flexDirection === "row",
  );
  expect(rows.some((node) => StyleSheet.flatten(node.props.style)?.width === "100%")).toBe(true);
  const iconSpaces = queryAllByHostType(screen.root!, "View").filter(
    (node) => node.props.importantForAccessibility === "no-hide-descendants",
  );
  expect(iconSpaces).toHaveLength(2);
  for (const space of iconSpaces) expect(StyleSheet.flatten(space.props.style)).toEqual({ width: 18, flexShrink: 0 });
});

it("keeps the same label space after data refreshes, width changes and disabled-state transitions", async () => {
  const onPress = jest.fn();
  const view = await render(<View style={{ width: 320 }}><RenewalFileButton label="View original agreement" onPress={onPress} /></View>);
  const initialLabel = StyleSheet.flatten(screen.getByText("View original agreement").props.style);
  for (const [width, disabled, label] of [
    [240, true, "View renewal agreement"], [320, false, "View renewal agreement"],
    [240, false, "View supporting document"], [320, true, "View supporting document"],
  ] as const) {
    await view.rerender(<View style={{ width }}><RenewalFileButton label={label} onPress={onPress} isDisabled={disabled} /></View>);
    const text = screen.getByText(label);
    expect(StyleSheet.flatten(text.props.style)).toEqual(initialLabel);
    expect(text.props.numberOfLines).toBe(0);
    const button = screen.getByRole("button", { name: label });
    expect(button.props.accessibilityState.disabled).toBe(disabled);
    expect(StyleSheet.flatten(button.props.style).height).toBe("auto");
  }
});

it("preserves disabled behavior and the full label while an operation is running", async () => {
  const onPress = jest.fn();
  await render(<RenewalFileButton label="View renewal agreement" isDisabled onPress={onPress} />);
  const button = screen.getByRole("button", { name: "View renewal agreement" });
  expect(button).toBeDisabled();
  await fireEvent.press(button);
  expect(onPress).not.toHaveBeenCalled();
  expect(screen.getByText("View renewal agreement")).toBeTruthy();
});
