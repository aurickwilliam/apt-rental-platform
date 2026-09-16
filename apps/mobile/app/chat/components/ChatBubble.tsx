import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions, Alert } from 'react-native';
import { Image, type ImageLoadEventData } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';

import {
  IconPlayerPlayFilled,
  IconX,
  IconCopy,
  IconTrash,
  IconArrowBackUp,
  IconPhoto,
  IconGif,
} from '@tabler/icons-react-native';

import { Menu } from 'heroui-native';

import type { MessageType, ReplyPreview } from '@/service/chat/chatService';

import { useColors } from '@/hooks/useTheme';

import { isEmojiOnly } from '@/service/chat/chatService';

export interface BubbleLayout {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

interface ChatBubbleProps {
  id?: string;
  message: string | null;
  messageType?: MessageType;
  attachmentUrl?: string | null;
  attachmentPath?: string | null;
  attachmentMimeType?: string | null;
  thumbnailUrl?: string | null;
  thumbnailPath?: string | null;
  timestamp?: string;
  createdAt?: string;
  isSent?: boolean;
  isPending?: boolean;
  replyTo?: ReplyPreview | null;
  replyDeleted?: boolean;
  otherUserName?: string;
  onImagePress?: (uri: string) => void;
  onMediaLoadError?: (mediaKind: 'attachment' | 'thumbnail') => void;
  onReply?: () => void;
  onUnsend?: () => void;
  onMenuOpenChange?: (open: boolean, layout?: BubbleLayout) => void;
  /** Incremented by the parent to request the open menu be closed (e.g. floating preview tap). */
  dismissToken?: number;
}

export interface ChatBubbleContentProps {
  message: string | null;
  messageType?: MessageType;
  attachmentUrl?: string | null;
  attachmentPath?: string | null;
  thumbnailUrl?: string | null;
  thumbnailPath?: string | null;
  isSent?: boolean;
  replyTo?: ReplyPreview | null;
  replyDeleted?: boolean;
  otherUserName?: string;
  /** false renders a static, non-interactive clone for the floating preview above the blur. */
  interactive?: boolean;
  onImagePress?: (uri: string) => void;
  onMediaLoadError?: (mediaKind: 'attachment' | 'thumbnail') => void;
  onLongPress?: () => void;
}

const ATTACHMENT_BORDER_RADIUS = 18;
const ATTACHMENT_MAX_WIDTH = 220;
const ATTACHMENT_MAX_HEIGHT = 280;

function calculateImageSize(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (naturalWidth <= maxWidth && naturalHeight <= maxHeight) {
    return { width: naturalWidth, height: naturalHeight };
  }

  const widthRatio = maxWidth / naturalWidth;
  const heightRatio = maxHeight / naturalHeight;
  const ratio = Math.min(widthRatio, heightRatio);

  return {
    width: Math.round(naturalWidth * ratio),
    height: Math.round(naturalHeight * ratio),
  };
}

function formatHoldDate(iso?: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso ?? '';
  }
}

function getReplySnippet(reply: ReplyPreview): string {
  if (reply.message) {
    const t = reply.message.trim();
    return t.length > 90 ? `${t.slice(0, 90)}…` : t;
  }
  switch (reply.messageType) {
    case 'image':
      return 'Photo';
    case 'video':
      return 'Video';
    case 'gif':
      return 'GIF';
    default:
      return '';
  }
}

export function BlurBackdrop({ isDark }: { isDark: boolean }) {
  const [BlurViewComp, setBlurViewComp] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('expo-blur')
      .then((m) => {
        if (!cancelled && m?.BlurView) setBlurViewComp(() => m.BlurView as React.ComponentType<any>);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (BlurViewComp) {
    return (
      <BlurViewComp
        tint={isDark ? 'dark' : 'light'}
        intensity={25}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      />
    );
  }
  return null;
}

/** Pure bubble body shared by the list row and the floating preview above the blur. */
export function ChatBubbleContent({
  message,
  messageType = 'text',
  attachmentUrl,
  attachmentPath,
  thumbnailUrl,
  thumbnailPath,
  isSent = false,
  replyTo = null,
  replyDeleted = false,
  otherUserName,
  interactive = true,
  onImagePress,
  onMediaLoadError,
  onLongPress,
}: ChatBubbleContentProps) {
  const { colors } = useColors();
  const { width: screenWidth } = useWindowDimensions();

  const bubbleColor = isSent ? 'bg-accent' : 'bg-surface-tertiary';
  const textColor = isSent ? 'text-white' : 'text-foreground';

  const hasAttachment = messageType !== 'text' && !!attachmentUrl;
  const isVideo = hasAttachment && messageType === 'video';
  const isVisualMedia = hasAttachment && (messageType === 'image' || messageType === 'gif');
  const isBrokenAttachment = messageType !== 'text' && !attachmentUrl;

  const isEmojiMessage = messageType === 'text' && isEmojiOnly(message);
  const emojiCount = [...(message ?? '')].length;

  let fontSize = 46;
  if (emojiCount === 2) fontSize = 40;
  if (emojiCount >= 3) fontSize = 34;

  const hasReply = replyDeleted || !!replyTo;
  // IG-style caption names the replier (this bubble's sender), not the quoted author.
  const replierLabel = hasReply
    ? isSent
      ? 'You replied'
      : `${otherUserName ?? 'Someone'} replied`
    : null;
  const replySnippet = replyTo ? getReplySnippet(replyTo) : null;
  const quotedType = replyTo?.messageType ?? 'text';
  const isQuotedMedia = !!replyTo && quotedType !== 'text';
  const labelAlign = isSent ? 'self-end text-right' : 'self-start text-left';
  // Stacked layout: the quote sits above the reply with a small gap —
  // no overlap, same width/alignment.
  const replyOverlap = hasReply ? 'mt-1' : '';

  const quotedMediaIcon =
    quotedType === 'video' ? (
      <IconPlayerPlayFilled size={16} color={colors.gray500} />
    ) : quotedType === 'gif' ? (
      <IconGif size={16} color={colors.gray500} />
    ) : (
      <IconPhoto size={16} color={colors.gray500} />
    );

  const quoteBlock = replyDeleted ? (
    <View
      className="px-3 py-2 rounded-3xl bg-surface"
      style={{ maxWidth: isVisualMedia || isVideo ? ATTACHMENT_MAX_WIDTH : 260 }}
    >
      <Text className="text-xs font-inter italic text-gray-500" numberOfLines={2}>
        Original message unavailable
      </Text>
    </View>
  ) : replyTo ? (
    <View
      className="px-3 py-2 rounded-3xl bg-surface"
      style={{ maxWidth: isVisualMedia || isVideo ? ATTACHMENT_MAX_WIDTH : 260 }}
    >
      {isQuotedMedia ? (
        <View className="flex-row items-center gap-2">
          <View className="size-8 rounded-lg bg-surface-tertiary items-center justify-center">
            {quotedMediaIcon}
          </View>
          <Text className="flex-1 text-sm font-inter text-muted" numberOfLines={2}>
            {replySnippet}
          </Text>
        </View>
      ) : (
        <Text className="text-sm font-inter text-muted" numberOfLines={2}>
          {replySnippet}
        </Text>
      )}
    </View>
  ) : null;

  return (
    <>
      {hasReply && (
        <Text className={`text-xs font-inter text-gray-500 mb-1 px-2 ${labelAlign}`}>
          {replierLabel}
        </Text>
      )}
      {quoteBlock}
      {isVideo ? (
        <View className={replyOverlap}>
          <VideoBubble
            uri={attachmentUrl!}
            thumbnailUrl={thumbnailUrl}
            thumbnailPath={thumbnailPath}
            onMediaLoadError={interactive ? onMediaLoadError : undefined}
            onLongPress={interactive ? onLongPress : undefined}
            interactive={interactive}
          />
        </View>
      ) : isVisualMedia ? (
        <View className={replyOverlap}>
          <VisualMediaBubble
            uri={attachmentUrl!}
            attachmentPath={attachmentPath}
            onImagePress={interactive ? onImagePress : undefined}
            onMediaLoadError={interactive ? onMediaLoadError : undefined}
            onLongPress={interactive ? onLongPress : undefined}
            screenWidth={screenWidth}
            colors={colors}
            interactive={interactive}
          />
        </View>
      ) : isBrokenAttachment ? (
        <View className={replyOverlap}>
          <View
            style={{
              width: ATTACHMENT_MAX_WIDTH,
              height: ATTACHMENT_MAX_HEIGHT,
              borderRadius: ATTACHMENT_BORDER_RADIUS,
            }}
            className="bg-surface-tertiary items-center justify-center"
          >
            <Text className="text-gray-400 text-xs font-inter">Media unavailable</Text>
          </View>
        </View>
      ) : isEmojiMessage ? (
        <View className={replyOverlap}>
          <Text style={{ fontSize }}>{message}</Text>
        </View>
      ) : (
        <View className={`px-3 py-2 rounded-3xl ${bubbleColor} ${replyOverlap}`}>
          <Text className={`text-sm font-inter leading-6 ${textColor}`}>{message}</Text>
        </View>
      )}
    </>
  );
}

export default function ChatBubble({
  message,
  messageType = 'text',
  attachmentUrl,
  attachmentPath,
  attachmentMimeType,
  thumbnailUrl,
  thumbnailPath,
  createdAt,
  isSent = false,
  isPending = false,
  replyTo = null,
  replyDeleted = false,
  otherUserName,
  onImagePress,
  onMediaLoadError,
  onReply,
  onUnsend,
  onMenuOpenChange,
  dismissToken = 0,
}: ChatBubbleProps) {
  const { colors } = useColors();
  const [menuVisible, setMenuVisible] = useState(false);
  const allowOpenRef = useRef(false);
  const triggerRef = useRef<any>(null);
  // Own wrapper View for measuring the bubble rect. It sits OUTSIDE the Menu
  // Slot on purpose: the Slot reads children.ref, which throws on React 19
  // ("Accessing element.ref was removed"), and triggerRef is an augmented
  // plain object whose detached measure methods lose their native binding.
  // collapsable={false} keeps the native view around on Android so measuring
  // always resolves.
  const wrapRef = useRef<any>(null);
  const onMenuOpenChangeRef = useRef(onMenuOpenChange);
  // Latest-ref kept fresh in an effect (runs before any event handler reads it).
  useEffect(() => {
    onMenuOpenChangeRef.current = onMenuOpenChange;
  });

  const rowAlignment = isSent ? 'self-end' : 'self-start';
  const contentAlignment = isSent ? 'items-end' : 'items-start';

  const canCopy = messageType === 'text' && !!message && !isPending;
  const canUnsend = isSent && !isPending;
  const formattedDate = useMemo(() => formatHoldDate(createdAt), [createdAt]);

  const gatedSetOpen = useCallback((next: boolean) => {
    if (next && !allowOpenRef.current) return;
    allowOpenRef.current = false;
    setMenuVisible(next);
    if (!next) {
      onMenuOpenChangeRef.current?.(false);
    }
  }, []);

  const handleLongPress = useCallback(() => {
    const trigger = triggerRef.current as any;
    // Open immediately — the menu must never depend on the measure callback
    // (if it never resolves, the menu would silently fail to open at all).
    // The parent first shows blur-only, then upgrades to the floating clone
    // once this rect lands.
    allowOpenRef.current = true;
    onMenuOpenChangeRef.current?.(true);
    trigger?.open?.();
    try {
      const target = wrapRef.current as any;
      target?.measureInWindow?.((x: number, y: number, width: number, height: number) => {
        if (
          typeof x === 'number' &&
          typeof y === 'number' &&
          typeof width === 'number' &&
          typeof height === 'number' &&
          width > 0 &&
          height > 0
        ) {
          onMenuOpenChangeRef.current?.(true, { pageX: x, pageY: y, width, height });
        }
      });
    } catch {
      // Measure unavailable — parent stays on blur-only (previous behavior).
    }
  }, []);

  // Parent-driven dismiss (floating preview tap, scroll, keyboard). Routes
  // through the trigger so Menu clears its internal triggerPosition too.
  const dismissTokenRef = useRef(dismissToken);
  useEffect(() => {
    if (dismissToken !== dismissTokenRef.current) {
      dismissTokenRef.current = dismissToken;
      if (menuVisible) {
        try {
          triggerRef.current?.close?.();
        } catch {
          // Fall through — the Menu.Overlay outside-tap also closes.
        }
      }
    }
  }, [dismissToken, menuVisible]);

  const handleCopy = useCallback(async () => {
    if (!canCopy || !message) return;
    try {
      let copied = false;
      try {
        const Clipboard = await import('expo-clipboard');
        if (Clipboard?.setStringAsync) {
          await Clipboard.setStringAsync(message);
          copied = true;
        }
      } catch {
        // native module missing — fall through to web fallback
      }
      if (!copied && typeof navigator !== 'undefined' && (navigator as unknown as { clipboard?: { writeText?: (t: string) => Promise<void> } }).clipboard?.writeText) {
        await (navigator as unknown as { clipboard: { writeText: (t: string) => Promise<void> } }).clipboard.writeText(message);
        copied = true;
      }
      if (!copied) {
        Alert.alert('Copied', message);
      }
    } catch {
      Alert.alert('Copy failed', 'Unable to copy message.');
    }
  }, [canCopy, message]);

  const handleReplyPress = useCallback(() => {
    if (onReply) onReply();
    else Alert.alert('Reply', 'Reply is coming soon.');
  }, [onReply]);

  const handleUnsendPress = useCallback(() => {
    if (!canUnsend) return;
    if (onUnsend) onUnsend();
    else Alert.alert('Unsend', 'Unsend will be available soon.');
  }, [canUnsend, onUnsend]);

  return (
    <Menu isOpen={menuVisible} onOpenChange={gatedSetOpen}>
        <View
          ref={wrapRef}
          collapsable={false}
          className={`max-w-[80%] mb-4 ${rowAlignment}`}
        >
        <Menu.Trigger ref={triggerRef} asChild>
          <Pressable
            onLongPress={handleLongPress}
            delayLongPress={350}
            className={`w-full ${contentAlignment}`}
            android_ripple={undefined}
          >
            <ChatBubbleContent
              message={message}
              messageType={messageType}
              attachmentUrl={attachmentUrl}
              attachmentPath={attachmentPath}
              thumbnailUrl={thumbnailUrl}
              thumbnailPath={thumbnailPath}
              isSent={isSent}
              replyTo={replyTo}
              replyDeleted={replyDeleted}
              otherUserName={otherUserName}
              interactive
              onImagePress={onImagePress}
              onMediaLoadError={onMediaLoadError}
              onLongPress={handleLongPress}
            />
          </Pressable>
        </Menu.Trigger>
        </View>
        <Menu.Portal>
          <Menu.Overlay className="bg-transparent" />
        <Menu.Content
          presentation="popover"
          placement="top"
          align={isSent ? 'end' : 'start'}
          offset={8}
          width="content-fit"
          className="rounded-[20px] px-2 py-2 min-w-50"
        >
          <Menu.Label className="text-center text-[13px]">{formattedDate || 'Just now'}</Menu.Label>
          <Menu.Item onPress={handleReplyPress}>
            <IconArrowBackUp size={22} color={colors.textPrimary} />
            <Menu.ItemTitle>Reply</Menu.ItemTitle>
          </Menu.Item>
          <Menu.Item onPress={handleCopy} isDisabled={!canCopy}>
            <IconCopy size={22} color={colors.textPrimary} />
            <Menu.ItemTitle>Copy</Menu.ItemTitle>
          </Menu.Item>
          {canUnsend ? (
            <Menu.Item onPress={handleUnsendPress} variant="danger">
              <IconTrash size={22} color={colors.danger} />
              <Menu.ItemTitle>Unsend</Menu.ItemTitle>
            </Menu.Item>
          ) : (
            <Menu.Item isDisabled>
              <IconTrash size={22} color={colors.gray400} />
              <Menu.ItemTitle>Unsend</Menu.ItemTitle>
            </Menu.Item>
          )}
        </Menu.Content>
        </Menu.Portal>
    </Menu>
  );
}

// ─── Image / GIF attachment ───────────────────────────────────────────────────
function VisualMediaBubble({
  uri,
  attachmentPath,
  onImagePress,
  onMediaLoadError,
  onLongPress,
  screenWidth,
  colors,
  interactive = true,
}: {
  uri: string;
  attachmentPath?: string | null;
  onImagePress?: (uri: string) => void;
  onMediaLoadError?: (mediaKind: 'attachment') => void;
  onLongPress?: () => void;
  screenWidth: number;
  colors: Record<string, string>;
  interactive?: boolean;
}) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  const maxBubbleWidth = Math.min(ATTACHMENT_MAX_WIDTH, screenWidth * 0.8);

  const handleLoad = useCallback(
    (event: ImageLoadEventData) => {
      const { width, height } = event.source;
      setDimensions(calculateImageSize(width, height, maxBubbleWidth, ATTACHMENT_MAX_HEIGHT));
    },
    [maxBubbleWidth]
  );

  const displaySize = dimensions ?? { width: maxBubbleWidth, height: ATTACHMENT_MAX_HEIGHT };

  const imageNode = (
    <Image
      source={{
        uri,
        cacheKey: attachmentPath ?? undefined,
      }}
      style={[
        displaySize,
        { borderRadius: ATTACHMENT_BORDER_RADIUS, borderColor: colors.gray300, borderWidth: 1 },
      ]}
      cachePolicy="disk"
      contentFit="contain"
      transition={150}
      onLoad={handleLoad}
      onError={() => onMediaLoadError?.('attachment')}
    />
  );

  if (!interactive) {
    return <View>{imageNode}</View>;
  }

  return (
    <Pressable onPress={() => onImagePress?.(uri)} onLongPress={onLongPress} delayLongPress={350}>
      {imageNode}
    </Pressable>
  );
}

// ─── Video attachment ─────────────────────────────────────────────────────────
function VideoBubble({
  uri,
  thumbnailUrl,
  thumbnailPath,
  onMediaLoadError,
  onLongPress,
  interactive = true,
}: {
  uri: string;
  thumbnailUrl?: string | null;
  thumbnailPath?: string | null;
  onMediaLoadError?: (mediaKind: 'attachment' | 'thumbnail') => void;
  onLongPress?: () => void;
  interactive?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  const handleLoad = useCallback((event: ImageLoadEventData) => {
    const { width, height } = event.source;
    setDimensions(calculateImageSize(width, height, ATTACHMENT_MAX_WIDTH, ATTACHMENT_MAX_HEIGHT));
  }, []);

  const displaySize = dimensions ?? { width: ATTACHMENT_MAX_WIDTH, height: ATTACHMENT_MAX_HEIGHT };

  const thumbnailNode = (
    <>
      {thumbnailUrl && (
        <Image
          source={{
            uri: thumbnailUrl,
            cacheKey: thumbnailPath ?? undefined,
          }}
          style={displaySize}
          className="absolute inset-0"
          cachePolicy="disk"
          contentFit="cover"
          onLoad={handleLoad}
          onError={() => onMediaLoadError?.('thumbnail')}
        />
      )}
      <View className="absolute inset-0 items-center justify-center bg-black/20">
        <View className="bg-black/50 rounded-full p-3">
          <IconPlayerPlayFilled size={26} color="white" />
        </View>
      </View>
    </>
  );

  // Static clone for the floating preview above the blur — never auto-plays,
  // never opens the fullscreen player, never captures touches.
  if (!interactive) {
    return (
      <View
        accessibilityLabel="Video message"
        style={[displaySize, { borderRadius: ATTACHMENT_BORDER_RADIUS }]}
        className="overflow-hidden bg-black border border-border"
      >
        {thumbnailNode}
      </View>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => setIsPlaying(true)}
        onLongPress={onLongPress}
        delayLongPress={350}
        accessibilityRole="button"
        accessibilityLabel="Play video"
        style={[displaySize, { borderRadius: ATTACHMENT_BORDER_RADIUS }]}
        className="overflow-hidden bg-black border border-border"
      >
        {thumbnailNode}
      </Pressable>

      {isPlaying && (
        <Modal visible animationType="fade" transparent onRequestClose={() => setIsPlaying(false)}>
          <VideoPlayerModal
            uri={uri}
            onClose={() => setIsPlaying(false)}
            onPlaybackError={() => onMediaLoadError?.('attachment')}
          />
        </Modal>
      )}
    </>
  );
}

function VideoPlayerModal({
  uri,
  onClose,
  onPlaybackError,
}: {
  uri: string;
  onClose: () => void;
  onPlaybackError: () => void;
}) {
  const playbackErrorReported = useRef(false);
  const player = useVideoPlayer(uri, (p) => {
    p.play();
  });

  useEffect(() => {
    const subscription = player.addListener('statusChange', ({ error }) => {
      if (!error || playbackErrorReported.current) return;

      playbackErrorReported.current = true;
      onPlaybackError();
    });

    return () => subscription.remove();
  }, [onPlaybackError, player]);

  return (
    <View className="flex-1 bg-black items-center justify-center">
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close video"
        className="absolute top-14 right-5 z-10 bg-black/50 rounded-full p-2"
      >
        <IconX size={22} color="white" />
      </Pressable>

      <VideoView
        player={player}
        style={{ width: '100%', height: '60%' }}
        nativeControls
        fullscreenOptions={{ enable: true }}
        contentFit="contain"
      />
    </View>
  );
}
