import type { ComponentProps } from "react";
import { dirname, join } from "node:path";
import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import type {
  Input as HeroUIInput,
  TextArea as HeroUITextArea,
} from "heroui-native";

// Exercise the installed patched Input, not the app's usual HeroUI test stub.
// Only theme/context plumbing is replaced; the Input and its native styles are real.
const moduleRoot = join(
  dirname(require.resolve("heroui-native/package.json")),
  "lib/module",
);
jest.doMock(join(moduleRoot, "helpers/external/hooks/index.js"), () => ({
  useIsOnSurface: () => false,
}));
jest.doMock(join(moduleRoot, "helpers/external/utils/index.js"), () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(" "),
}));
jest.doMock(join(moduleRoot, "helpers/external/utils/cn.js"), () => ({
  tv:
    ({ base }: { base: string }) =>
    ({ className }: { className?: string } = {}) =>
      [base, className].filter(Boolean).join(" "),
}));
jest.doMock(join(moduleRoot, "helpers/internal/utils/index.js"), () => ({
  combineStyles: (styles: object) => styles,
}));
jest.doMock(join(moduleRoot, "helpers/internal/contexts/index.js"), () => ({
  useFormField: () => undefined,
}));
jest.doMock(join(moduleRoot, "helpers/internal/components/index.js"), () => {
  const { TextInput, View } = jest.requireActual("react-native");
  return {
    HeroTextInput: TextInput,
    ThemeBackground: View,
    useHasDefaultThemeBackground: () => false,
  };
});

const Input = jest.requireActual<{ default: typeof HeroUIInput }>(
  join(moduleRoot, "components/input/input.js"),
).default;
const TextArea = jest.requireActual<{ default: typeof HeroUITextArea }>(
  join(moduleRoot, "components/text-area/text-area.js"),
).default;

describe("shared HeroUI input alignment", () => {
  test.each(["6", "₱ 3,200", "Apartment name"])(
    "single-line value %s uses native font metrics without changing size or borders",
    (value) => {
      const onChangeText = jest.fn();
      const screen = render(
        <Input
          accessibilityLabel="Field"
          value={value}
          placeholder="Enter a value"
          onChangeText={onChangeText}
          style={{
            fontSize: 14,
            lineHeight: 20,
            fontFamily: "Inter_24pt-Regular",
            borderWidth: 2,
          }}
        />,
      );
      const field = screen.getByLabelText("Field");
      const style = StyleSheet.flatten(field.props.style);
      expect(style.lineHeight).toBeUndefined();
      expect(style.textAlignVertical).toBe("center");
      expect(style.includeFontPadding).toBe(false);
      expect(style.fontSize).toBe(14);
      expect(style.fontFamily).toBe("Inter_24pt-Regular");
      expect(style.borderWidth).toBe(2);
      expect(field.props.placeholder).toBe("Enter a value");
      expect(field.props.allowFontScaling).not.toBe(false);
      fireEvent.changeText(field, "123");
      expect(onChangeText).toHaveBeenCalledWith("123");
    },
  );

  test("TextArea preserves its multiline spacing and top alignment", () => {
    const screen = render(
      <TextArea
        accessibilityLabel="Description"
        value={"First line\nSecond line"}
        style={{ fontSize: 14, lineHeight: 20, paddingVertical: 8 }}
      />,
    );
    const field = screen.getByLabelText("Description");
    const style = StyleSheet.flatten(field.props.style);
    expect(field.props.multiline).toBe(true);
    expect(field.props.textAlignVertical).toBe("top");
    expect(style.lineHeight).toBe(20);
    expect(style.paddingVertical).toBe(8);
    expect(style.includeFontPadding).toBeUndefined();
  });

  test("error borders and accessibility font scaling survive focus", () => {
    const onFocus = jest.fn();
    const screen = render(
      <Input
        accessibilityLabel="Amount"
        isInvalid
        allowFontScaling
        maxFontSizeMultiplier={2}
        onFocus={onFocus}
        style={{ fontSize: 24, lineHeight: 32, borderColor: "#E50914", borderWidth: 2 }}
      />,
    );
    fireEvent(screen.getByLabelText("Amount"), "focus");
    expect(onFocus).toHaveBeenCalled();
    const field = screen.getByLabelText("Amount");
    expect(field.props.allowFontScaling).toBe(true);
    expect(field.props.maxFontSizeMultiplier).toBe(2);
    expect(StyleSheet.flatten(field.props.style)).toEqual(expect.objectContaining({
      fontSize: 24,
      lineHeight: undefined,
      borderColor: "#E50914",
      borderWidth: 2,
      textAlignVertical: "center",
    }));
  });

  test("a growing multiline Input keeps caller-provided spacing", () => {
    const props: ComponentProps<typeof Input> = {
      accessibilityLabel: "Message",
      multiline: true,
      textAlignVertical: "top",
      style: { lineHeight: 24, paddingVertical: 12 },
    };
    const screen = render(<Input {...props} />);
    const field = screen.getByLabelText("Message");
    expect(StyleSheet.flatten(field.props.style).lineHeight).toBe(24);
    expect(field.props.textAlignVertical).toBe("top");
  });
});
