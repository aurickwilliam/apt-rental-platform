import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  Extrapolation,
} from 'react-native-reanimated';

import { IconArrowBackUp } from '@tabler/icons-react-native';

import { useColors } from '@/hooks/useTheme';

import { useTimestampReveal } from '@/utils/chat/timestampReveal';

/** Distance the bubble must travel before letting go starts a reply. */
const REPLY_THRESHOLD = 56;
/** Farthest the bubble follows the finger; past the threshold it drags with resistance. */
const MAX_TRANSLATION = 80;
/** Horizontal travel before the swipe takes over from scrolling and long-press. */
const ACTIVATION_OFFSET = 12;
/** Vertical travel that hands the touch back to the list's scroll. */
const VERTICAL_FAIL_OFFSET = 10;
const ICON_SIZE = 20;
const RETURN_SPRING = { damping: 20, stiffness: 260 };

interface SwipeToReplyProps {
  /** Sent messages swipe left, received ones right (toward the middle, like Messenger). */
  isSent: boolean;
  enabled: boolean;
  onReply: () => void;
  onThresholdCross: () => void;
  children: ReactNode;
}

/**
 * Swipe a message toward the middle of the screen to reply. A reply arrow
 * fades in behind the bubble, a haptic marks the threshold, and the bubble
 * springs back when released.
 */
export default function SwipeToReply({
  isSent,
  enabled,
  onReply,
  onThresholdCross,
  children,
}: SwipeToReplyProps) {
  const { colors } = useColors();
  const direction = isSent ? -1 : 1;

  const translateX = useSharedValue(0);
  const passedThreshold = useSharedValue(false);

  const timestampReveal = useTimestampReveal();

  let pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX(direction * ACTIVATION_OFFSET)
    // Dragging the other way hands the touch to the list's swipe-to-show-times.
    .failOffsetX(-direction * ACTIVATION_OFFSET)
    .failOffsetY([-VERTICAL_FAIL_OFFSET, VERTICAL_FAIL_OFFSET])
    .onUpdate((event) => {
      // Distance in the reply direction only; dragging the other way does nothing.
      const distance = Math.max(0, event.translationX * direction);
      const eased =
        distance <= REPLY_THRESHOLD
          ? distance
          : REPLY_THRESHOLD + (distance - REPLY_THRESHOLD) * 0.3;
      translateX.value = Math.min(eased, MAX_TRANSLATION) * direction;

      const isPast = distance >= REPLY_THRESHOLD;
      if (isPast && !passedThreshold.value) runOnJS(onThresholdCross)();
      passedThreshold.value = isPast;
    })
    .onEnd(() => {
      if (passedThreshold.value) runOnJS(onReply)();
    })
    .onFinalize(() => {
      passedThreshold.value = false;
      translateX.value = withSpring(0, RETURN_SPRING);
    });
  // A sent bubble's swipe left is a reply, so the list's swipe waits for it.
  if (timestampReveal) pan = pan.blocksExternalGesture(timestampReveal.listGesture);

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const iconStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      Math.abs(translateX.value),
      [0, REPLY_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity: progress,
      transform: [{ scale: 0.6 + 0.4 * progress }],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <View collapsable={false}>
        <Animated.View
          pointerEvents="none"
          className={`absolute top-0 bottom-0 justify-center ${isSent ? 'right-0' : 'left-0'}`}
          style={iconStyle}
        >
          <View className="size-8 items-center justify-center rounded-full bg-surface-tertiary">
            <IconArrowBackUp size={ICON_SIZE} color={colors.textPrimary} />
          </View>
        </Animated.View>
        <Animated.View style={bubbleStyle}>{children}</Animated.View>
      </View>
    </GestureDetector>
  );
}
