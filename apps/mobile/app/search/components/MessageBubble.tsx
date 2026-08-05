import { Text, View } from "react-native";
import { Image } from "expo-image";
import { formatTime } from "@repo/utils";

import { useColors } from "@/hooks/useTheme";
import { type AIChatMessage } from "hooks/chat";
import { IMAGES } from "constants/images";

import { SuggestionChipFlex } from "./SuggestionChip";

interface MessageBubbleProps {
  message: AIChatMessage;
  onQuickReplyPress: (text: string) => void;
}

export default function MessageBubble({
  message,
  onQuickReplyPress,
}: MessageBubbleProps) {
  const { colors } = useColors();
  const isUser = message.role === "user";

  return (
    <View className={`mb-3 ${isUser ? "items-end" : "items-start"}`}>
      <View className="flex-row items-end max-w-[85%]">
        {/* AI Avatar */}
        {!isUser && (
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-2 mb-1 overflow-hidden"
            style={{ backgroundColor: colors.primary }}
            accessibilityLabel="APT AI assistant"
          >
            <Image
              source={IMAGES.aiIcon}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>
        )}

        {/* Bubble */}
        <View
          className={`rounded-3xl px-3 py-2 ${
            isUser
              ? "rounded-br-sm bg-accent"
              : "rounded-bl-sm bg-surface-tertiary"
          }`}
        >
          <Text
            className={`text-sm font-inter leading-6 ${
              isUser ? "text-white" : "text-foreground"
            }`}
          >
            {message.text}
          </Text>
        </View>
      </View>

      {/* Quick replies under assistant message */}
      {!isUser && message.quickReplies && message.quickReplies.length > 0 && (
        <View className="ml-10 mt-1">
          <SuggestionChipFlex
            suggestions={message.quickReplies}
            onSelect={onQuickReplyPress}
          />
        </View>
      )}

      {/* Timestamp */}
      <Text
        className={`text-gray-300 text-xs font-inter mt-1 ${
          isUser ? "mr-0" : "ml-10"
        }`}
      >
        {formatTime(new Date(message.timestamp))}
      </Text>
    </View>
  );
}