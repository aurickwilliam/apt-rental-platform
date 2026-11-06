import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { hasReachedPolicyEnd, isPolicyLayoutReady, POLICY_SCROLL_TOLERANCE, type PolicyReadingMeasurements } from "@/utils/policyReadingProgress";

/** One mounted document/opening. Native events update refs, not React on every frame. */
export function usePolicyReadingProgress(onRead: () => void, enabled = true) {
  const measurements = useRef<PolicyReadingMeasurements>({ viewportHeight: 0, contentHeight: 0, endY: 0, offsetY: 0 });
  const lifetime = useRef({ retired: false, ready: false, completed: false, offsetViewportHeight: 0 });
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
    // Preserve the real offset across late size/marker callbacks, but never
    // combine it with a differently sized viewport after rotation. A fresh
    // scroll/drag-end/momentum-end sample supplies a coherent new position.
    if (lifetime.current.offsetViewportHeight > 0
      && Math.abs(lifetime.current.offsetViewportHeight - measurements.current.viewportHeight) > POLICY_SCROLL_TOLERANCE) return;
    if (hasReachedPolicyEnd(measurements.current)) {
      lifetime.current.completed = true;
      onRead();
    }
  }, [enabled, onRead]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    measurements.current.viewportHeight = event.nativeEvent.layout.height;
    evaluate();
  }, [evaluate]);
  const onContentSizeChange = useCallback((_width: number, height: number) => {
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
    lifetime.current.offsetViewportHeight = layoutMeasurement.height;
    evaluate();
  }, [evaluate]);

  return { ready, onLayout, onContentSizeChange, onEndLayout, onScroll, onScrollEndDrag: onScroll, onMomentumScrollEnd: onScroll };
}
