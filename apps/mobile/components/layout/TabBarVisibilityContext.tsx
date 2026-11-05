import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import {
  ReduceMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useFocusEffect, useScrollToTop } from 'expo-router';

import { nextTabBarVisibility } from './tabBarVisibility';

const TAB_BAR_TOGGLE_DURATION_MS = 220;

type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

interface TabBarVisibilityValue {
  /** 0 = shown, 1 = hidden. */
  progress: SharedValue<number>;
  setHidden: (hidden: boolean) => void;
  onScroll: (event: ScrollEvent) => void;
}

const TabBarVisibilityContext = createContext<TabBarVisibilityValue | null>(null);

export function TabBarVisibilityProvider({ children }: { children: ReactNode }) {
  const progress = useSharedValue(0);
  const hiddenRef = useRef(false);
  const lastYRef = useRef(0);

  const setHidden = useCallback(
    (hidden: boolean) => {
      if (hiddenRef.current === hidden) return;
      hiddenRef.current = hidden;
      progress.set(
        withTiming(hidden ? 1 : 0, {
          duration: TAB_BAR_TOGGLE_DURATION_MS,
          reduceMotion: ReduceMotion.System,
        })
      );
    },
    [progress]
  );

  const onScroll = useCallback(
    (event: ScrollEvent) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const y = contentOffset.y;
      const hidden = nextTabBarVisibility({
        prevY: lastYRef.current,
        y,
        contentHeight: contentSize.height,
        layoutHeight: layoutMeasurement.height,
        hidden: hiddenRef.current,
      });
      lastYRef.current = y;
      setHidden(hidden);
    },
    [setHidden]
  );

  const value = useMemo(
    () => ({ progress, setHidden, onScroll }),
    [progress, setHidden, onScroll]
  );

  return (
    <TabBarVisibilityContext.Provider value={value}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

/** Returns null outside the provider (iOS native tabs, tests). */
export function useTabBarVisibility(): TabBarVisibilityValue | null {
  return useContext(TabBarVisibilityContext);
}

const noopScroll = () => {};

/**
 * Scroll handler for a tab screen's scroller. A no-op outside the Android
 * tab layouts, so screens can always pass it. Pair it with
 * `scrollEventThrottle={16}`.
 */
export function useTabBarScrollHandler(): (event: ScrollEvent) => void {
  return useContext(TabBarVisibilityContext)?.onScroll ?? noopScroll;
}

/** Reveals the bar whenever the calling screen gains focus. */
export function useShowTabBarOnFocus(): void {
  const context = useContext(TabBarVisibilityContext);
  useFocusEffect(
    useCallback(() => {
      context?.setHidden(false);
    }, [context])
  );
}

/**
 * Everything a tab screen's main scroller needs in one call: hide-on-scroll,
 * reveal on focus, and scroll-to-top when the active tab is tapped again.
 * Attach `ref` and `onScroll` (with `scrollEventThrottle={16}`) to the scroller.
 */
export function useTabScreenScroll<T = unknown>() {
  const ref = useRef<T>(null);
  const onScroll = useTabBarScrollHandler();
  useShowTabBarOnFocus();
  // The scroller types (ScrollView, FlatList, keyboard-aware) all satisfy
  // useScrollToTop's structural check at runtime.
  useScrollToTop(ref as never);
  return { ref, onScroll };
}
