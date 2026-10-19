import { RefreshControl } from "react-native";
import { render, screen } from "@testing-library/react-native";

import {
  PullToRefreshControl,
  PullToRefreshIndicator,
} from "./PullToRefresh";

jest.mock("hooks/useTheme", () => ({
  useColors: () => ({ colors: { primary: "#376BF5" } }),
}));

jest.mock("heroui-native", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    Spinner: ({ accessibilityLabel }: { accessibilityLabel?: string }) =>
      React.createElement(View, { accessibilityLabel }),
  };
});

describe("PullToRefresh", () => {
  it("hides the native indicator while preserving the refresh gesture", () => {
    const onRefresh = jest.fn();
    const { UNSAFE_getByType } = render(
      <PullToRefreshControl refreshing={false} onRefresh={onRefresh} />,
    );

    const control = UNSAFE_getByType(RefreshControl);
    expect(control.props).toMatchObject({
      refreshing: false,
      tintColor: "transparent",
      colors: ["transparent"],
      progressBackgroundColor: "transparent",
    });

    control.props.onRefresh();
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("ignores repeats pulled while the caller's refresh is still running", () => {
    const onRefresh = jest.fn();
    const { rerender, UNSAFE_getByType } = render(
      <PullToRefreshControl refreshing={false} onRefresh={onRefresh} />,
    );

    UNSAFE_getByType(RefreshControl).props.onRefresh();
    expect(onRefresh).toHaveBeenCalledTimes(1);

    rerender(<PullToRefreshControl refreshing onRefresh={onRefresh} />);
    UNSAFE_getByType(RefreshControl).props.onRefresh();
    expect(onRefresh).toHaveBeenCalledTimes(1);

    // Once the caller's state settles, the gesture works again.
    rerender(<PullToRefreshControl refreshing={false} onRefresh={onRefresh} />);
    UNSAFE_getByType(RefreshControl).props.onRefresh();
    expect(onRefresh).toHaveBeenCalledTimes(2);
  });

  it("shows only the HeroUI spinner while refreshing", () => {
    const { rerender } = render(<PullToRefreshIndicator refreshing />);
    expect(screen.getByLabelText("Refreshing")).toBeTruthy();

    rerender(<PullToRefreshIndicator refreshing={false} />);
    expect(screen.queryByLabelText("Refreshing")).toBeNull();
  });
});
