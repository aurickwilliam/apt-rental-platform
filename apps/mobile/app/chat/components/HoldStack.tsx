import { useEffect, useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { computeHoldLayout, type HoldViewport } from './holdLayout';

// A little bounce as the bubble lifts into place (Google Messages / iMessage feel).
const SETTLE_SPRING = { damping: 18, stiffness: 220, mass: 0.9 };
// Reaction pill and actions card grow out of the bubble's side.
const APPEAR_FROM_SCALE = 0.85;

interface HoldStackProps {
  isSent: boolean;
  /** The bubble's top in overlay coordinates, where it sat in the chat. */
  bubbleOrigTop: number;
  bubbleHeight: number;
  viewport: HoldViewport;
  /** Extra start offset so the lifted bubble lines up with its row (received avatar gutter). */
  startInset?: number;
  /** Reaction pill, or null when the message can't be reacted to. */
  reactions: ReactNode | null;
  bubble: ReactNode;
  menu: ReactNode;
}

/**
 * Held-message stack: reaction pill above the bubble, actions card below,
 * the whole group centered vertically. The bubble springs from its place in
 * the chat to its slot; the pill and card scale in from the bubble's side.
 * Key it by message id so every hold starts fresh.
 */
export default function HoldStack({
  isSent,
  bubbleOrigTop,
  bubbleHeight,
  viewport,
  startInset = 0,
  reactions,
  bubble,
  menu,
}: HoldStackProps) {
  const reduceMotion = useReducedMotion();
  const hasReactions = reactions !== null;

  // Nothing moves until both overlays are measured, so the stack never
  // jumps from an estimated size to the real one.
  const [reactionsH, setReactionsH] = useState<number | null>(hasReactions ? null : 0);
  const [menuH, setMenuH] = useState<number | null>(null);
  const isMeasured = reactionsH !== null && menuH !== null;

  const layout = computeHoldLayout(
    { pageX: 0, pageY: bubbleOrigTop, width: 0, height: bubbleHeight },
    { reactionsH: reactionsH ?? 0, menuH: menuH ?? 0 },
    viewport
  );

  const shift = useSharedValue(0);
  const appear = useSharedValue(0);

  const target = layout.bubbleTop - bubbleOrigTop;
  useEffect(() => {
    if (!isMeasured) return;
    if (reduceMotion) {
      shift.value = target;
      appear.value = 1;
      return;
    }
    shift.value = withSpring(target, SETTLE_SPRING);
    appear.value = withSpring(1, SETTLE_SPRING);
  }, [appear, isMeasured, reduceMotion, shift, target]);

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: shift.value }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: appear.value,
    transform: [{ scale: APPEAR_FROM_SCALE + (1 - APPEAR_FROM_SCALE) * appear.value }],
  }));

  const side = isSent ? 'self-end' : 'self-start';
  const horizontalOrigin = isSent ? 'right' : 'left';

  const measure = (setter: (h: number) => void) => (event: LayoutChangeEvent) => {
    const height = Math.round(event.nativeEvent.layout.height);
    setter(height);
  };

  return (
    <>
      {hasReactions ? (
        <View
          pointerEvents="box-none"
          className="absolute inset-x-0 px-4"
          style={{ top: layout.reactionsTop, zIndex: 20, elevation: 20 }}
        >
          <Animated.View
            onLayout={measure(setReactionsH)}
            className={side}
            style={[overlayStyle, { marginLeft: startInset, transformOrigin: `${horizontalOrigin} bottom` }]}
          >
            {reactions}
          </Animated.View>
        </View>
      ) : null}

      <Animated.View
        pointerEvents="none"
        className="absolute inset-x-0 px-4"
        style={[{ top: bubbleOrigTop, zIndex: 10, elevation: 10 }, bubbleStyle]}
      >
        <View className={`max-w-[80%] ${side}`} style={{ marginLeft: startInset }}>
          {bubble}
        </View>
      </Animated.View>

      <View
        pointerEvents="box-none"
        className="absolute inset-x-0 px-4"
        style={{ top: layout.menuTop, zIndex: 20, elevation: 20 }}
      >
        <Animated.View
          onLayout={measure(setMenuH)}
          className={side}
          style={[overlayStyle, { marginLeft: startInset, transformOrigin: `${horizontalOrigin} top` }]}
        >
          {menu}
        </Animated.View>
      </View>
    </>
  );
}
