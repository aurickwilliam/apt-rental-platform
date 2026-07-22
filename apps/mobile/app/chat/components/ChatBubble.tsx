import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';

import { IconPlayerPlayFilled, IconX } from '@tabler/icons-react-native';

import type { MessageType } from '@/service/chatService';

import { useColors } from '@/hooks/useTheme';

import { isEmojiOnly } from '@/service/chatService';

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
}

const ATTACHMENT_SIZE = {
  width: 220,
  height: 220,
  borderRadius: 18,
  borderWidth: 1,
} as const;

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
}: ChatBubbleProps) {
  const { colors } = useColors();

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
        />
      ) : isVisualMedia ? (
        <Pressable
          onPress={() => onImagePress?.(attachmentUrl!)}
        >
          <Image
            source={{
              uri: attachmentUrl!,
              cacheKey: attachmentPath ?? undefined
            }}
            style={[ATTACHMENT_SIZE, { borderColor: colors.gray300 }]}
            cachePolicy="disk"
            contentFit="cover"
            transition={150}
          />
        </Pressable>
      ) : isBrokenAttachment ? (
        <View
          style={ATTACHMENT_SIZE}
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
          <View className={`px-3 py-2 rounded-full ${bubbleColor}`}>
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

// ─── Video attachment ─────────────────────────────────────────────────────────
// The native video player is only created when the user taps to play — mounting
// a player per bubble in a long FlatList would be wasteful and would fight the
// list's recycling. VideoPlayerModal is only mounted while isPlaying is true, so
// the player resource is released automatically as soon as it unmounts.

function VideoBubble({
  uri,
  thumbnailUrl,
  thumbnailPath,
}: {
  uri: string;
  thumbnailUrl?: string | null;
  thumbnailPath?: string | null;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setIsPlaying(true)}
        accessibilityRole="button"
        accessibilityLabel="Play video"
        style={ATTACHMENT_SIZE}
        className="overflow-hidden bg-black border border-border"
      >
        {thumbnailUrl && (
          <Image
            source={{
              uri: thumbnailUrl,
              cacheKey: thumbnailPath ?? undefined
            }}
            style={ATTACHMENT_SIZE}
            className="absolute inset-0"
            cachePolicy="disk"
            contentFit="cover"
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
          <VideoPlayerModal uri={uri} onClose={() => setIsPlaying(false)} />
        </Modal>
      )}
    </>
  );
}

function VideoPlayerModal({ uri, onClose }: { uri: string; onClose: () => void }) {
  const player = useVideoPlayer(uri, (p) => {
    p.play();
  });

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
