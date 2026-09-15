import {
  View,
  KeyboardAvoidingView,
  FlatList,
  Pressable,
  StyleSheet,
  Keyboard,
  LayoutChangeEvent,
  type ViewToken,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import ImageViewing from "react-native-image-viewing";

import { IconArrowDown } from '@tabler/icons-react-native';

import ScreenWrapper from 'components/layout/ScreenWrapper';
import ChatHeader from '@/app/chat/components/ChatHeader';
import ChatBubble, {
  BlurBackdrop,
  ChatBubbleContent,
  type BubbleLayout,
} from '@/app/chat/components/ChatBubble';
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

type ActiveMenuState = {
  id: string;
  /** Window-relative rect measured on long-press; null falls back to blur-only. */
  layout: BubbleLayout | null;
  /** Snapshot at open time; the live row is re-resolved from messages each render. */
  message: Message;
};

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

  const flatListRef = useRef<FlatList>(null);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pendingAssets, setPendingAssets] = useState<StagedAsset[]>([]);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [activeMenu, setActiveMenu] = useState<ActiveMenuState | null>(null);
  const [dismissToken, setDismissToken] = useState(0);
  const [containerOrigin, setContainerOrigin] = useState({ pageX: 0, pageY: 0 });
  const containerRef = useRef<View>(null);
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

  /** Window origin of the overlay container, so window-relative bubble rects map to overlay coords. */
  const refreshContainerOrigin = useCallback(() => {
    try {
      containerRef.current?.measureInWindow((x: number, y: number) => {
        if (typeof x === 'number' && typeof y === 'number') {
          setContainerOrigin((prev) => (prev.pageX === x && prev.pageY === y ? prev : { pageX: x, pageY: y }));
        }
      });
    } catch {
      // Non-fatal — preview falls back to the last known origin.
    }
  }, []);

  const handleOuterLayout = useCallback(() => {
    refreshContainerOrigin();
  }, [refreshContainerOrigin]);

  /** Closes the hold-menu and returns the convo to normal (blur + preview + popover all gone). */
  const requestDismissActiveMenu = useCallback(() => {
    setDismissToken((t) => t + 1);
    setActiveMenu(null);
  }, []);

  const handleMenuOpenChangeFor = useCallback(
    (item: Message) => (open: boolean, layout?: BubbleLayout) => {
      if (open) {
        if (layout) {
          // Measure the overlay container fresh, then commit origin + rect
          // together so the floating clone is positioned correctly on its
          // very first frame (no stale-origin flicker, no off-screen clone).
          try {
            containerRef.current?.measureInWindow((cx: number, cy: number) => {
              if (typeof cx === 'number' && typeof cy === 'number') {
                setContainerOrigin({ pageX: cx, pageY: cy });
              }
              setActiveMenu({ id: item.id, layout, message: item });
            });
          } catch {
            setActiveMenu({ id: item.id, layout, message: item });
          }
        } else {
          // Measure failed — fall back to blur-only (previous behavior).
          setActiveMenu({ id: item.id, layout: null, message: item });
        }
      } else {
        setActiveMenu((prev) => (prev && prev.id === item.id ? null : prev));
      }
    },
    []
  );

  // Resolve the live row each render so the floating clone never shows a stale
  // snapshot; if the row is gone (e.g. unsent elsewhere), drop back to normal.
  const activeLiveMessage = activeMenu
    ? (messages.find((m) => m.id === activeMenu.id) ?? null)
    : null;
  // Render-phase adjustment (same trigger as the effect it replaces): when the
  // live row disappears, drop back to normal without a cascading render.
  const liveKey = activeMenu ? `${activeMenu.id}:${activeLiveMessage ? '1' : '0'}` : 'none';
  const [prevLiveKey, setPrevLiveKey] = useState(liveKey);
  if (liveKey !== prevLiveKey) {
    setPrevLiveKey(liveKey);
    if (activeMenu && !activeLiveMessage) setActiveMenu(null);
  }
  const previewMessage = activeLiveMessage ?? activeMenu?.message ?? null;

  // Any scroll, keyboard pop, or list growth while a menu is open would slide
  // the original bubble out from under the floating clone — dismiss instead.
  const handleScrollBeginDrag = useCallback(() => {
    setDismissToken((t) => t + 1);
    setActiveMenu(null);
  }, []);

  useEffect(() => {
    if (!activeMenu) return;
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setActiveMenu(null);
    });
    return () => sub.remove();
  }, [activeMenu]);

  const messageCount = messages.length;
  const messageCountRef = useRef(messageCount);
  useEffect(() => {
    if (messageCountRef.current !== messageCount) {
      messageCountRef.current = messageCount;
      setActiveMenu(null);
    }
  }, [messageCount]);

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

  return (
    <View ref={containerRef} onLayout={handleOuterLayout} className="flex-1">
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
              renderItem={({ item }) => (
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
                  onImagePress={setSelectedImage}
                  onMediaLoadError={(mediaKind) => {
                    void retryChatMediaOnce(item.id, mediaKind);
                  }}
                  onReply={() => handleReply(item)}
                  onUnsend={() => handleUnsend(item.id)}
                  onMenuOpenChange={handleMenuOpenChangeFor(item)}
                  dismissToken={dismissToken}
                />
              )}
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
              scrollEnabled={activeMenu === null}
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
    {activeMenu !== null && (
      <View style={[StyleSheet.absoluteFill, { zIndex: 50, elevation: 50 }]} pointerEvents="none">
        <BlurBackdrop isDark={isDark} />
      </View>
    )}
    {activeMenu?.layout && previewMessage && (
      <View style={[StyleSheet.absoluteFill, { zIndex: 51, elevation: 51 }]} pointerEvents="box-none">
        <Pressable
          onPress={requestDismissActiveMenu}
          accessibilityRole="button"
          accessibilityLabel="Dismiss message menu"
          style={{
            position: 'absolute',
            top: Math.max(0, activeMenu.layout.pageY - containerOrigin.pageY),
            left: Math.max(0, activeMenu.layout.pageX - containerOrigin.pageX),
            width: activeMenu.layout.width,
            alignItems: previewMessage.isSent ? 'flex-end' : 'flex-start',
          }}
        >
          <ChatBubbleContent
            message={previewMessage.message}
            messageType={previewMessage.messageType}
            attachmentUrl={previewMessage.attachmentUrl}
            attachmentPath={previewMessage.attachmentPath}
            thumbnailUrl={previewMessage.thumbnailUrl}
            thumbnailPath={previewMessage.thumbnailPath}
            isSent={previewMessage.isSent}
            replyTo={previewMessage.replyTo}
            replyDeleted={previewMessage.replyDeleted}
            otherUserName={otherUserName}
            interactive={false}
          />
        </Pressable>
      </View>
    )}
    </View>
  );
}
