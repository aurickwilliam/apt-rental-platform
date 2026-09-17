import {
  View,
  Pressable,
  KeyboardAvoidingView,
  FlatList,
  Keyboard,
  Alert,
  LayoutChangeEvent,
  useWindowDimensions,
  type ViewToken,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import EmojiPicker, { type EmojiType } from 'rn-emoji-keyboard';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import ImageViewing from "react-native-image-viewing";

import {
  IconArrowDown,
} from '@tabler/icons-react-native';

import ScreenWrapper from 'components/layout/ScreenWrapper';
import ChatHeader from '@/app/chat/components/ChatHeader';
import ChatBubble, {
  BlurBackdrop,
  ChatBubbleContent,
  formatHoldDate,
  playReactionHaptic,
} from '@/app/chat/components/ChatBubble';
import HoldMenu, { type HoldMenuData } from '@/app/chat/components/HoldMenu';
import ChatBox, { type StagedAsset } from '@/app/chat/components/ChatBox';
import TypingIndicator from 'components/display/TypingIndicator';
import GiphyPicker, { type GiphyMedia } from 'components/display/GiphyPicker';
import ChatEmptyState from './components/ChatEmptyState';
import ChatLoadingSkeleton from './components/ChatLoadingSkeleton';

import { Button, Spinner } from 'heroui-native';

import { useColors } from '@/hooks/useTheme';
import { useChat } from 'hooks/chat';

import { resolveMessageType, type Message } from '@/service/chat/chatService';

const MAX_ATTACHMENTS_PER_SEND = 10;
const SCROLL_BOTTOM_THRESHOLD = 150;

function setScrollButtonVisibility(
  opacity: SharedValue<number>,
  scale: SharedValue<number>,
  visible: boolean,
) {
  if (visible) {
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withTiming(1, { duration: 200 });
  } else {
    opacity.value = withTiming(0, { duration: 150 });
    scale.value = withTiming(0.5, { duration: 150 });
  }
}

function useRouteParams() {
  const raw = useLocalSearchParams<{
    conversationId: string;
    otherUserId: string;
    otherUserName?: string;
    otherUserAvatar?: string;
    otherUserPhone?: string;
    otherUserPhoneNumber?: string;
    apartmentId?: string;
    apartmentTitle?: string;
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
    apartmentTitle: normalize(raw.apartmentTitle),
  };
}

function generateStagedId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatScreen() {
  const { colors, isDark } = useColors();
  const { height: screenH } = useWindowDimensions();

  const flatListRef = useRef<FlatList>(null);
  const rootRef = useRef<View>(null);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pendingAssets, setPendingAssets] = useState<StagedAsset[]>([]);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [activeHold, setActiveHold] = useState<{
    id: string;
    pageY: number;
    height: number;
  } | null>(null);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const [pickerTargetId, setPickerTargetId] = useState<string | null>(null);
  const [rootY, setRootY] = useState(0);
  const isNearBottomRef = useRef(true);

  const scrollButtonOpacity = useSharedValue(0);
  const scrollButtonScale = useSharedValue(0.5);

  const {
    conversationId,
    otherUserId,
    otherUserName: routedName,
    otherUserAvatar: routedAvatar,
    otherUserPhoneNumber,
    apartmentId,
    apartmentTitle,
  } = useRouteParams();

  const {
    messages,
    chatMessage,
    otherUserName,
    otherUserAvatar,
    loading,
    loadingMore,
    hasMore,
    sending,
    otherUserIsTyping,
    replyTarget,
    handleChatMessageChange,
    handleSend,
    handleSendImages,
    handleReply,
    clearReply,
    handleUnsend,
    handleToggleReaction,
    handleInputBlur,
    handleVisibleMessages,
    retryChatMediaOnce,
    loadOlderMessages,
  } = useChat({
    conversationId,
    otherUserId,
    apartmentId,
    initialOtherUserName: routedName,
    initialOtherUserAvatar: routedAvatar,
  });

  const handleVisibleMessagesRef = useRef(handleVisibleMessages);
  useEffect(() => {
    handleVisibleMessagesRef.current = handleVisibleMessages;
  }, [handleVisibleMessages]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      handleVisibleMessagesRef.current(
        viewableItems.map((item) => (item.item as { id: string }).id)
      );
    },
    []
  );

  const handleHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.height);
    setHeaderHeight((prev) => (prev === next ? prev : next));
  }, []);

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const near = offsetY < SCROLL_BOTTOM_THRESHOLD;
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

  const handleHoldFor = useCallback(
    (item: Message) => (anchor: { pageY: number; height: number }) => {
      // The hold stack anchors near the held bubble — dismiss the keyboard
      // so the overlay never fights it for space.
      Keyboard.dismiss();
      setActiveHold({ id: item.id, ...anchor });
    },
    []
  );

  const handleStripPickerSelected = useCallback(
    ({ emoji }: EmojiType) => {
      const targetId = pickerTargetId ?? activeHold?.id;
      const target = targetId ? messages.find((m) => m.id === targetId) : null;
      if (target && !target.isPending && !target.id.startsWith('temp-')) {
        playReactionHaptic();
        void handleToggleReaction(target.id, emoji);
      }
      setIsReactionPickerOpen(false);
      setPickerTargetId(null);
      setActiveHold(null);
    },
    [pickerTargetId, activeHold, messages, handleToggleReaction]
  );

  // Any scroll, keyboard pop, or list growth while the hold stack is open dismisses it.
  const handleScrollBeginDrag = useCallback(() => {
    setActiveHold(null);
  }, []);

  useEffect(() => {
    if (!activeHold) return;
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setActiveHold(null);
    });
    return () => sub.remove();
  }, [activeHold]);

  const messageCount = messages.length;
  const messageCountRef = useRef(messageCount);
  useEffect(() => {
    if (messageCountRef.current !== messageCount) {
      messageCountRef.current = messageCount;
      setActiveHold(null);
    }
  }, [messageCount]);

  // Window Y of the screen root, so the measured bubble rect (window coords)
  // converts to overlay-local coords. Re-measured when the header lays out.
  useEffect(() => {
    (rootRef.current as unknown as {
      measureInWindow?: (cb: (x: number, y: number) => void) => void;
    } | null)?.measureInWindow?.((_x, y) => setRootY(y));
  }, [headerHeight]);

  const activeMsg = activeHold
    ? (messages.find((m) => m.id === activeHold.id) ?? null)
    : null;

  // Anchor the elevated clone near the held bubble; flip the card above the
  // clone when there is no room below. Everything stays inside the viewport.
  const EST_CARD_H = 400;
  const GAP = 8;
  const cloneTop =
    activeHold && activeMsg
      ? Math.max(
          headerHeight + 8,
          Math.min(
            activeHold.pageY < 0 ? screenH / 2 - 160 : activeHold.pageY - rootY,
            screenH - EST_CARD_H - 120
          )
        )
      : 0;
  const cloneH = activeHold ? activeHold.height : 0;
  const cardBelow = cloneTop + cloneH + GAP + EST_CARD_H <= screenH - 90;
  const cardTop = cardBelow
    ? cloneTop + cloneH + GAP
    : Math.max(headerHeight + 8, cloneTop - EST_CARD_H - GAP);

  const holdData: HoldMenuData | null = activeMsg
    ? {
        myReaction: activeMsg.reactions.find((r) => r.isMine)?.emoji,
        dateLabel: formatHoldDate(activeMsg.createdAt),
        canReact: !activeMsg.isPending && !activeMsg.id.startsWith('temp-'),
        canCopy: activeMsg.messageType === 'text' && !!activeMsg.message,
        canUnsend: activeMsg.isSent && !activeMsg.isPending,
      }
    : null;

  const handleHoldReact = useCallback(
    (emoji: string) => {
      if (!activeMsg) return;
      playReactionHaptic();
      void handleToggleReaction(activeMsg.id, emoji);
      setActiveHold(null);
    },
    [activeMsg, handleToggleReaction]
  );

  const handleHoldPicker = useCallback(() => {
    if (!activeMsg) return;
    setPickerTargetId(activeMsg.id);
    setIsReactionPickerOpen(true);
  }, [activeMsg]);

  const handleHoldReply = useCallback(() => {
    if (!activeMsg) return;
    handleReply(activeMsg);
    setActiveHold(null);
  }, [activeMsg, handleReply]);

  const handleHoldCopy = useCallback(async () => {
    if (!activeMsg?.message) return;
    const text = activeMsg.message;
    setActiveHold(null);
    try {
      let copied = false;
      try {
        const Clipboard = await import('expo-clipboard');
        if (Clipboard?.setStringAsync) {
          await Clipboard.setStringAsync(text);
          copied = true;
        }
      } catch {
        // native module missing — fall through to web fallback
      }
      if (!copied && typeof navigator !== 'undefined' && (navigator as unknown as { clipboard?: { writeText?: (t: string) => Promise<void> } }).clipboard?.writeText) {
        await (navigator as unknown as { clipboard: { writeText: (t: string) => Promise<void> } }).clipboard.writeText(text);
        copied = true;
      }
      if (!copied) {
        Alert.alert('Copied', text);
      }
    } catch {
      Alert.alert('Copy failed', 'Unable to copy message.');
    }
  }, [activeMsg]);

  const handleHoldUnsend = useCallback(() => {
    if (!activeMsg) return;
    setActiveHold(null);
    void handleUnsend(activeMsg.id);
  }, [activeMsg, handleUnsend]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: scrollButtonOpacity.value,
    transform: [{ scale: scrollButtonScale.value }],
  }));

  useEffect(() => {
    setScrollButtonVisibility(scrollButtonOpacity, scrollButtonScale, !isNearBottom);
  }, [isNearBottom, scrollButtonOpacity, scrollButtonScale]);

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

  const handleGifSelected = useCallback((gif: GiphyMedia) => {
    // The Giphy CDN URL is the attachment itself — staged as-is, no local
    // download, and skipped in the storage upload path (see externalUrl).
    const staged: StagedAsset = {
      id: generateStagedId(),
      localUri: gif.url,
      externalUrl: gif.url,
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

  const renderItem = useCallback(
    ({ item }: { item: Message }) => (
      <ChatBubble
        id={item.id}
        message={item.message}
        messageType={item.messageType}
        attachmentUrl={item.attachmentUrl}
        attachmentPath={item.attachmentPath}
        attachmentMimeType={item.attachmentMimeType}
        thumbnailPath={item.thumbnailPath}
        thumbnailUrl={item.thumbnailUrl}
        timestamp={item.timestamp}
        createdAt={item.createdAt}
        isSent={item.isSent}
        isPending={item.isPending}
        replyTo={item.replyTo}
        replyDeleted={item.replyDeleted}
        otherUserName={otherUserName}
        reactions={item.reactions}
        onReact={(emoji) => handleToggleReaction(item.id, emoji)}
        onHold={handleHoldFor(item)}
        hidden={activeHold?.id === item.id}
        onImagePress={setSelectedImage}
        onMediaLoadError={(mediaKind) => {
          void retryChatMediaOnce(item.id, mediaKind);
        }}
      />
    ),
    [
      otherUserName,
      handleToggleReaction,
      handleHoldFor,
      activeHold,
      retryChatMediaOnce,
    ]
  );

  return (
    <View ref={rootRef} collapsable={false} className="flex-1">
    <ScreenWrapper
      dismissKeyboardOnTouch={false}
      header={
        <View onLayout={handleHeaderLayout}>
          <ChatHeader
            name={otherUserName}
            profilePicture={otherUserAvatar ?? undefined}
            phoneNumber={otherUserPhoneNumber}
            apartmentTitle={apartmentTitle ?? undefined}
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
          <ChatLoadingSkeleton />
        ) : (
          <View className="flex-1">
            <FlatList
              inverted
              ref={flatListRef}
              className="flex-1"
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={
                messages.length === 0
                  ? { flexGrow: 1, justifyContent: 'center' }
                  : { flexGrow: 1, padding: 16, paddingBottom: 10 }
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
              nestedScrollEnabled
              ListHeaderComponent={otherUserIsTyping ? <TypingIndicator /> : null}
              ListFooterComponent={
                <>
                  {loadingMore && (
                    <View className="py-3 items-center">
                      <Spinner size="sm" color={colors.primary} />
                    </View>
                  )}
                  <ChatEmptyState
                    otherUserName={otherUserName}
                    otherUserAvatar={otherUserAvatar ?? undefined}
                    apartmentTitle={apartmentTitle}
                    hasMessages={messages.length > 0}
                  />
                </>
              }
              onContentSizeChange={handleContentSizeChange}
              onViewableItemsChanged={onViewableItemsChanged}
              onEndReached={hasMore ? loadOlderMessages : undefined}
              onEndReachedThreshold={0.2}
              onScroll={handleScroll}
              onScrollBeginDrag={handleScrollBeginDrag}
              scrollEventThrottle={16}
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
            replyTarget={replyTarget}
            onClearReply={clearReply}
            otherUserName={otherUserName}
          />
        </View>
        <Animated.View
          pointerEvents={isNearBottom ? 'none' : 'auto'}
          style={[{
            position: 'absolute',
            bottom: 80,
            right: 16,
            zIndex: 10,
          }, animatedButtonStyle]}
        >
          <Button
            isIconOnly
            className="rounded-full bg-primary shadow-lg"
            onPress={() => {
              scrollToBottom();
              setIsNearBottom(true);
            }}
          >
            <IconArrowDown size={24} color={colors.secondaryForeground} />
          </Button>
        </Animated.View>
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
    {activeHold !== null && (
      <View
        className="absolute inset-0"
        style={{ zIndex: 40, elevation: 40 }}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => setActiveHold(null)}
          accessibilityRole="button"
          accessibilityLabel="Dismiss message menu"
          className="absolute inset-0"
          style={{ zIndex: 0, elevation: 0 }}
        >
          <BlurBackdrop isDark={isDark} />
        </Pressable>
        {activeMsg && holdData && (
          <>
            <View
              pointerEvents="none"
              className="absolute inset-x-0 px-4"
              style={{ top: cloneTop, zIndex: 10, elevation: 10 }}
            >
              <View className={`max-w-[80%] ${activeMsg.isSent ? 'self-end' : 'self-start'}`}>
                <ChatBubbleContent
                  message={activeMsg.message}
                  messageType={activeMsg.messageType}
                  attachmentUrl={activeMsg.attachmentUrl}
                  attachmentPath={activeMsg.attachmentPath}
                  thumbnailUrl={activeMsg.thumbnailUrl}
                  thumbnailPath={activeMsg.thumbnailPath}
                  isSent={activeMsg.isSent}
                  replyTo={activeMsg.replyTo}
                  replyDeleted={activeMsg.replyDeleted}
                  otherUserName={otherUserName}
                  reactions={activeMsg.reactions}
                  interactive={false}
                />
              </View>
            </View>
            <View
              pointerEvents="box-none"
              className="absolute inset-x-0 px-6"
              style={{ top: cardTop, zIndex: 20, elevation: 20 }}
            >
              <View className={activeMsg.isSent ? 'self-end' : 'self-start'}>
                <HoldMenu
                  data={holdData}
                  onSelectReaction={handleHoldReact}
                  onOpenFullPicker={handleHoldPicker}
                  onReply={handleHoldReply}
                  onCopy={handleHoldCopy}
                  onUnsend={handleHoldUnsend}
                />
              </View>
            </View>
          </>
        )}
      </View>
    )}
    <EmojiPicker
      open={isReactionPickerOpen}
      onClose={() => {
        setIsReactionPickerOpen(false);
        setPickerTargetId(null);
      }}
      onEmojiSelected={handleStripPickerSelected}
    />
    </View>
  );
}
