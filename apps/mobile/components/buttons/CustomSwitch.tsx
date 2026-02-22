import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { COLORS } from '@repo/constants';

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  activeColor?: string;
  inactiveColor?: string;
}

export default function CustomSwitch({
  value,
  onValueChange,
  activeColor = COLORS.primary,
  inactiveColor = COLORS.mediumGrey,
}: CustomSwitchProps) {
  const translateX = useSharedValue(value ? 27 : 2);

  useEffect(() => {
    translateX.value = withTiming(value ? 27 : 2, {
      duration: 200,
    });
  }, [value, translateX]);

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handlePress = () => {
    onValueChange(!value);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="w-[50px] h-7 rounded-[14px] justify-center"
      style={{ backgroundColor: value ? activeColor : inactiveColor }}
    >
      <Animated.View 
        className="w-6 h-6 rounded-full bg-white"
        style={animatedThumbStyle} />
    </Pressable>
  );
}