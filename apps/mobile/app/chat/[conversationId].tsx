import {
  View,
  Text,
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
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
      >
        {loading ? (
          <LoadingState />
        ) : (
          <FlatList
            inverted
            ref={flatListRef}
            style={{ flex: 1 }}
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
            ListEmptyComponent={<EmptyState />}
            onContentSizeChange={handleContentSizeChange}
          />
        )}

        <View
          style={{
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 12,
            paddingTop: 8,
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

function LoadingState() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.primary} />
    </View>
  );
}

function EmptyState() {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        transform: [{ scaleY: -1 }],
      }}
    >
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#E5E7EB',
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 10,
          maxWidth: '92%',
        }}
      >
        <Text
          style={{ color: COLORS.primary, fontSize: 14, textAlign: 'center', fontWeight: '600' }}
        >
          No messages yet
        </Text>
        <Text style={{ marginTop: 4, color: '#6B7280', fontSize: 12, textAlign: 'center' }}>
          Say hi to start the conversation.
        </Text>
      </View>
    </View>
  );
}