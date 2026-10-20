import { forwardRef, useCallback } from "react";
import { RefreshControl, View, type RefreshControlProps } from "react-native";

import { Spinner } from "heroui-native";

import { useColors } from "hooks/useTheme";

interface PullToRefreshControlProps
  extends Pick<RefreshControlProps, "children" | "style"> {
  onRefresh: () => void | Promise<void>;
  /**
   * The caller's refreshing state — the same value PullToRefreshIndicator
   * shows. While it is true, additional pulls are ignored instead of firing
   * onRefresh again into a refresh that is still running. It must NOT be
   * forwarded to the native RefreshControl: on iOS that animates the scroll
   * offset whenever it flips true (RCTRefreshControl
   * beginRefreshingProgrammatically), which would yank the list during
   * background-held loading states.
   */
  refreshing: boolean;
}

interface PullToRefreshIndicatorProps {
  refreshing: boolean;
}

/**
 * Keeps React Native's platform pull gesture while permanently suppressing its
 * indicator. Render PullToRefreshIndicator in the list or scroll content for
 * the visible, cross-platform HeroUI Native loading state.
 */
export const PullToRefreshControl = forwardRef<
  RefreshControl,
  PullToRefreshControlProps
>(function PullToRefreshControl({ onRefresh, refreshing, children, style }, ref) {
  const handleRefresh = useCallback(() => {
    if (refreshing) return;
    void onRefresh();
  }, [onRefresh, refreshing]);

  return (
    <RefreshControl
      ref={ref}
      style={style}
      refreshing={false}
      onRefresh={handleRefresh}
      tintColor="transparent"
      colors={["transparent"]}
      progressBackgroundColor="transparent"
    >
      {/* Android ScrollView injects its native scroll view here. Dropping it
          leaves Gesture Handler without a view to attach to. */}
      {children}
    </RefreshControl>
  );
});

export function PullToRefreshIndicator({ refreshing }: PullToRefreshIndicatorProps) {
  const { colors } = useColors();

  if (!refreshing) return null;

  return (
    <View className="items-center justify-center py-4" accessibilityRole="progressbar">
      <Spinner size="lg" color={colors.primary} accessibilityLabel="Refreshing" />
    </View>
  );
}
