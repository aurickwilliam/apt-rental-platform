import {
  View,
  KeyboardAvoidingView,
  FlatList,
  ActivityIndicator,
  LayoutChangeEvent,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useRef, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ScreenWrapper from 'components/layout/ScreenWrapper';
import ChatHeader from 'components/layout/ChatHeader';
import ChatBubble from 'components/display/ChatBubble';
import ChatBox from 'components/inputs/ChatBox';
import TypingIndicator from 'components/display/TypingIndicator';
import ChatEmptyState from './components/ChatEmptyState';

import { COLORS } from '@repo/constants';
import { useChat } from 'hooks/useChat';

function useRouteParams() {
  const raw = useLocalSearchParams<{
    conversationId: string;
    otherUserId: string;
    otherUserName?: string;
    otherUserAvatar?: string;
    otherUserPhone?: string;
    otherUserPhoneNumber?: string;
    apartmentId?: string;
  }>();

  const normalize = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

  const apartmentIdRaw = normalize(raw.apartmentId);

  return {
    conversationId: normalize(raw.conversationId) ?? '',
    otherUserId: normalize(raw.otherUserId) ?? '',
    otherUserName: normalize(raw.otherUserName),
    otherUserAvatar: normalize(raw.otherUserAvatar),
    otherUserPhoneNumber: normalize(raw.otherUserPhoneNumber),
    apartmentId: apartmentIdRaw || null,
  };
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const {
    conversationId,
    otherUserId,
    otherUserName: routedName,
    otherUserAvatar: routedAvatar,
    otherUserPhoneNumber,
    apartmentId,
  } = useRouteParams();

  const {
    messages,
    chatMessage,
    otherUserName,
    otherUserAvatar,
    loading,
    sending,
    otherUserIsTyping,
    handleChatMessageChange,
    handleSend,
    handleInputBlur,
  } = useChat({
    conversationId,
    otherUserId,
    apartmentId,
    initialOtherUserName: routedName,
    initialOtherUserAvatar: routedAvatar,
  });

  const handleHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.height);
    setHeaderHeight((prev) => (prev === next ? prev : next));
  }, []);

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // Scroll whenever a new message lands or the pending message appears
  const handleContentSizeChange = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    <ScreenWrapper
      dismissKeyboardOnTouch={false}
      header={
        <View onLayout={handleHeaderLayout}>
          <ChatHeader
            name={otherUserName}
            profilePicture={otherUserAvatar ?? undefined}
            phoneNumber={otherUserPhoneNumber}
          />
        </View>
      }
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <View className="flex-1">
            {/* Show Empty State if no messages */}
            {messages.length === 0 && <ChatEmptyState />}

            {/* Render the message list */}
            <FlatList
              inverted
              ref={flatListRef}
              className="flex-1"
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ChatBubble
                  message={item.message}
                  timestamp={item.timestamp}
                  isSent={item.isSent}
                />
              )}
              contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 10 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
              nestedScrollEnabled
              ListHeaderComponent={otherUserIsTyping ? <TypingIndicator /> : null}
              onContentSizeChange={handleContentSizeChange}
            />
          </View>
        )}

        <View
          className="bg-white px-3 pt-2"
          style={{
            paddingBottom: Math.max(insets.bottom, 8),
          }}
        >
          <ChatBox
            chatValue={chatMessage}
            onChatValueChange={handleChatMessageChange}
            onSendPress={handleSend}
            isDisabled={sending}
            onBlur={handleInputBlur}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}