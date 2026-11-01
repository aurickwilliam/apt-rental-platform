import { useCallback, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  FlatList,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  LayoutChangeEvent,
} from "react-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import AIHeader from "./components/AIHeader";
import AvaThinking from "./components/AvaThinking";
import StarterSuggestions, { type StarterSuggestion } from "./components/StarterSuggestions";
import EmptyChatState from "./components/EmptyChatState";
import MessageBubble from "./components/MessageBubble";
import MessageComposer from "./components/MessageComposer";
import ScrollToBottomButton from "./components/ScrollToBottomButton";

import { useAIChat, type AIChatMessage } from "hooks/chat";
import { useFavorites, useFavoriteToggle } from "@/hooks/favorites";

const STARTER_SUGGESTIONS: readonly StarterSuggestion[] = [
  { title: "2 bedrooms", detail: "under ₱15,000", message: "2BR under ₱15k" },
  { title: "Near Malabon", detail: "any budget", message: "Apartments in Malabon" },
  { title: "With parking", detail: "for a car", message: "A place with parking" },
  { title: "Pet friendly", detail: "for dogs or cats", message: "Pet friendly apartment" },
];

const SCROLL_BOTTOM_THRESHOLD = 150;

export default function AISearchScreen() {
  const router = useRouter();
  const { input, setInput, messages, isLoading, sendMessage, resetChat } = useAIChat();
  const { isFavorite } = useFavorites();
  const { toggleFavoriteWithToast } = useFavoriteToggle();

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

  const handleListingPress = useCallback(
    (apartmentId: string) => router.push(`/apartment/${apartmentId}` as never),
    [router]
  );

  const handleToggleFavorite = useCallback(
    (apartmentId: string) => {
      void toggleFavoriteWithToast(apartmentId);
    },
    [toggleFavoriteWithToast]
  );

  const renderItem = useCallback(
    ({ item }: { item: AIChatMessage }) => (
      <MessageBubble
        message={item}
        onQuickReplyPress={handleSuggestionPress}
        onListingPress={handleListingPress}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
      />
    ),
    [handleSuggestionPress, handleListingPress, isFavorite, handleToggleFavorite]
  );

  return (
    <ScreenWrapper
      dismissKeyboardOnTouch={false}
      header={
        <View onLayout={handleHeaderLayout}>
          <AIHeader onNewChat={resetChat} canStartNewChat={messages.length > 0} />
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
                : { flexGrow: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            nestedScrollEnabled
            ListEmptyComponent={messages.length === 0 ? <EmptyChatState /> : null}
            ListFooterComponent={isLoading ? <AvaThinking /> : null}
            onContentSizeChange={handleContentSizeChange}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />

          {/* Starters only before the chat starts; Ava's replies bring their own chips */}
          {messages.length === 0 && (
            <StarterSuggestions
              suggestions={STARTER_SUGGESTIONS}
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
