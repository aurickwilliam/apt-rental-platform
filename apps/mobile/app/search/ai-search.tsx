import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput as RNTextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  LayoutChangeEvent,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { IconSend, IconSparkles, IconArrowDown } from "@tabler/icons-react-native";
import { Button, InputGroup, TextField } from "heroui-native";
import { Image } from "expo-image";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import TypingIndicator from "@/components/display/TypingIndicator";
import AIHeader from "./components/AIHeader";
import { SuggestionChipScroll, SuggestionChipFlex } from "./components/SuggestionChip";

import { IMAGES } from "constants/images";
import { useColors } from "@/hooks/useTheme";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  quickReplies?: string[];
};

const SUGGESTION_CHIPS = [
  "2BR under ₱15k",
  "Near Malabon",
  "With parking",
  "Pet friendly",
];

const SCROLL_BOTTOM_THRESHOLD = 150;

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${period}`;
}

function EmptyChatState() {
  return (
    <View className="items-center gap-2 px-8">
      <View className="size-48">
        <Image
          source={IMAGES.aiIcon}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
        />
      </View>

      <Text className="text-xl font-interSemiBold text-foreground text-center">
        Hey, what would you like to ask?
      </Text>
      <Text className="text-gray-400 text-base font-inter text-center">
        Try {`"`}2BR under ₱15k near Malabon{`"`}
      </Text>
    </View>
  );
}

export default function AISearchScreen() {
  const { colors } = useColors();

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<RNTextInput>(null);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const isNearBottomRef = useRef(true);

  const scrollButtonOpacity = useSharedValue(0);
  const scrollButtonScale = useSharedValue(0.5);

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const handleScroll = useCallback(
    (event: {
      nativeEvent: {
        contentOffset: { y: number };
        contentSize: { height: number };
        layoutMeasurement: { height: number };
      };
    }) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const near =
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - SCROLL_BOTTOM_THRESHOLD;
      isNearBottomRef.current = near;
      setIsNearBottom(near);
    },
    []
  );

  const handleContentSizeChange = useCallback(() => {
    if (isNearBottomRef.current) {
      scrollToBottom();
    }
  }, [scrollToBottom]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: scrollButtonOpacity.value,
    transform: [{ scale: scrollButtonScale.value }],
  }));

  useEffect(() => {
    if (isNearBottom) {
      scrollButtonOpacity.value = withTiming(0, { duration: 150 });
      scrollButtonScale.value = withTiming(0.5, { duration: 150 });
    } else {
      scrollButtonOpacity.value = withTiming(1, { duration: 200 });
      scrollButtonScale.value = withTiming(1, { duration: 200 });
    }
  }, [isNearBottom, scrollButtonOpacity, scrollButtonScale]);

  const handleHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.height);
    setHeaderHeight((prev) => (prev === next ? prev : next));
  }, []);

  const sendMessage = useCallback(
    async (text?: string) => {
      const trimmed = (text ?? input).trim();
      if (!trimmed || isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        text: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        // TODO: Replace with actual AI API call
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "Casa here! I found a few apartments that might match what you're looking for. Let me narrow it down further — do you have a preferred area in Metro Manila?",
          timestamp: Date.now(),
          quickReplies: ["Caloocan", "Malabon", "Navotas", "Valenzuela"],
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "Sorry, I couldn't process that. Please try again.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading]
  );

  const handleSuggestionPress = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage]
  );

  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      const isUser = item.role === "user";

      return (
        <View className={`mb-3 ${isUser ? "items-end" : "items-start"}`}>
          <View className="flex-row items-end max-w-[85%]">
            {/* AI Avatar */}
            {!isUser && (
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-2 mb-1"
                style={{ backgroundColor: colors.primary }}
                accessibilityLabel="APT AI assistant"
              >
                <IconSparkles size={14} color="#fff" />
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
                {item.text}
              </Text>
            </View>
          </View>

          {/* Quick replies under assistant message */}
          {!isUser && item.quickReplies && item.quickReplies.length > 0 && (
            <View className="ml-10 mt-1">
              <SuggestionChipFlex
                suggestions={item.quickReplies}
                onSelect={handleSuggestionPress}
              />
            </View>
          )}

          {/* Timestamp */}
          <Text
            className={`text-gray-300 text-xs font-inter mt-1 ${
              isUser ? "mr-0" : "ml-10"
            }`}
          >
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
      );
    },
    [colors.primary, handleSuggestionPress]
  );

  return (
    <ScreenWrapper
      dismissKeyboardOnTouch={false}
      header={
        <View onLayout={handleHeaderLayout}>
          <AIHeader />
        </View>
      }
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
      >
        <View className="flex-1">
          <FlatList
            ref={flatListRef}
            className="flex-1"
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={
              messages.length === 0
                ? { flexGrow: 1, justifyContent: "center" }
                : { flexGrow: 1, padding: 16, paddingBottom: 10 }
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            nestedScrollEnabled
            ListEmptyComponent={messages.length === 0 ? <EmptyChatState /> : null}
            ListFooterComponent={isLoading ? <TypingIndicator /> : null}
            onContentSizeChange={handleContentSizeChange}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />

          {/* Suggestion chips — static row above input */}
          {!isLoading && messages.length <= 2 && (
            <SuggestionChipScroll
              suggestions={SUGGESTION_CHIPS}
              onSelect={handleSuggestionPress}
            />
          )}
        </View>

        {/* Input bar */}
        <View className="px-3 py-2 border-t border-border">
          <TextField>
            <InputGroup className="rounded-full">
              <InputGroup.Input
                ref={inputRef}
                className="rounded-full border"
                placeholder="Ask me anything about rentals..."
                placeholderTextColor={colors.gray400}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => sendMessage()}
                returnKeyType="send"
                maxLength={500}
              />

              {input.trim().length > 0 && (
                <InputGroup.Suffix className="p-0">
                  <Button
                    onPress={() => sendMessage()}
                    isDisabled={isLoading}
                    className="bg-accent rounded-full mr-1.5 w-14 h-9 items-center justify-center"
                    accessibilityLabel="Send message"
                  >
                    <IconSend size={20} color={colors.secondaryForeground} />
                  </Button>
                </InputGroup.Suffix>
              )}
            </InputGroup>
          </TextField>
        </View>

        {/* Scroll to bottom button */}
        <Animated.View
          pointerEvents={isNearBottom ? "none" : "auto"}
          style={[
            {
              position: "absolute",
              bottom: 100,
              right: 16,
              zIndex: 10,
            },
            animatedButtonStyle,
          ]}
        >
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-accent items-center justify-center shadow-lg"
            onPress={() => {
              scrollToBottom();
              setIsNearBottom(true);
            }}
            accessibilityLabel="Jump to latest messages"
          >
            <IconArrowDown size={20} color={colors.secondaryForeground} />
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
