import { cloneElement, createRef } from "react";
import { RefreshControl, View } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { spyOnClassComponent } from "../../tests/support/classComponentProps";

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
  let refreshControl: ReturnType<typeof spyOnClassComponent>;
  beforeEach(() => { refreshControl = spyOnClassComponent(RefreshControl); });
  afterEach(() => refreshControl.restore());

  it("preserves the children, layout and ref injected by Android scroll containers", async () => {
    const ref = createRef<RefreshControl>();
    const style = { flex: 1, marginTop: 8 };
    const onRefresh = jest.fn();
    // Android ScrollView clones refreshControl with its native scroll view as
    // the child; Gesture Handler's list also clones it with a ref.
    const control = cloneElement(
      <PullToRefreshControl refreshing={false} onRefresh={onRefresh} />,
      { ref, style },
      <View testID="native-scroll-content" />,
    );
    const { unmount } = await render(control);
    const nativeControl = { props: refreshControl.latestProps(), instance: refreshControl.latest() };

    expect(nativeControl.props.style).toEqual(style);
    expect(nativeControl.props.children).toEqual(
      <View testID="native-scroll-content" />,
    );
    expect(ref.current).toBe(nativeControl.instance);
    expect(ref.current).not.toBeNull();

    nativeControl.props.onRefresh();
    expect(onRefresh).toHaveBeenCalledTimes(1);
    await unmount();
    expect(ref.current).toBeNull();
  });

  it("hides the native indicator while preserving the refresh gesture", async () => {
    const onRefresh = jest.fn();
    await render(
      <PullToRefreshControl refreshing={false} onRefresh={onRefresh} />,
    );

    const control = { props: refreshControl.latestProps() };
    expect(control.props).toMatchObject({
      refreshing: false,
      tintColor: "transparent",
      colors: ["transparent"],
      progressBackgroundColor: "transparent",
    });

    control.props.onRefresh();
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("ignores repeats pulled while the caller's refresh is still running", async () => {
    const onRefresh = jest.fn();
    const { rerender } = await render(
      <PullToRefreshControl refreshing={false} onRefresh={onRefresh} />,
    );

    refreshControl.latestProps().onRefresh();
    expect(onRefresh).toHaveBeenCalledTimes(1);

    await rerender(<PullToRefreshControl refreshing onRefresh={onRefresh} />);
    refreshControl.latestProps().onRefresh();
    expect(onRefresh).toHaveBeenCalledTimes(1);

    // Once the caller's state settles, the gesture works again.
    await rerender(<PullToRefreshControl refreshing={false} onRefresh={onRefresh} />);
    refreshControl.latestProps().onRefresh();
    expect(onRefresh).toHaveBeenCalledTimes(2);
  });

  it("shows only the HeroUI spinner while refreshing", async () => {
    const { rerender } = await render(<PullToRefreshIndicator refreshing />);
    expect(screen.getByLabelText("Refreshing")).toBeTruthy();

    await rerender(<PullToRefreshIndicator refreshing={false} />);
    expect(screen.queryByLabelText("Refreshing")).toBeNull();
  });
});
