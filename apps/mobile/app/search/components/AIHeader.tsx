import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconChevronLeft, IconMessagePlus } from "@tabler/icons-react-native";
import { Button } from "heroui-native";

import { useColors } from "@/hooks/useTheme";

const HEADER_HEIGHT = 56;

interface AIHeaderProps {
  onBackPress?: () => void;
  /** Starts a new conversation. Hidden until there is something to clear. */
  onNewChat?: () => void;
  canStartNewChat?: boolean;
}

// Quiet header: the conversation is the focus, so it sits on the screen
// background instead of a blue bar.
export default function AIHeader({ onBackPress, onNewChat, canStartNewChat = false }: AIHeaderProps) {
  const { colors } = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      className="flex-row items-center justify-between bg-background px-3"
      style={{ paddingTop: insets.top, height: insets.top + HEADER_HEIGHT }}
    >
      <Button
        variant="ghost"
        isIconOnly
        onPress={handleBack}
        className="size-10 rounded-full"
        accessibilityLabel="Go back"
      >
        <IconChevronLeft size={24} color={colors.textPrimary} />
      </Button>

      <View className="flex-1 items-center" accessibilityRole="header">
        <Text className="text-lg text-foreground font-nunitoBold" numberOfLines={1}>
          Ava
        </Text>
        <Text className="text-xs text-muted font-inter" numberOfLines={1}>
          APT Virtual Assistant
        </Text>
      </View>

      {onNewChat && canStartNewChat ? (
        <Button
          variant="ghost"
          isIconOnly
          onPress={onNewChat}
          className="size-10 rounded-full"
          accessibilityLabel="Start a new chat"
        >
          <IconMessagePlus size={22} color={colors.textPrimary} />
        </Button>
      ) : (
        <View className="size-10" />
      )}
    </View>
  );
}
