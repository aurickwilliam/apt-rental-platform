import { RefreshControl, View } from "react-native";

import { Spinner } from "heroui-native";

import { useColors } from "hooks/useTheme";

interface PullToRefreshControlProps {
  onRefresh: () => void | Promise<void>;
}

interface PullToRefreshIndicatorProps {
  refreshing: boolean;
}

/**
 * Keeps React Native's platform pull gesture while permanently suppressing its
 * indicator. Render PullToRefreshIndicator in the list or scroll content for
 * the visible, cross-platform HeroUI Native loading state.
 */
export function PullToRefreshControl({ onRefresh }: PullToRefreshControlProps) {
  return (
    <RefreshControl
      refreshing={false}
      onRefresh={() => void onRefresh()}
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
