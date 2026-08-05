import { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { IconArrowDown } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";

interface ScrollToBottomButtonProps {
  isNearBottom: boolean;
  onPress: () => void;
}

export default function ScrollToBottomButton({
  isNearBottom,
  onPress,
}: ScrollToBottomButtonProps) {
  const { colors } = useColors();

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (isNearBottom) {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.5, { duration: 150 });
    } else {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [isNearBottom, opacity, scale]);

  return (
    <Animated.View
      pointerEvents={isNearBottom ? "none" : "auto"}
      style={[
        {
          position: "absolute",
          bottom: 100,
          right: 16,
          zIndex: 10,
        },
        animatedStyle,
      ]}
    >
      <TouchableOpacity
        className="w-10 h-10 rounded-full bg-accent items-center justify-center shadow-lg"
        onPress={onPress}
        accessibilityLabel="Jump to latest messages"
      >
        <IconArrowDown size={20} color={colors.secondaryForeground} />
      </TouchableOpacity>
    </Animated.View>
  );
}