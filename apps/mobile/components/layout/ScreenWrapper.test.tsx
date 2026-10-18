import { render, screen } from "@testing-library/react-native";
import { Text, View } from "react-native";

import ScreenWrapper from "./ScreenWrapper";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("react-native-keyboard-controller", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { ScrollView } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return {
    KeyboardAwareScrollView: ({
      children,
      refreshControl,
    }: {
      children: React.ReactNode;
      refreshControl?: React.ComponentProps<typeof ScrollView>["refreshControl"];
    }) => React.createElement(ScrollView, { testID: "scroll-view", refreshControl }, children),
  };
});

jest.mock("hooks/useTheme", () => ({
  useColors: () => ({ colors: { primary: "#376BF5" } }),
}));

jest.mock("heroui-native", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return {
    Spinner: ({ accessibilityLabel }: { accessibilityLabel: string }) =>
      React.createElement(View, { accessibilityLabel }),
  };
});

it("uses the native gesture without either native indicator, showing only HeroUI while refreshing", () => {
  const onRefresh = jest.fn();
  const { rerender } = render(
    <ScreenWrapper scrollable refreshing onRefresh={onRefresh}>
      <Text>Documents</Text>
    </ScreenWrapper>,
  );

  const refreshControl = () => screen.getByTestId("scroll-view").props.refreshControl;
  expect(refreshControl().props).toMatchObject({ onRefresh, refreshing: true });
  expect(screen.getByLabelText("Refreshing")).toBeTruthy();

  rerender(
    <ScreenWrapper scrollable refreshing={false} onRefresh={onRefresh}>
      <Text>Documents</Text>
    </ScreenWrapper>,
  );
  expect(refreshControl().props).toMatchObject({ onRefresh, refreshing: false });
  expect(screen.queryByLabelText("Refreshing")).toBeNull();
});

it("defaults to the screen background, allows grouping, and preserves explicit overrides", () => {
  const { rerender, UNSAFE_getAllByType } = render(
    <ScreenWrapper><Text>Content</Text></ScreenWrapper>,
  );
  const container = () => UNSAFE_getAllByType(View)[0];
  expect(container().props.className).toBe("bg-background");

  rerender(
    <ScreenWrapper background="grouped"><Text>Content</Text></ScreenWrapper>,
  );
  expect(container().props.className).toBe("bg-grouped-background");

  rerender(
    <ScreenWrapper background="grouped" backgroundColor="#376BF5">
      <Text>Receipt</Text>
    </ScreenWrapper>,
  );
  expect(container().props.className).toBe("");
  expect(container().props.style).toMatchObject({ backgroundColor: "#376BF5" });
});
