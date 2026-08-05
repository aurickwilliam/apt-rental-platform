import { useCallback, useRef, useState } from "react";
import {
  View,
  FlatList,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  LayoutChangeEvent,
} from "react-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import TypingIndicator from "@/components/display/TypingIndicator";
import AIHeader from "./components/AIHeader";
import { SuggestionChipScroll } from "./components/SuggestionChip";
import EmptyChatState from "./components/EmptyChatState";
import MessageBubble from "./components/MessageBubble";
import MessageComposer from "./components/MessageComposer";
import ScrollToBottomButton from "./components/ScrollToBottomButton";

import { useAIChat, type AIChatMessage } from "hooks/chat";

const SUGGESTION_CHIPS = [
  "2BR under ₱15k",
  "Near Malabon",
  "With parking",
  "Pet friendly",
];

const SCROLL_BOTTOM_THRESHOLD = 150;

export default function AISearchScreen() {
  const { input, setInput, messages, isLoading, sendMessage } = useAIChat();

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<RNTextInput>(null);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const isNearBottomRef = useRef(true);

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

  const handleHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.height);
    setHeaderHeight((prev) => (prev === next ? prev : next));
  }, []);

  const handleSuggestionPress = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage]
  );

  const renderItem = useCallback(
    ({ item }: { item: AIChatMessage }) => (
      <MessageBubble message={item} onQuickReplyPress={handleSuggestionPress} />
    ),
    [handleSuggestionPress]
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

        <MessageComposer
          inputRef={inputRef}
          value={input}
          onChangeText={setInput}
          onSend={() => sendMessage()}
          isDisabled={isLoading}
        />

        <ScrollToBottomButton
          isNearBottom={isNearBottom}
          onPress={() => {
            scrollToBottom();
            setIsNearBottom(true);
          }}
        />
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
