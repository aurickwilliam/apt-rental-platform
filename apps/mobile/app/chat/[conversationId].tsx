import {
  View,
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
  Alert,
  LayoutChangeEvent,
  useWindowDimensions,
  type ViewToken,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
// Gesture-handler's list: a plain RN list cancels the bubbles' swipe-to-reply on Android.
import { FlatList, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import EmojiPicker, { type EmojiType } from 'rn-emoji-keyboard';
import { BlurTargetView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
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
import HoldStack from '@/app/chat/components/HoldStack';
import ReactionStrip from '@/app/chat/components/ReactionStrip';
import ChatBox, { type StagedAsset } from '@/app/chat/components/ChatBox';
import TypingIndicator from 'components/display/TypingIndicator';
import GiphyPicker, { type GiphyMedia } from 'components/display/GiphyPicker';
import ChatEmptyState from './components/ChatEmptyState';
import ChatApartmentCard from './components/ChatApartmentCard';
import { useEmojiPickerSettings } from './components/emojiPicker';
import { getSeenMessageId } from '@/service/chat/readReceipts';
import {
  SENDER_AVATAR_GUTTER,
  getBubbleGroupPosition,
  showsSenderAvatar,
} from './components/bubbleGrouping';
import {
  TIMESTAMP_REVEAL_WIDTH,
  TimestampRevealContext,
} from './components/timestampReveal';

import ChatLoadingSkeleton from './components/ChatLoadingSkeleton';
import ChatBlockedNotice from './components/ChatBlockedNotice';

import { Button, Spinner, useToast } from 'heroui-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useTheme';
import { useBlockStatus, useChat, useChatApartment, useEmojiRecents } from 'hooks/chat';
import { usePortalStore } from '@/stores/usePortalStore';
import {
  getChatApartmentRoute,
  getChatProfileRoute,
  getOtherPartyLabel,
} from '@/service/chat/chatRoutes';

import { resolveMessageType, type Message } from '@/service/chat/chatService';

/** Horizontal travel before the swipe-to-show-times takes over from scrolling. */
const TIMESTAMP_SWIPE_ACTIVATION = 12;
/** Vertical travel that hands the touch back to the list's scroll. */
const TIMESTAMP_SWIPE_VERTICAL_FAIL = 10;
const TIMESTAMP_RETURN_SPRING = { damping: 22, stiffness: 240 };

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
    apartmentId: apartmentIdRaw || null,
    apartmentTitle: normalize(raw.apartmentTitle),
  };
}

function generateStagedId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatScreen() {
  const { colors, isDark } = useColors();
  const { toast } = useToast();
  const { height: screenH } = useWindowDimensions();

  const flatListRef = useRef<FlatList>(null);
  const rootRef = useRef<View>(null);
  // The chat content the hold backdrop blurs (needed for the Android blur).
  const blurTargetRef = useRef<View>(null);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pendingAssets, setPendingAssets] = useState<StagedAsset[]>([]);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [activeHold, setActiveHold] = useState<{
    id: string;
    pageX: number;
    pageY: number;
    width: number;
    height: number;
  } | null>(null);
  // Measured card height (estimate until onLayout reports the real one).
  const insets = useSafeAreaInsets();
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
    apartmentId,
    apartmentTitle,
  } = useRouteParams();

  const {
    messages,
    chatMessage,
    otherUserName,
    otherUserAvatar,
    otherUserPhoneNumber,
    otherUserIsVerified,
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

  const { blockedByMe, blockedMe, unblock, isUnblocking } = useBlockStatus(otherUserId);

  // Emoji pickers (chat box panel and reaction "+") share recents and styling.
  useEmojiRecents();
  const emojiPickerSettings = useEmojiPickerSettings();
  const [isEmojiPanelOpen, setIsEmojiPanelOpen] = useState(false);

  // The active portal says who the other person is (tenant portal → landlord).
  const portal = usePortalStore((state) => state.portal);
  const router = useRouter();
  const handleViewProfile = useCallback(() => {
    if (!portal || !otherUserId) return;
    router.push(getChatProfileRoute(portal, otherUserId, apartmentId));
  }, [apartmentId, otherUserId, portal, router]);
  // Swiping the chat left shows every bubble's time (iMessage style); a sent
  // bubble's own swipe-left-to-reply takes priority (see SwipeToReply).
  const timestampReveal = useSharedValue(0);
  const timestampSwipe = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX(-TIMESTAMP_SWIPE_ACTIVATION)
        .failOffsetY([-TIMESTAMP_SWIPE_VERTICAL_FAIL, TIMESTAMP_SWIPE_VERTICAL_FAIL])
        .onUpdate((event) => {
          const distance = Math.max(0, -event.translationX);
          timestampReveal.set(
            distance <= TIMESTAMP_REVEAL_WIDTH
              ? distance
              : TIMESTAMP_REVEAL_WIDTH + (distance - TIMESTAMP_REVEAL_WIDTH) * 0.15
          );
        })
        .onFinalize(() => {
          timestampReveal.set(withSpring(0, TIMESTAMP_RETURN_SPRING));
        }),
    [timestampReveal]
  );
  const timestampRevealContext = useMemo(
    () => ({ reveal: timestampReveal, listGesture: timestampSwipe }),
    [timestampReveal, timestampSwipe]
  );

  // Inquiry chats float the apartment under the header; the list pads its
  // top edge by the card's height so the oldest messages stay reachable.
  const chatApartment = useChatApartment(apartmentId, otherUserId);
  const [apartmentCardHeight, setApartmentCardHeight] = useState(0);
  const handleApartmentCardLayout = useCallback((event: LayoutChangeEvent) => {
    setApartmentCardHeight(Math.round(event.nativeEvent.layout.height));
  }, []);
  const listTopInset = chatApartment ? apartmentCardHeight : 0;
  const handleViewApartment = useCallback(() => {
    if (!portal || !apartmentId) return;
    router.push(getChatApartmentRoute(portal, apartmentId));
  }, [apartmentId, portal, router]);

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
    (item: Message) => (anchor: {
      pageX: number;
      pageY: number;
      width: number;
      height: number;
    }) => {
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
    setIsEmojiPanelOpen(false);
  }, []);

  // Touching the conversation closes the chat box's emoji panel (Messenger style).
  const closeEmojiPanel = useCallback(() => setIsEmojiPanelOpen(false), []);

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

  // The held message is stacked with its reaction pill and actions card and
  // centered in the usable viewport (see HoldStack / holdLayout.ts). An
  // unmeasured anchor starts from the viewport center.
  const usableTop = headerHeight + 8;
  const usableBottom = screenH - insets.bottom - 90;
  const bubbleOrigTop =
    activeHold && activeMsg
      ? activeHold.pageY < 0
        ? usableTop + (usableBottom - usableTop - activeHold.height) / 2
        : activeHold.pageY - rootY
      : 0;

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

  // A static import: loading expo-clipboard on demand failed in development
  // ("Requiring unknown module") and fell back to an alert without copying.
  const handleHoldCopy = useCallback(async () => {
    if (!activeMsg?.message) return;
    const text = activeMsg.message;
    setActiveHold(null);
    try {
      await Clipboard.setStringAsync(text);
      toast.show({ variant: 'success', label: 'Message copied' });
    } catch (error) {
      console.error('[chat] Failed to copy message:', error);
      Alert.alert('Copy failed', 'Unable to copy message.');
    }
  }, [activeMsg, toast]);

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

  // "Seen" sits under the newest of my messages the other person has read.
  const seenMessageId = useMemo(() => getSeenMessageId(messages), [messages]);

  const renderItem = useCallback(
    ({ item, index }: { item: Message; index: number }) => (
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
        onReply={() => handleReply(item)}
        groupPosition={getBubbleGroupPosition(messages, index)}
        showSeen={item.id === seenMessageId}
        showSenderAvatar={showsSenderAvatar(messages, index)}
        otherUserAvatar={otherUserAvatar}
        onSenderAvatarPress={portal && otherUserId ? handleViewProfile : undefined}
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
      handleReply,
      messages,
      seenMessageId,
      otherUserAvatar,
      portal,
      otherUserId,
      handleViewProfile,
      activeHold,
      retryChatMediaOnce,
    ]
  );

  return (
    <View ref={rootRef} collapsable={false} className="flex-1">
    <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
    <ScreenWrapper
      dismissKeyboardOnTouch={false}
      header={
        <View onLayout={handleHeaderLayout}>
          <ChatHeader
            name={otherUserName}
            profilePicture={otherUserAvatar ?? undefined}
            phoneNumber={otherUserPhoneNumber ?? undefined}
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
        <View className="flex-1">
          {loading ? (
            <View className="flex-1" style={{ paddingTop: listTopInset }}>
              <ChatLoadingSkeleton />
            </View>
          ) : (
            <TimestampRevealContext.Provider value={timestampRevealContext}>
              <GestureDetector gesture={timestampSwipe}>
                <View
                  className="flex-1"
                  collapsable={false}
                  onTouchStart={isEmojiPanelOpen ? closeEmojiPanel : undefined}
                >
                  <FlatList
                    inverted
                    ref={flatListRef}
                    className="flex-1"
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={
                      messages.length === 0
                        ? { flexGrow: 1, justifyContent: 'center', paddingBottom: listTopInset }
                        : {
                            flexGrow: 1,
                            paddingHorizontal: 16,
                            // Inverted: paddingTop is the gap above the chat box, which
                            // the newest bubble's own bottom gap already provides.
                            paddingTop: 0,
                            paddingBottom: 10 + listTopInset,
                          }
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
                          otherPartyLabel={portal ? getOtherPartyLabel(portal) : undefined}
                          isVerified={otherUserIsVerified}
                          hasMessages={messages.length > 0}
                          onViewProfile={portal && otherUserId ? handleViewProfile : undefined}
                          onViewApartment={portal && apartmentId ? handleViewApartment : undefined}
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
              </GestureDetector>
            </TimestampRevealContext.Provider>
          )}
          {chatApartment && (
            <View className="absolute inset-x-0 top-0" pointerEvents="box-none">
              <ChatApartmentCard
                apartment={chatApartment}
                onPress={handleViewApartment}
                onLayout={handleApartmentCardLayout}
              />
            </View>
          )}
        </View>

        <View className="px-3 py-2">
          {blockedByMe || blockedMe ? (
            <ChatBlockedNotice
              otherUserName={otherUserName}
              blockedByMe={blockedByMe}
              isUnblocking={isUnblocking}
              onUnblock={() => {
                unblock().catch((error: unknown) => {
                  console.error('[chat] Failed to unblock:', error);
                  Alert.alert("Couldn't unblock", 'Check your connection and try again.');
                });
              }}
            />
          ) : (
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
            isEmojiPickerOpen={isEmojiPanelOpen}
            onEmojiPickerOpenChange={setIsEmojiPanelOpen}
          />
          )}
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
    </BlurTargetView>
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
          <BlurBackdrop isDark={isDark} blurTarget={blurTargetRef} />
        </Pressable>
        {activeMsg && holdData && activeHold && (
          <HoldStack
            key={activeMsg.id}
            isSent={activeMsg.isSent}
            bubbleOrigTop={bubbleOrigTop}
            bubbleHeight={activeHold.height}
            viewport={{ screenH, usableTop, usableBottom }}
            startInset={activeMsg.isSent ? 0 : SENDER_AVATAR_GUTTER}
            reactions={
              holdData.canReact ? (
                <ReactionStrip
                  myReaction={holdData.myReaction}
                  onSelect={handleHoldReact}
                  onOpenFullPicker={handleHoldPicker}
                />
              ) : null
            }
            bubble={
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
                groupPosition={getBubbleGroupPosition(
                  messages,
                  messages.findIndex((m) => m.id === activeMsg.id)
                )}
              />
            }
            menu={
              <HoldMenu
                data={holdData}
                onReply={handleHoldReply}
                onCopy={handleHoldCopy}
                onUnsend={handleHoldUnsend}
              />
            }
          />
        )}
      </View>
    )}
    <EmojiPicker
      {...emojiPickerSettings}
      expandable
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
