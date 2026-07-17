import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useColors } from 'hooks/useTheme';

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

export function CustomTabBar({ state, navigation, tabs }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useColors();

  const bottomOffset = Math.max(insets.bottom, FLOATING_TAB_BAR_BOTTOM_OFFSET);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: bottomOffset,
        left: 20,
        right: 20,
      }}
    >
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
            colors={colors}
            isDark={isDark}
          />
        </View>
      </View>
    </View>
  );
}

type TabItemsProps = {
  state: BottomTabBarProps['state'];
  navigation: BottomTabBarProps['navigation'];
  tabs: CustomTabConfig[];
  colors: ReturnType<typeof useColors>['colors'];
  isDark: boolean;
};

function TabItems({ state, navigation, tabs, colors, isDark }: TabItemsProps) {
  return (
    <View
      className="flex-1 flex-row items-center rounded-full border p-1 gap-3"
      style={{
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      }}
    >
      {state.routes.map((route, index) => {
        const config = tabs.find((t) => t.name === route.name);
        if (!config) return null;

        const isFocused = state.index === index;
        const Icon = config.icon;
        const IconFilled = config.iconFilled;

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
          <Pressable
            key={route.key}
            onPress={onPress}
            className="flex-1 items-center justify-center h-full rounded-full"
            style={{
              backgroundColor: isFocused
                ? isDark
                  ? 'rgba(255,255,255,0.10)'
                  : 'rgba(0,0,0,0.06)'
                : 'transparent',
            }}
          >
            <View className="items-center" style={{ gap: 3 }}>
              {isFocused ? (
                <IconFilled
                  size={24}
                  color={colors.primary}
                  strokeWidth={2.5}
                />
              ) : (
                <Icon
                  size={24}
                  color={colors.gray300}
                  strokeWidth={isFocused ? 2.4 : 1.8}
                />
              )}
              <Text
                className="font-interSemiBold text-[10px]"
                style={{ color: isFocused ? colors.primary : colors.gray300 }}
              >
                {config.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
