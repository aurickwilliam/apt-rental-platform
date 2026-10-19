import { useCallback } from "react";
import { RefreshControl, View } from "react-native";

import { Spinner } from "heroui-native";

import { useColors } from "hooks/useTheme";

interface PullToRefreshControlProps {
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
export function PullToRefreshControl({
  onRefresh,
  refreshing,
}: PullToRefreshControlProps) {
  const handleRefresh = useCallback(() => {
    if (refreshing) return;
    void onRefresh();
  }, [onRefresh, refreshing]);

  return (
    <RefreshControl
      refreshing={false}
      onRefresh={handleRefresh}
      tintColor="transparent"
      colors={["transparent"]}
      progressBackgroundColor="transparent"
    />
  );
}

export function PullToRefreshIndicator({ refreshing }: PullToRefreshIndicatorProps) {
  const { colors } = useColors();

  if (!refreshing) return null;

  return (
    <View className="items-center justify-center py-4" accessibilityRole="progressbar">
      <Spinner size="lg" color={colors.primary} accessibilityLabel="Refreshing" />
    </View>
  );
}
