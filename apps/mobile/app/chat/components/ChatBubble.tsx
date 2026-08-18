import { useState, useCallback, useEffect, useRef } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Image, type ImageLoadEventData } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';

import { IconPlayerPlayFilled, IconX } from '@tabler/icons-react-native';

import type { MessageType } from '@/service/chat/chatService';

import { useColors } from '@/hooks/useTheme';

import { isEmojiOnly } from '@/service/chat/chatService';

interface ChatBubbleProps {
  message: string | null;
  messageType?: MessageType;
  attachmentUrl?: string | null;
  attachmentPath?: string | null;
  attachmentMimeType?: string | null;
  thumbnailUrl?: string | null;
  thumbnailPath?: string | null;
  timestamp: string;
  isSent?: boolean;
  onImagePress?: (uri: string) => void;
  onMediaLoadError?: (mediaKind: 'attachment' | 'thumbnail') => void;
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

export default function ChatBubble({
  message,
  messageType = 'text',
  attachmentUrl,
  attachmentPath,
  attachmentMimeType,
  thumbnailUrl,
  thumbnailPath,
  timestamp,
  isSent = false,
  onImagePress,
  onMediaLoadError,
}: ChatBubbleProps) {
  const { colors } = useColors();
  const { width: screenWidth } = useWindowDimensions();

  const alignment = isSent ? 'self-end items-end' : 'self-start items-start';
  const bubbleColor = isSent ? 'bg-accent' : 'bg-surface-tertiary';
  const textColor = isSent ? 'text-white' : 'text-foreground';

  const hasAttachment = messageType !== 'text' && !!attachmentUrl;
  const isVideo = hasAttachment && messageType === 'video';
  const isVisualMedia = hasAttachment && (messageType === 'image' || messageType === 'gif');
  // Defensive: an attachment-type message with no URL (e.g. a signed URL that failed to resolve)
  // shouldn't silently render an empty bubble.
  const isBrokenAttachment = messageType !== 'text' && !attachmentUrl;

  // Emoji-only messages are rendered
  // with a larger font size and no bubble background.
  const isEmojiMessage =
    messageType === 'text' &&
    isEmojiOnly(message);

  const emojiCount = [...(message ?? '')].length;

  let fontSize = 46;

  if (emojiCount === 2) fontSize = 40;
  if (emojiCount >= 3) fontSize = 34;

  return (
    <View className={`max-w-[80%] mb-4 ${alignment}`}>
      {isVideo ? (
        <VideoBubble
          uri={attachmentUrl!}
          thumbnailUrl={thumbnailUrl}
          thumbnailPath={thumbnailPath}
          onMediaLoadError={onMediaLoadError}
        />
      ) : isVisualMedia ? (
        <VisualMediaBubble
          uri={attachmentUrl!}
          attachmentPath={attachmentPath}
          onImagePress={onImagePress}
          onMediaLoadError={onMediaLoadError}
          screenWidth={screenWidth}
          colors={colors}
        />
      ) : isBrokenAttachment ? (
        <View
          style={{
            width: ATTACHMENT_MAX_WIDTH,
            height: ATTACHMENT_MAX_HEIGHT,
            borderRadius: ATTACHMENT_BORDER_RADIUS,
          }}
          className="bg-surface-tertiary items-center justify-center"
        >
          <Text className="text-gray-400 text-xs font-inter">
            Media unavailable
          </Text>
        </View>
      ) : (
        isEmojiMessage ? (
          <Text style={{ fontSize }}>
            {message}
          </Text>
        ) : (
          <View className={`px-3 py-2 rounded-3xl ${bubbleColor}`}>
            <Text className={`text-sm font-inter leading-6 ${textColor}`}>
              {message}
            </Text>
          </View>
        )
      )}

      <Text className="text-gray-300 text-xs font-inter mt-1">
        {timestamp}
      </Text>
    </View>
  );
}

// ─── Image / GIF attachment ───────────────────────────────────────────────────
// Uses onLoad to capture natural dimensions and scales to fit within the
// bubble while preserving aspect ratio. Animated GIFs play automatically
// via expo-image's default autoplay.

function VisualMediaBubble({
  uri,
  attachmentPath,
  onImagePress,
  onMediaLoadError,
  screenWidth,
  colors,
}: {
  uri: string;
  attachmentPath?: string | null;
  onImagePress?: (uri: string) => void;
  onMediaLoadError?: (mediaKind: 'attachment') => void;
  screenWidth: number;
  colors: Record<string, string>;
}) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  const maxBubbleWidth = Math.min(ATTACHMENT_MAX_WIDTH, screenWidth * 0.8);

  const handleLoad = useCallback((event: ImageLoadEventData) => {
    const { width, height } = event.source;
    setDimensions(calculateImageSize(width, height, maxBubbleWidth, ATTACHMENT_MAX_HEIGHT));
  }, [maxBubbleWidth]);

  const displaySize = dimensions ?? { width: maxBubbleWidth, height: ATTACHMENT_MAX_HEIGHT };

  return (
    <Pressable
      onPress={() => onImagePress?.(uri)}
    >
      <Image
        source={{
          uri,
          cacheKey: attachmentPath ?? undefined
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
    </Pressable>
  );
}

// ─── Video attachment ─────────────────────────────────────────────────────────
// The native video player is only created when the user taps to play — mounting
// a player per bubble in a long FlatList would be wasteful and would fight the
// list's recycling. VideoPlayerModal is only mounted while isPlaying is true, so
// the player resource is released automatically as soon as it unmounts.

function VideoBubble({
  uri,
  thumbnailUrl,
  thumbnailPath,
  onMediaLoadError,
}: {
  uri: string;
  thumbnailUrl?: string | null;
  thumbnailPath?: string | null;
  onMediaLoadError?: (mediaKind: 'attachment' | 'thumbnail') => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  const handleLoad = useCallback((event: ImageLoadEventData) => {
    const { width, height } = event.source;
    setDimensions(calculateImageSize(width, height, ATTACHMENT_MAX_WIDTH, ATTACHMENT_MAX_HEIGHT));
  }, []);

  const displaySize = dimensions ?? { width: ATTACHMENT_MAX_WIDTH, height: ATTACHMENT_MAX_HEIGHT };

  return (
    <>
      <Pressable
        onPress={() => setIsPlaying(true)}
        accessibilityRole="button"
        accessibilityLabel="Play video"
        style={[
          displaySize,
          { borderRadius: ATTACHMENT_BORDER_RADIUS },
        ]}
        className="overflow-hidden bg-black border border-border"
      >
        {thumbnailUrl && (
          <Image
            source={{
              uri: thumbnailUrl,
              cacheKey: thumbnailPath ?? undefined
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
