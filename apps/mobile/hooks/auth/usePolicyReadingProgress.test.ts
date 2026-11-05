import { act, renderHook } from "@testing-library/react-native";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { usePolicyReadingProgress } from "./usePolicyReadingProgress";

const layout = (height: number, y = 0) => ({ nativeEvent: { layout: { x: 0, y, width: 300, height } } }) as LayoutChangeEvent;
const scroll = (offsetY: number, contentHeight = 1200, viewportHeight = 400) => ({
  nativeEvent: {
    contentOffset: { x: 0, y: offsetY }, contentSize: { width: 300, height: contentHeight },
    layoutMeasurement: { width: 300, height: viewportHeight },
  },
}) as NativeSyntheticEvent<NativeScrollEvent>;

it("requires the loaded trailing marker, publishes readiness once, and completes once at the bottom", () => {
  const onRead = jest.fn();
  const { result } = renderHook(() => usePolicyReadingProgress(onRead));
  act(() => { result.current.onLayout(layout(400)); result.current.onContentSizeChange(300, 200); });
  expect(result.current.ready).toBe(false);
  act(() => result.current.onEndLayout(layout(1, 1183)));
  expect(result.current.ready).toBe(false);
  act(() => result.current.onContentSizeChange(300, 1200));
  expect(result.current.ready).toBe(true);
  act(() => result.current.onScroll(scroll(500)));
  expect(onRead).not.toHaveBeenCalled();
  act(() => { result.current.onScroll(scroll(800)); result.current.onScroll(scroll(810)); });
  expect(onRead).toHaveBeenCalledTimes(1);
});

it("recognizes an entirely visible short policy without requiring an impossible scroll", () => {
  const onRead = jest.fn();
  const { result } = renderHook(() => usePolicyReadingProgress(onRead));
  act(() => {
    result.current.onEndLayout(layout(1, 283)); result.current.onContentSizeChange(300, 300); result.current.onLayout(layout(400));
  });
  expect(onRead).toHaveBeenCalledTimes(1);
});

it("uses updated viewport/content geometry after rotation or larger text", () => {
  const onRead = jest.fn();
  const { result } = renderHook(() => usePolicyReadingProgress(onRead));
  act(() => {
    result.current.onLayout(layout(400)); result.current.onContentSizeChange(300, 1200); result.current.onEndLayout(layout(1, 1183));
    result.current.onScroll(scroll(500));
    result.current.onLayout(layout(250)); result.current.onContentSizeChange(300, 1800); result.current.onEndLayout(layout(1, 1783));
    result.current.onScroll(scroll(800, 1800, 250));
  });
  expect(onRead).not.toHaveBeenCalled();
  act(() => result.current.onScroll(scroll(1550, 1800, 250)));
  expect(onRead).toHaveBeenCalledTimes(1);
});

it("does not combine a resized viewport with a stale pre-rotation scroll offset", () => {
  const onRead = jest.fn();
  const { result } = renderHook(() => usePolicyReadingProgress(onRead));
  act(() => {
    result.current.onLayout(layout(400)); result.current.onContentSizeChange(300, 1200); result.current.onEndLayout(layout(1, 1183));
    result.current.onScroll(scroll(700));
    result.current.onLayout(layout(600));
  });
  expect(onRead).not.toHaveBeenCalled();
  act(() => {
    result.current.onContentSizeChange(300, 1800); result.current.onEndLayout(layout(1, 1783));
    result.current.onScroll(scroll(700, 1800, 600));
  });
  expect(onRead).not.toHaveBeenCalled();
  act(() => result.current.onScroll(scroll(1200, 1800, 600)));
  expect(onRead).toHaveBeenCalledTimes(1);
});

it("ignores queued native events from a closed document and disabled/reviewed readers", () => {
  const onRead = jest.fn();
  const { result, unmount } = renderHook(() => usePolicyReadingProgress(onRead));
  const retired = result.current;
  unmount();
  act(() => {
    retired.onLayout(layout(400)); retired.onContentSizeChange(300, 1200); retired.onEndLayout(layout(1, 1183)); retired.onScroll(scroll(800));
  });
  expect(onRead).not.toHaveBeenCalled();
  const disabled = renderHook(() => usePolicyReadingProgress(onRead, false));
  act(() => { disabled.result.current.onLayout(layout(400)); disabled.result.current.onContentSizeChange(300, 300); disabled.result.current.onEndLayout(layout(1, 283)); });
  expect(onRead).not.toHaveBeenCalled();
});
