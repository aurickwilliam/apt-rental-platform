import { TENANTICONS } from '@/constants/tab-icons'

import { PlatformPressable } from '@react-navigation/elements'
import { useEffect } from 'react';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'

interface TabBarIconProps {
  onPress: () => void;
  onLongPress: () => void;
  isFocused: boolean;
  routeName: string;
  color: string;
  label: string;
}

export default function TabBarIcon({
  onPress,
  onLongPress,
  isFocused,
  routeName,
  color,
  label,
}: TabBarIconProps) {
  // Animation
  const scale = useSharedValue(0);

  // Change the scale value when the icon is focused
  useEffect(() => {
    scale.value = withSpring(
      typeof isFocused === 'boolean' ? (isFocused ? 1 : 0) : isFocused,
      {duration: 350}
    );

  }, [scale, isFocused])

  // Animation for the text to disappear or have 0 opacity when focused
  const textAnimationStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [0, 1], [1, 0])

    return {
      opacity
    }
  });

  // Animation to center the icon when it is focused
  const iconAnimationStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(scale.value, [0, 1], [1, 1.2]);

    const top = interpolate(scale.value, [0, 1], [0, 9]);

    return {
      transform: [{
        scale: scaleValue
      }],
      top: top
    }
  });

  return (
    <PlatformPressable
      onPress={onPress}
      onLongPress={onLongPress}
      className={`flex-1 justify-center items-center rounded-full
        ${isFocused ? 'bg-primary' : 'bg-transparent'}`}
    >
      <Animated.View style={iconAnimationStyle}>
        {
          TENANTICONS[routeName]({
            color: color
          })
        }
      </Animated.View>

      <Animated.Text style={[{ color: color, fontSize: 12 }, textAnimationStyle]}>
        {label}
      </Animated.Text>
    </PlatformPressable>
  )
}
