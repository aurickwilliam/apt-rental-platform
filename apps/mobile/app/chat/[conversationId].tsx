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
import * as VideoThumbnails from 'expo-video-thumbnails';
import { File, Paths } from 'expo-file-system';
import ImageViewing from "react-native-image-viewing";

import ScreenWrapper from 'components/layout/ScreenWrapper';
import ChatHeader from '@/app/chat/components/ChatHeader';
import ChatBubble from '@/app/chat/components/ChatBubble';
import ChatBox, { type StagedAsset } from '@/app/chat/components/ChatBox';
import TypingIndicator from 'components/display/TypingIndicator';
import GiphyPicker, { type GiphyMedia } from 'components/display/GiphyPicker';
import ChatEmptyState from './components/ChatEmptyState';

import { useColors } from '@/hooks/useTheme';
import { useChat } from 'hooks/chat';
import { resolveMessageType } from '@/service/chatService';

const MAX_ATTACHMENTS_PER_SEND = 10;

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

function generateStagedId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatScreen() {
  const { colors } = useColors();

  const flatListRef = useRef<FlatList>(null);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pendingAssets, setPendingAssets] = useState<StagedAsset[]>([]);
  const [showGifPicker, setShowGifPicker] = useState(false);

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
    handleSendImages,
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

  /** Builds a local preview thumbnail for a video pick so the staging strip isn't a blank tile. */
  const buildStagedAsset = useCallback(
    async (asset: ImagePicker.ImagePickerAsset): Promise<StagedAsset> => {
      const messageType = resolveMessageType(asset.mimeType);
      let thumbnailUri: string | undefined;

      if (messageType === 'video') {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 0 });
          thumbnailUri = uri;
        } catch (err) {
          // Non-fatal — the strip falls back to the raw video uri, which just won't
          // render a poster frame in <Image>. Send-time thumbnailing still runs.
          console.warn('Staged video thumbnail generation failed:', err);
        }
      }

      return {
        id: generateStagedId(),
        localUri: asset.uri,
        mimeType: asset.mimeType,
        thumbnailUri,
        messageType,
      };
    },
    []
  );

  const addStagedAssets = useCallback(
    async (assets: ImagePicker.ImagePickerAsset[]) => {
      const room = MAX_ATTACHMENTS_PER_SEND - pendingAssets.length;
      if (room <= 0) return;

      const staged = await Promise.all(assets.slice(0, room).map(buildStagedAsset));
      setPendingAssets((prev) => [...prev, ...staged]);
    },
    [pendingAssets.length, buildStagedAsset]
  );

  const handleRemoveStagedAsset = useCallback((id: string) => {
    setPendingAssets((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      videoMaxDuration: 60,
      allowsMultipleSelection: true,
      selectionLimit: MAX_ATTACHMENTS_PER_SEND,
    });

    if (result.canceled || result.assets.length === 0) return;

    await addStagedAssets(result.assets);
  }, [addStagedAssets]);

  const handlePickGif = useCallback(() => {
    setShowGifPicker(true);
  }, []);

  const handleGifSelected = useCallback(async (gif: GiphyMedia) => {
    const downloaded = await File.downloadFileAsync(gif.url, Paths.cache, {
      idempotent: true,
    });

    const staged: StagedAsset = {
      id: generateStagedId(),
      localUri: downloaded.uri,
      mimeType: 'image/gif',
      messageType: 'gif',
    };

    setPendingAssets((prev) => [...prev, staged]);
  }, []);

  const handleOpenCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (result.canceled || !result.assets?.[0]) return;

    // Camera only ever returns one asset — still routes through the same
    // review-before-send strip as a library pick, for one consistent flow.
    await addStagedAssets(result.assets);
  }, [addStagedAssets]);

  const handleSendPress = useCallback(async () => {
    const assetsToSend = pendingAssets;
    const hasText = chatMessage.trim().length > 0;

    if (assetsToSend.length > 0) {
      setPendingAssets([]);
      await handleSendImages(
        assetsToSend.map(({ id, messageType, ...rest }) => rest)
      );
    }

    if (hasText) {
      await handleSend();
    }
  }, [pendingAssets, chatMessage, handleSendImages, handleSend]);

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
            {messages.length === 0 && <ChatEmptyState />}

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
                  attachmentPath={item.attachmentPath}
                  attachmentMimeType={item.attachmentMimeType}
                  thumbnailPath={item.thumbnailPath}
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
            onSendPress={handleSendPress}
            onPickImage={handlePickImage}
            onPickGif={handlePickGif}
            onOpenCamera={handleOpenCamera}
            isDisabled={sending}
            onBlur={handleInputBlur}
            pendingAssets={pendingAssets}
            onRemovePendingAsset={handleRemoveStagedAsset}
          />
        </View>
      </KeyboardAvoidingView>

      <ImageViewing
        images={images}
        imageIndex={0}
        visible={!!selectedImage}
        onRequestClose={() => setSelectedImage(null)}
      />

      <GiphyPicker
        visible={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelect={handleGifSelected}
      />
    </ScreenWrapper>
  );
}
