import { TouchableOpacity } from "react-native";
import Animated, {
  useDerivedValue,
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

  const opacity = useDerivedValue(() =>
    withTiming(isNearBottom ? 0 : 1, { duration: isNearBottom ? 150 : 200 }),
  );
  const scale = useDerivedValue(() =>
    withTiming(isNearBottom ? 0.5 : 1, { duration: isNearBottom ? 150 : 200 }),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

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