import { useEffect, useState } from 'react';
import { View, Text, Pressable, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from "expo-router/js-tabs";

import { useColors } from 'hooks/useTheme';

import { useTabBarVisibility } from './TabBarVisibilityContext';

export type TablerIconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

export type CustomTabConfig = {
  name: string;
  label: string;
  icon: TablerIconComponent;
  iconFilled: TablerIconComponent;
  /** Unread/pending count shown as a badge. Hidden at 0 or undefined. */
  badge?: number;
};

type Props = BottomTabBarProps & {
  tabs: CustomTabConfig[];
};

/**
 * Height of the floating tab bar pill itself (excluding safe-area bottom inset).
 * Use this as the base for bottomPadding on tab screens so content
 * scrolls fully past the bar.
 */
export const FLOATING_TAB_BAR_HEIGHT = 68;

/**
 * Total space the floating bar occupies at the bottom of the screen.
 * Screens should add their own insets.bottom on top of this when needed,
 * but ScreenWrapper already does that — so passing FLOATING_TAB_BAR_HEIGHT
 * as bottomPadding is sufficient.
 */
export const FLOATING_TAB_BAR_BOTTOM_OFFSET = 16;

const BAR_SIDE_MARGIN = 20;
const ROW_PADDING = 4;
const ROW_GAP = 12;
/** Extra travel so the shadow also leaves the screen when hidden. */
const HIDDEN_EXTRA_TRAVEL = 32;
const BADGE_MAX = 99;

const SPRING = { damping: 18, stiffness: 220, mass: 0.8, reduceMotion: ReduceMotion.System };

export function formatBadge(count: number): string {
  return count > BADGE_MAX ? `${BADGE_MAX}+` : String(count);
}

export function CustomTabBar({ state, navigation, tabs }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useColors();
  const visibility = useTabBarVisibility();
  const fallbackProgress = useSharedValue(0);
  const progress = visibility?.progress ?? fallbackProgress;

  const bottomOffset = Math.max(insets.bottom, FLOATING_TAB_BAR_BOTTOM_OFFSET);
  const hiddenTravel = FLOATING_TAB_BAR_HEIGHT + bottomOffset + HIDDEN_EXTRA_TRAVEL;

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [0, hiddenTravel], Extrapolation.CLAMP),
      },
    ],
    opacity: interpolate(progress.value, [0, 0.8, 1], [1, 0.4, 0], Extrapolation.CLAMP),
  }));

  // Only tabs that are configured are rendered, so the indicator follows that order.
  const visibleRoutes = state.routes.filter((route) =>
    tabs.some((tab) => tab.name === route.name)
  );
  const focusedRouteKey = state.routes[state.index]?.key;
  const focusedPosition = Math.max(
    0,
    visibleRoutes.findIndex((route) => route.key === focusedRouteKey)
  );

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: 'absolute',
          bottom: bottomOffset,
          left: BAR_SIDE_MARGIN,
          right: BAR_SIDE_MARGIN,
        },
        containerStyle,
      ]}
    >
      <HiddenPointerGuard progress={progress}>
        {/* Shadow wrapper */}
        <View
          className="rounded-full"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.35 : 0.12,
            elevation: 5,
          }}
        >
          {/* Pill with solid background */}
          <View
            className="rounded-full overflow-hidden bg-surface"
            style={{ height: FLOATING_TAB_BAR_HEIGHT }}
          >
            <TabItems
              state={state}
              navigation={navigation}
              tabs={tabs}
              visibleRoutes={visibleRoutes}
              focusedPosition={focusedPosition}
              colors={colors}
              isDark={isDark}
            />
          </View>
        </View>
      </HiddenPointerGuard>
    </Animated.View>
  );
}

/** Turns touches off while the bar is (almost) fully hidden. */
function HiddenPointerGuard({
  progress,
  children,
}: {
  progress: { value: number };
  children: React.ReactNode;
}) {
  const animatedProps = useAnimatedStyle(() => ({
    pointerEvents: progress.value > 0.95 ? ('none' as const) : ('auto' as const),
  }));
  return <Animated.View style={animatedProps}>{children}</Animated.View>;
}

type TabItemsProps = {
  state: BottomTabBarProps['state'];
  navigation: BottomTabBarProps['navigation'];
  tabs: CustomTabConfig[];
  visibleRoutes: BottomTabBarProps['state']['routes'];
  focusedPosition: number;
  colors: ReturnType<typeof useColors>['colors'];
  isDark: boolean;
};

function TabItems({
  state,
  navigation,
  tabs,
  visibleRoutes,
  focusedPosition,
  colors,
  isDark,
}: TabItemsProps) {
  const [rowWidth, setRowWidth] = useState(0);
  const count = Math.max(1, visibleRoutes.length);
  const itemWidth = Math.max(
    0,
    (rowWidth - ROW_PADDING * 2 - ROW_GAP * (count - 1)) / count
  );

  const indicatorX = useDerivedValue(() =>
    withSpring(ROW_PADDING + focusedPosition * (itemWidth + ROW_GAP), SPRING)
  );
  const indicatorStyle = useAnimatedStyle(() => ({
    width: itemWidth,
    transform: [{ translateX: indicatorX.value }],
  }));

  const onRowLayout = (event: LayoutChangeEvent) => {
    setRowWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      className="flex-1 flex-row items-center rounded-full border p-1 gap-3"
      style={{
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      }}
      onLayout={onRowLayout}
      accessibilityRole="tablist"
    >
      {rowWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          className="absolute rounded-full"
          style={[
            {
              top: ROW_PADDING,
              bottom: ROW_PADDING,
              left: 0,
              backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
            },
            indicatorStyle,
          ]}
        />
      )}

      {visibleRoutes.map((route) => {
        const config = tabs.find((t) => t.name === route.name);
        if (!config) return null;

        const isFocused = state.routes[state.index]?.key === route.key;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabItem
            key={route.key}
            config={config}
            isFocused={isFocused}
            onPress={onPress}
            colors={colors}
          />
        );
      })}
    </View>
  );
}

type TabItemProps = {
  config: CustomTabConfig;
  isFocused: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>['colors'];
};

function TabItem({ config, isFocused, onPress, colors }: TabItemProps) {
  const Icon = config.icon;
  const IconFilled = config.iconFilled;
  const badge = config.badge ?? 0;

  const scale = useSharedValue(1);
  useEffect(() => {
    if (!isFocused) return;
    scale.value = withSequence(
      withTiming(0.82, { duration: 80, reduceMotion: ReduceMotion.System }),
      withSpring(1, SPRING)
    );
  }, [isFocused, scale]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const accessibilityLabel =
    badge > 0 ? `${config.label}, ${badge} unread` : config.label;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: isFocused }}
      className="flex-1 items-center justify-center h-full rounded-full"
    >
      <View className="items-center" style={{ gap: 3 }}>
        <Animated.View style={iconStyle}>
          {isFocused ? (
            <IconFilled size={24} color={colors.primary} strokeWidth={2.5} />
          ) : (
            <Icon size={24} color={colors.gray300} strokeWidth={1.8} />
          )}
          {badge > 0 && (
            <View
              testID={`tab-badge-${config.name}`}
              className="absolute items-center justify-center rounded-full h-4.5 min-w-4.5 px-1"
              style={{ top: -6, right: -10, backgroundColor: colors.danger }}
            >
              <Text
                className="font-nunitoBold text-[10px]"
                style={{ color: colors.white }}
              >
                {formatBadge(badge)}
              </Text>
            </View>
          )}
        </Animated.View>
        <Text
          className="font-nunitoSemiBold text-[10px]"
          style={{ color: isFocused ? colors.primary : colors.gray300 }}
        >
          {config.label}
        </Text>
      </View>
    </Pressable>
  );
}
