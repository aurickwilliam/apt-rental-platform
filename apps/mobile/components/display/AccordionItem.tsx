import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
} from 'react-native';
import Animated, { 
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

import { IconChevronDown } from '@tabler/icons-react-native';

import { COLORS } from 'constants/colors';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isFirst?: boolean;
}

export default function AccordionItem({
  title,
  children,
  isFirst = false,
}: AccordionItemProps) {
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const underlineScale = useSharedValue(0);

  const toggleExpand = () => {
    LayoutAnimation.configureNext({
      duration: 300,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    const newValue = expanded ? 0 : 1;
    rotation.value = withTiming(newValue, { duration: 300 });
    underlineScale.value = withTiming(newValue, { duration: 300 });

    setExpanded(!expanded);
  };

  const animatedChevronStyle = useAnimatedStyle(() => {
    const rotate = interpolate(rotation.value, [0, 1], [0, 180]);
    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  const animatedUnderlineStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scaleX: underlineScale.value }],
    };
  });

  return (
    <View className={`border-b border-secondary ${isFirst && 'border-t-0'}`}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleExpand}
        className='flex-row items-center justify-between py-5 px-6'
      >
        <Text className='text-text font-interSemiBold text-lg'>
          {title}
        </Text>
        <Animated.View style={animatedChevronStyle}>
          <IconChevronDown size={22} color={COLORS.grey} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View 
        style={[{ 
          height: 1, 
          backgroundColor: COLORS.secondary, 
          borderRadius: 2 
        }, animatedUnderlineStyle]} 
      />

      {
        expanded && 
        <View className="p-4">
          {children}
        </View>
      }
    </View>
  )
}