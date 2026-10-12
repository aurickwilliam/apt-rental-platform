import { fireEvent, render, screen } from "@testing-library/react-native";

import AppearanceSheet, { getThemeModeLabel } from "./AppearanceSheet";

jest.mock("heroui-native", () => {
  const React = jest.requireActual("react");
  const { Pressable, Text, View } = jest.requireActual("react-native");
  const GroupContext = React.createContext({ value: undefined, onValueChange: () => {} });

  const BottomSheet = Object.assign(
    ({ isOpen, children }: any) => (isOpen ? <View>{children}</View> : null),
    {
      Portal: ({ children }: any) => <View>{children}</View>,
      Overlay: () => null,
      Content: ({ children }: any) => <View>{children}</View>,
    }
  );

  const RadioGroup = Object.assign(
    ({ value, onValueChange, children }: any) => (
      <GroupContext.Provider value={{ value, onValueChange }}>
        <View accessibilityRole="radiogroup">{children}</View>
      </GroupContext.Provider>
    ),
    {
      Item: ({ value, children, accessibilityLabel }: any) => {
        const group = React.useContext(GroupContext);
        const isSelected = group.value === value;
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ checked: isSelected }}
            onPress={() => group.onValueChange(value)}
          >
            {children}
          </Pressable>
        );
      },
    }
  );

  return {
    BottomSheet,
    RadioGroup,
    Radio: Object.assign(() => null, { Indicator: () => null }),
    Label: ({ children }: any) => <Text>{children}</Text>,
    Description: ({ children }: any) => <Text>{children}</Text>,
  };
});

function setup(themeMode: "system" | "light" | "dark" = "system") {
  const onSelect = jest.fn();
  const onOpenChange = jest.fn();
  render(
    <AppearanceSheet isOpen onOpenChange={onOpenChange} themeMode={themeMode} onSelect={onSelect} />
  );
  return { onSelect, onOpenChange };
}

describe("AppearanceSheet", () => {
  it("offers System, Light and Dark as distinct radio choices", () => {
    setup();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(screen.getByLabelText(/^System\./)).toBeTruthy();
    expect(screen.getByLabelText(/^Light\./)).toBeTruthy();
    expect(screen.getByLabelText(/^Dark\./)).toBeTruthy();
    expect(screen.getByText("Match your device settings")).toBeTruthy();
  });

  it.each([
    ["system", /^System\./],
    ["light", /^Light\./],
    ["dark", /^Dark\./],
  ] as const)("marks only the saved %s choice as selected", (mode, label) => {
    setup(mode);

    const checked = screen.getAllByRole("radio").filter((r) => r.props.accessibilityState?.checked);
    expect(checked).toHaveLength(1);
    expect(screen.getByLabelText(label).props.accessibilityState.checked).toBe(true);
  });

  it("applies a choice immediately and closes the sheet", () => {
    const { onSelect, onOpenChange } = setup("system");

    fireEvent.press(screen.getByLabelText(/^Dark\./));

    expect(onSelect).toHaveBeenCalledWith("dark");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("can return to System after a manual choice", () => {
    const { onSelect } = setup("dark");

    fireEvent.press(screen.getByLabelText(/^System\./));

    expect(onSelect).toHaveBeenCalledWith("system");
  });

  it("labels the selected preference for the Settings row", () => {
    expect(getThemeModeLabel("system")).toBe("System");
    expect(getThemeModeLabel("light")).toBe("Light");
    expect(getThemeModeLabel("dark")).toBe("Dark");
  });
});
