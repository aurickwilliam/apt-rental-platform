import { useState, useCallback, useEffect, useRef } from 'react';
import { Keyboard, Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Image, type ImageLoadEventData } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';

import {
  IconPlayerPlayFilled,
  IconX,
  IconPhoto,
  IconGif,
} from '@tabler/icons-react-native';

import type { MessageReaction, MessageType, ReplyPreview } from '@/service/chat/chatService';

import { useColors } from '@/hooks/useTheme';

import { isEmojiOnly } from '@/service/chat/chatService';

import { HEART_REACTION } from './reactionEmojis';

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
  reactions?: MessageReaction[];
  onImagePress?: (uri: string) => void;
  onMediaLoadError?: (mediaKind: 'attachment' | 'thumbnail') => void;
  onReact?: (emoji: string) => void;
  /** Long-press report with the bubble's window rect for anchoring the hold stack. */
  onHold?: (anchor: { pageY: number; height: number }) => void;
  /** Hides the row (opacity-0, layout kept) while its elevated clone shows. */
  hidden?: boolean;
  /** @deprecated Use onHold. Kept for compat; fires with (true) on long-press. */
  onMenuOpenChange?: (open: boolean) => void;
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
  reactions?: MessageReaction[];
  /** false renders a static, non-interactive clone for the floating preview above the blur. */
  interactive?: boolean;
  /** false disables reaction gestures (e.g. pending messages) while still showing the badge. */
  canReact?: boolean;
  onImagePress?: (uri: string) => void;
  onMediaLoadError?: (mediaKind: 'attachment' | 'thumbnail') => void;
  onLongPress?: () => void;
  onReact?: (emoji: string) => void;
}

const DOUBLE_TAP_WINDOW_MS = 300;

export function playReactionHaptic() {
  // Lazy + fire-and-forget, mirroring the expo-clipboard/expo-blur handling below.
  import('expo-haptics')
    .then((m) => m?.impactAsync?.(m?.ImpactFeedbackStyle?.Light))
    .catch(() => {});
}

/**
 * Single/double-tap disambiguation for Pressables that already own onPress.
 * Single tap is deferred by the double-tap window so a double-tap never also
 * fires the single action (e.g. opening the image viewer).
 */
function useDoubleTapPress({
  onSingleTap,
  onDoubleTap,
  disabled = false,
}: {
  onSingleTap?: () => void;
  onDoubleTap: () => void;
  disabled?: boolean;
}) {
  const lastTapRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return useCallback(() => {
    // No reaction handler — preserve plain single-tap behavior with no deferral.
    if (disabled) {
      lastTapRef.current = 0;
      onSingleTap?.();
      return;
    }
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_WINDOW_MS) {
      lastTapRef.current = 0;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      onDoubleTap();
    } else {
      lastTapRef.current = now;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        onSingleTap?.();
      }, DOUBLE_TAP_WINDOW_MS);
    }
  }, [disabled, onDoubleTap, onSingleTap]);
}

/** One circle per reaction, overlapped and pinned to the bubble's bottom-right (both sides). */
export function ReactionBadge({
  reactions,
  isSent = false,
}: {
  reactions: MessageReaction[];
  isSent?: boolean;
}) {
  if (reactions.length === 0) return null;
  const shown = reactions.slice(0, 3);
  const circleBg = isSent ? 'bg-accent' : 'bg-surface-tertiary';
  return (
    <View
      className="absolute -bottom-3 right-1 z-10 flex-row items-center"
      accessibilityRole="text"
      accessibilityLabel={`Reactions: ${shown.map((r) => r.emoji).join(', ')}`}
    >
      {shown.map((r, index) => (
        <View
          key={r.userId}
          className={`size-6 rounded-full items-center justify-center border border-border ${circleBg} ${
            index > 0 ? '-ml-2' : ''
          }`}
        >
          <Text className="text-xs text-center" style={{ lineHeight: 14, textAlignVertical: 'center' }}>
            {r.emoji}
          </Text>
        </View>
      ))}
    </View>
  );
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

export function formatHoldDate(iso?: string): string {
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
        intensity={60}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      />
    );
  }
  return null;
}

/** Pure bubble body shared by the list row and the elevated clone above the backdrop. */
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
  reactions = [],
  interactive = true,
  canReact = true,
  onImagePress,
  onMediaLoadError,
  onLongPress,
  onReact,
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
        <View className={`relative ${replyOverlap}`}>
          <VideoBubble
            uri={attachmentUrl!}
            thumbnailUrl={thumbnailUrl}
            thumbnailPath={thumbnailPath}
            onMediaLoadError={interactive ? onMediaLoadError : undefined}
            onLongPress={interactive ? onLongPress : undefined}
            interactive={interactive}
            canReact={interactive && canReact}
            onReact={interactive ? onReact : undefined}
          />
          <ReactionBadge reactions={reactions} isSent={isSent} />
        </View>
      ) : isVisualMedia ? (
        <View className={`relative ${replyOverlap}`}>
          <VisualMediaBubble
            uri={attachmentUrl!}
            attachmentPath={attachmentPath}
            onImagePress={interactive ? onImagePress : undefined}
            onMediaLoadError={interactive ? onMediaLoadError : undefined}
            onLongPress={interactive ? onLongPress : undefined}
            screenWidth={screenWidth}
            colors={colors}
            interactive={interactive}
            canReact={interactive && canReact}
            onReact={interactive ? onReact : undefined}
          />
          <ReactionBadge reactions={reactions} isSent={isSent} />
        </View>
      ) : isBrokenAttachment ? (
        <View className={`relative ${replyOverlap}`}>
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
          <ReactionBadge reactions={reactions} isSent={isSent} />
        </View>
      ) : isEmojiMessage ? (
        <View className={`relative ${replyOverlap}`}>
          <Text style={{ fontSize }}>{message}</Text>
          <ReactionBadge reactions={reactions} isSent={isSent} />
        </View>
      ) : (
        <View className={`relative px-3 py-2 rounded-3xl ${bubbleColor} ${replyOverlap}`}>
          <Text className={`text-sm font-inter leading-6 ${textColor}`}>{message}</Text>
          <ReactionBadge reactions={reactions} isSent={isSent} />
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
  reactions = [],
  onImagePress,
  onMediaLoadError,
  onReact,
  onHold,
  hidden = false,
  onMenuOpenChange,
}: ChatBubbleProps) {
  const onHoldRef = useRef(onHold);
  const onMenuOpenChangeRef = useRef(onMenuOpenChange);
  // Latest-refs kept fresh in an effect (runs before any event handler reads them).
  useEffect(() => {
    onHoldRef.current = onHold;
    onMenuOpenChangeRef.current = onMenuOpenChange;
  });

  const rowRef = useRef<View>(null);

  const rowAlignment = isSent ? 'self-end' : 'self-start';
  const contentAlignment = isSent ? 'items-end' : 'items-start';

  const canReact = !isPending && !!onReact;

  const handleDoubleTap = useCallback(() => {
    playReactionHaptic();
    onReact?.(HEART_REACTION);
  }, [onReact]);

  // Text/quote taps land on the row Pressable (media taps are consumed by the
  // inner media Pressables, which run their own double-tap disambiguation).
  const handleRowPress = useDoubleTapPress({
    onDoubleTap: handleDoubleTap,
    disabled: !canReact,
  });

  // Long-press measures the row's window rect so the parent can anchor the
  // hold stack near the held message. Single taps never report a hold.
  const handleLongPress = useCallback(() => {
    playReactionHaptic();
    Keyboard.dismiss();
    const target = rowRef.current as unknown as {
      measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void;
    } | null;
    const measure = target?.measureInWindow;
    if (typeof measure !== 'function') {
      // Fallback (e.g. no native view): open unanchored, parent centers the stack.
      onHoldRef.current?.({ pageY: -1, height: 0 });
    } else {
      try {
        measure.call(target, (_x, pageY, _w, height) => {
          onHoldRef.current?.({ pageY, height });
        });
      } catch {
        onHoldRef.current?.({ pageY: -1, height: 0 });
      }
    }
    onMenuOpenChangeRef.current?.(true);
  }, []);

  return (
    <View
      ref={rowRef}
      collapsable={false}
      className={`max-w-[80%] mb-4 ${rowAlignment} ${hidden ? 'opacity-0' : ''}`}
    >
      <Pressable
        onPress={handleRowPress}
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
          reactions={reactions}
          interactive
          canReact={canReact}
          onImagePress={onImagePress}
          onMediaLoadError={onMediaLoadError}
          onLongPress={handleLongPress}
          onReact={onReact}
        />
      </Pressable>
    </View>
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
  canReact = true,
  onReact,
}: {
  uri: string;
  attachmentPath?: string | null;
  onImagePress?: (uri: string) => void;
  onMediaLoadError?: (mediaKind: 'attachment') => void;
  onLongPress?: () => void;
  screenWidth: number;
  colors: Record<string, string>;
  interactive?: boolean;
  canReact?: boolean;
  onReact?: (emoji: string) => void;
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

  const handleDoubleTap = useCallback(() => {
    playReactionHaptic();
    onReact?.(HEART_REACTION);
  }, [onReact]);

  const handlePress = useDoubleTapPress({
    onSingleTap: () => onImagePress?.(uri),
    onDoubleTap: handleDoubleTap,
    disabled: !canReact,
  });

  if (!interactive) {
    return <View>{imageNode}</View>;
  }

  return (
    <Pressable onPress={handlePress} onLongPress={onLongPress} delayLongPress={350}>
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
  canReact = true,
  onReact,
}: {
  uri: string;
  thumbnailUrl?: string | null;
  thumbnailPath?: string | null;
  onMediaLoadError?: (mediaKind: 'attachment' | 'thumbnail') => void;
  onLongPress?: () => void;
  interactive?: boolean;
  canReact?: boolean;
  onReact?: (emoji: string) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  const handleDoubleTap = useCallback(() => {
    playReactionHaptic();
    onReact?.(HEART_REACTION);
  }, [onReact]);

  const handlePress = useDoubleTapPress({
    onSingleTap: () => setIsPlaying(true),
    onDoubleTap: handleDoubleTap,
    disabled: !canReact,
  });

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
        onPress={handlePress}
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
