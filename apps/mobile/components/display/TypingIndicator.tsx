import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

import { useColors } from '@/hooks/useTheme';

const DOT_COUNT = 3;
const DOT_SIZE = 6;
const DOT_GAP = 4;
const ANIMATION_DELAY = 200;

function TypingDot({ index }: { index: number }) {
  const opacity = useSharedValue(0.4);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    opacity.value = withDelay(
      index * ANIMATION_DELAY,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.4, { duration: 400 })
        ),
        -1,
        false
      )
    );
  }, [index, opacity]);

  return (
    <Animated.View
      style={[
        {
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function TypingIndicator() {
  const { colors } = useColors();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 4,
        paddingVertical: 6,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          gap: DOT_GAP,
          backgroundColor: colors.gray100,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
          alignItems: 'center',
        }}
      >
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <TypingDot key={i} index={i} />
        ))}
      </View>
      <Text style={{ fontSize: 11, color: colors.gray400 }}>typing…</Text>
    </View>
  );
}
