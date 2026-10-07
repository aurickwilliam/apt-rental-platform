import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import ScreenWrapper from "./ScreenWrapper";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("react-native-keyboard-aware-scroll-view", () => {
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

  const control = screen.getByTestId("scroll-view").props.refreshControl;
  expect(control.props).toMatchObject({
    refreshing: true,
    tintColor: "transparent",
    colors: ["transparent"],
    progressBackgroundColor: "transparent",
  });
  control.props.onRefresh();
  expect(onRefresh).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText("Refreshing")).toBeTruthy();

  rerender(
    <ScreenWrapper scrollable refreshing={false} onRefresh={onRefresh}>
      <Text>Documents</Text>
    </ScreenWrapper>,
  );
  expect(screen.queryByLabelText("Refreshing")).toBeNull();
});
