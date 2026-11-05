import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { hasReachedPolicyEnd, isPolicyLayoutReady, type PolicyReadingMeasurements } from "@/utils/policyReadingProgress";

/** One mounted document/opening. Native events update refs, not React on every frame. */
export function usePolicyReadingProgress(onRead: () => void, enabled = true) {
  const measurements = useRef<PolicyReadingMeasurements>({ viewportHeight: 0, contentHeight: 0, endY: 0, offsetY: 0 });
  const lifetime = useRef({ retired: false, ready: false, completed: false });
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    lifetime.current.retired = false;
    const current = lifetime.current;
    return () => { current.retired = true; };
  }, []);

  const evaluate = useCallback(() => {
    if (!enabled || lifetime.current.retired || lifetime.current.completed) return;
    if (!isPolicyLayoutReady(measurements.current)) return;
    if (!lifetime.current.ready) {
      lifetime.current.ready = true;
      setReady(true);
    }
    if (hasReachedPolicyEnd(measurements.current)) {
      lifetime.current.completed = true;
      onRead();
    }
  }, [enabled, onRead]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    // Rotation/keyboard/text reflow may report size before the native offset.
    // Do not combine the new size with an offset from the previous geometry.
    if (measurements.current.viewportHeight !== height) measurements.current.offsetY = 0;
    measurements.current.viewportHeight = height;
    evaluate();
  }, [evaluate]);
  const onContentSizeChange = useCallback((_width: number, height: number) => {
    if (measurements.current.contentHeight !== height) measurements.current.offsetY = 0;
    measurements.current.contentHeight = height;
    evaluate();
  }, [evaluate]);
  const onEndLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    measurements.current.endY = y + height;
    evaluate();
  }, [evaluate]);
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (lifetime.current.completed || lifetime.current.retired) return;
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    measurements.current.offsetY = contentOffset.y;
    measurements.current.contentHeight = contentSize.height;
    measurements.current.viewportHeight = layoutMeasurement.height;
    evaluate();
  }, [evaluate]);

  return { ready, onLayout, onContentSizeChange, onEndLayout, onScroll };
}
