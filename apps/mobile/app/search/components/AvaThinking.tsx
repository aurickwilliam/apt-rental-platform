import { useEffect } from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { IMAGES } from "constants/images";

const PULSE_DURATION_MS = 700;

/** Shown in place of Ava's next reply while she reads the message and searches. */
export default function AvaThinking() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.4, { duration: PULSE_DURATION_MS }), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View
      className="mb-6 flex-row items-center gap-2"
      accessibilityRole="progressbar"
      accessibilityLabel="Ava is thinking"
    >
      <Animated.View className="size-8" style={pulseStyle}>
        <Image
          source={IMAGES.aiIcon}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
        />
      </Animated.View>
      <Text className="text-sm font-inter text-muted">Thinking…</Text>
    </View>
  );
}
