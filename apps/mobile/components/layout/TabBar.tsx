import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';

import { TENANTICONS, LANDLORDICONS } from '../../constants/tab-icons';

import { useColors } from 'hooks/useTheme';

import TabBarIcon from './TabBarIcon';

export function TabBar({
  state,
  descriptors,
  navigation,
  userType = 'tenant'
}: BottomTabBarProps & { userType?: 'tenant' | 'landlord' }) {

  const { colors } = useColors();

  const icons = userType === 'tenant' ? TENANTICONS : LANDLORDICONS;

  return (
    <View className='flex-row pb-10 bg-background border-t border-gray-200'>

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : typeof options.title === 'string'
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabBarIcon
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            isFocused={isFocused}
            routeName={route.name}
            color={isFocused ? colors.primary : colors.gray500}
            label={label}
            icon={icons}
          />
        );
      })}
    </View>
  );
}
