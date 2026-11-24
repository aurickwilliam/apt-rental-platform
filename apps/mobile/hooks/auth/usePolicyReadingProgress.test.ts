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

it("requires the loaded trailing marker, publishes readiness once, and completes once at the bottom", async () => {
  const onRead = jest.fn();
  const { result } = await renderHook(() => usePolicyReadingProgress(onRead));
  await act(() => { result.current.onLayout(layout(400)); result.current.onContentSizeChange(300, 200); });
  expect(result.current.ready).toBe(false);
  await act(() => result.current.onEndLayout(layout(1, 1183)));
  expect(result.current.ready).toBe(false);
  await act(() => result.current.onContentSizeChange(300, 1200));
  expect(result.current.ready).toBe(true);
  await act(() => result.current.onScroll(scroll(500)));
  expect(onRead).not.toHaveBeenCalled();
  await act(() => { result.current.onScroll(scroll(800)); result.current.onScroll(scroll(810)); });
  expect(onRead).toHaveBeenCalledTimes(1);
});

it("recognizes an entirely visible short policy without requiring an impossible scroll", async () => {
  const onRead = jest.fn();
  const { result } = await renderHook(() => usePolicyReadingProgress(onRead));
  await act(() => {
    result.current.onEndLayout(layout(1, 283)); result.current.onContentSizeChange(300, 300); result.current.onLayout(layout(400));
  });
  expect(onRead).toHaveBeenCalledTimes(1);
});

it("unlocks on the first bottom arrival even when final content/marker layout arrives after scrolling", async () => {
  const onRead = jest.fn();
  const { result } = await renderHook(() => usePolicyReadingProgress(onRead));
  await act(() => {
    result.current.onLayout(layout(400));
    result.current.onContentSizeChange(300, 1200);
    result.current.onScroll(scroll(800));
  });
  expect(onRead).not.toHaveBeenCalled();
  await act(() => {
    // Final 16px padding is reported after the last scroll sample. The actual
    // document end is already visible and must not require another gesture.
    result.current.onContentSizeChange(300, 1216);
    result.current.onEndLayout(layout(1, 1199));
  });
  expect(onRead).toHaveBeenCalledTimes(1);
});

it.each(["onScrollEndDrag", "onMomentumScrollEnd"] as const)("uses the complete %s sample if throttling missed the final scroll event", async (eventName) => {
  const onRead = jest.fn();
  const { result } = await renderHook(() => usePolicyReadingProgress(onRead));
  await act(() => {
    result.current.onLayout(layout(400)); result.current.onContentSizeChange(300, 1200); result.current.onEndLayout(layout(1, 1183));
    result.current.onScroll(scroll(750));
  });
  expect(onRead).not.toHaveBeenCalled();
  await act(() => result.current[eventName](scroll(800)));
  expect(onRead).toHaveBeenCalledTimes(1);
});

it("uses updated viewport/content geometry after rotation or larger text", async () => {
  const onRead = jest.fn();
  const { result } = await renderHook(() => usePolicyReadingProgress(onRead));
  await act(() => {
    result.current.onLayout(layout(400)); result.current.onContentSizeChange(300, 1200); result.current.onEndLayout(layout(1, 1183));
    result.current.onScroll(scroll(500));
    result.current.onLayout(layout(250)); result.current.onContentSizeChange(300, 1800); result.current.onEndLayout(layout(1, 1783));
    result.current.onScroll(scroll(800, 1800, 250));
  });
  expect(onRead).not.toHaveBeenCalled();
  await act(() => result.current.onScroll(scroll(1550, 1800, 250)));
  expect(onRead).toHaveBeenCalledTimes(1);
});

it("does not combine a resized viewport with a stale pre-rotation scroll offset", async () => {
  const onRead = jest.fn();
  const { result } = await renderHook(() => usePolicyReadingProgress(onRead));
  await act(() => {
    result.current.onLayout(layout(400)); result.current.onContentSizeChange(300, 1200); result.current.onEndLayout(layout(1, 1183));
    result.current.onScroll(scroll(700));
    result.current.onLayout(layout(600));
  });
  expect(onRead).not.toHaveBeenCalled();
  await act(() => {
    result.current.onContentSizeChange(300, 1800); result.current.onEndLayout(layout(1, 1783));
    result.current.onScroll(scroll(700, 1800, 600));
  });
  expect(onRead).not.toHaveBeenCalled();
  await act(() => result.current.onScroll(scroll(1200, 1800, 600)));
  expect(onRead).toHaveBeenCalledTimes(1);
});

it("ignores queued native events from a closed document and disabled/reviewed readers", async () => {
  const onRead = jest.fn();
  const { result, unmount } = await renderHook(() => usePolicyReadingProgress(onRead));
  const retired = result.current;
  await unmount();
  await act(() => {
    retired.onLayout(layout(400)); retired.onContentSizeChange(300, 1200); retired.onEndLayout(layout(1, 1183)); retired.onScroll(scroll(800));
  });
  expect(onRead).not.toHaveBeenCalled();
  const disabled = await renderHook(() => usePolicyReadingProgress(onRead, false));
  await act(() => { disabled.result.current.onLayout(layout(400)); disabled.result.current.onContentSizeChange(300, 300); disabled.result.current.onEndLayout(layout(1, 283)); });
  expect(onRead).not.toHaveBeenCalled();
});
