import {
  View,
  KeyboardAvoidingView,
  FlatList,
  ActivityIndicator,
  LayoutChangeEvent,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useRef, useCallback, useMemo } from 'react';
import * as ImagePicker from 'expo-image-picker';
import ImageViewing from "react-native-image-viewing";

import ScreenWrapper from 'components/layout/ScreenWrapper';
import ChatHeader from '@/app/chat/components/ChatHeader';
import ChatBubble from '@/app/chat/components/ChatBubble';
import ChatBox from '@/app/chat/components/ChatBox';
import TypingIndicator from 'components/display/TypingIndicator';
import ChatEmptyState from './components/ChatEmptyState';

import { useColors } from '@/hooks/useTheme';
import { useChat } from 'hooks/chat';

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
  const { colors } = useColors();

  const flatListRef = useRef<FlatList>(null);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
    handleSendAttachment,
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

  const handleContentSizeChange = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const asset = result.assets[0];
    await handleSendAttachment(asset.uri, asset.mimeType);
  }, [handleSendAttachment]);

  const handlePickGif = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    // No native GIF filter in the system picker — restrict to images and let
    // resolveMessageType() in the send pipeline detect image/gif by mimeType.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const asset = result.assets[0];
    await handleSendAttachment(asset.uri, asset.mimeType);
  }, [handleSendAttachment]);

  const handleOpenCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const asset = result.assets[0];
    await handleSendAttachment(asset.uri, asset.mimeType);
  }, [handleSendAttachment]);

  const images = useMemo(
    () => (selectedImage ? [{ uri: selectedImage }] : []),
    [selectedImage]
  );

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
            <ActivityIndicator color={colors.primary} />
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
                  messageType={item.messageType}
                  attachmentUrl={item.attachmentUrl}
                  attachmentMimeType={item.attachmentMimeType}
                  thumbnailUrl={item.thumbnailUrl}
                  timestamp={item.timestamp}
                  isSent={item.isSent}
                  onImagePress={setSelectedImage}
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

        <View className="px-3 py-2">
          <ChatBox
            chatValue={chatMessage}
            onChatValueChange={handleChatMessageChange}
            onSendPress={handleSend}
            onPickImage={handlePickImage}
            onPickGif={handlePickGif}
            onOpenCamera={handleOpenCamera}
            isDisabled={sending}
            onBlur={handleInputBlur}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Full Screen Image View */}
      <ImageViewing
        images={images}
        imageIndex={0}
        visible={!!selectedImage}
        onRequestClose={() => setSelectedImage(null)}
      />
    </ScreenWrapper>
  );
}
