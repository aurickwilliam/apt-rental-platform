import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  Extrapolation,
} from 'react-native-reanimated';

import { TIMESTAMP_REVEAL_WIDTH, useTimestampReveal } from './timestampReveal';

interface TimestampRevealRowProps {
  isSent: boolean;
  /** Clock time for this bubble; empty hides it (e.g. still sending). */
  time: string;
  /** Matches the bubble row's bottom margin so the time centers on the bubble. */
  bottomInset: number;
  children: ReactNode;
}

/**
 * Full-width row that shows a bubble's time at the right edge while the chat
 * is swiped left (iMessage style): sent bubbles slide left to make room,
 * received ones stay put, and the time fades in.
 */
export default function TimestampRevealRow({
  isSent,
  time,
  bottomInset,
  children,
}: TimestampRevealRowProps) {
  const context = useTimestampReveal();
  const fallback = useSharedValue(0);
  const reveal = context?.reveal ?? fallback;

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: isSent ? -reveal.value : 0 }],
  }));
  const timeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(reveal.value, [0, TIMESTAMP_REVEAL_WIDTH], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateX: interpolate(
          reveal.value,
          [0, TIMESTAMP_REVEAL_WIDTH],
          [TIMESTAMP_REVEAL_WIDTH / 2, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  return (
    <View className="w-full">
      <Animated.View style={bubbleStyle}>{children}</Animated.View>
      {time ? (
        <Animated.View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          className="absolute right-0 top-0 items-end justify-center"
          style={[{ bottom: bottomInset, width: TIMESTAMP_REVEAL_WIDTH - 8 }, timeStyle]}
        >
          <Text className="text-[11px] font-inter text-gray-500" numberOfLines={1}>
            {time}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
