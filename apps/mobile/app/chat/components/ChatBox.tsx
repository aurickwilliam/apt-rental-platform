import { useRef, useState, useEffect } from 'react';
import { Keyboard, Pressable, ScrollView, TextInput as RNTextInput, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { EmojiKeyboard, type EmojiType } from 'rn-emoji-keyboard';
import { TextInputWrapper, type PasteEventPayload } from 'expo-paste-input';

import {
  IconSend,
  IconPlus,
  IconPhoto,
  IconGif,
  IconCamera,
  IconMoodSmile,
  IconKeyboard,
  IconX,
  IconPlayerPlayFilled,
} from '@tabler/icons-react-native';

import { Button, TextField, InputGroup, Menu } from 'heroui-native';

import { useColors } from '@/hooks/useTheme';
import type { PickedChatAsset, MessageType, Message } from '@/service/chat/chatService';

import {
  EMOJI_PANEL_HEIGHT,
  insertAtSelection,
  useEmojiPickerSettings,
  type TextSelection,
} from '@/utils/chat/emojiPicker';

/** A locally-picked attachment sitting in the review strip, not yet sent. */
export type StagedAsset = PickedChatAsset & { id: string; messageType: MessageType };

function getSnippet(msg: Message): string {
  if (msg.message) {
    const t = msg.message.trim();
    return t.length > 90 ? `${t.slice(0, 90)}…` : t;
  }
  switch (msg.messageType) {
    case 'image':
      return 'Photo';
    case 'video':
      return 'Video';
    case 'gif':
      return 'GIF';
    case 'file':
      return msg.attachmentName || 'Document';
    default:
      return '';
  }
}

interface ChatBoxProps {
  chatValue: string;
  onChatValueChange: (text: string) => void;
  isDisabled?: boolean;
  chatPlaceholder?: string;
  onSendPress?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onPickImage?: () => void;
  onPickGif?: () => void;
  onOpenCamera?: () => void;
  /** Images pasted with the keyboard's own Paste button, as local file URIs. */
  onPasteImages?: (uris: string[]) => void;
  pendingAssets?: StagedAsset[];
  onRemovePendingAsset?: (id: string) => void;
  replyTarget?: Message | null;
  onClearReply?: () => void;
  otherUserName?: string;
  /** The inline emoji panel; owned by the screen so a tap on the chat closes it. */
  isEmojiPickerOpen: boolean;
  onEmojiPickerOpenChange: (open: boolean) => void;
}

const ATTACHMENT_OPTIONS = [
  {
    key: 'image',
    label: 'Photo/Video',
    icon: IconPhoto,
    handlerKey: 'onPickImage'
  },
  {
    key: 'gif',
    label: 'GIF',
    icon: IconGif,
    handlerKey: 'onPickGif'
  },
  {
    key: 'camera',
    label: 'Camera',
    icon: IconCamera,
    handlerKey: 'onOpenCamera'
  },
] as const;

const THUMB_SIZE = 64;
// The "+" button (size-12) is the only thing that gives the input row its height;
// it unmounts once there is text, so the row and the paste wrapper keep this floor.
const INPUT_ROW_MIN_HEIGHT = 48;

export default function ChatBox({
  chatValue,
  onChatValueChange,
  isDisabled = false,
  chatPlaceholder = "Type a message...",
  onSendPress,
  onFocus,
  onBlur,
  onPickImage,
  onPickGif,
  onOpenCamera,
  onPasteImages,
  pendingAssets = [],
  onRemovePendingAsset,
  replyTarget = null,
  onClearReply,
  otherUserName,
  isEmojiPickerOpen,
  onEmojiPickerOpenChange,
}: ChatBoxProps) {
  const { colors } = useColors();

  const inputRef = useRef<RNTextInput>(null);

  const [isFocused, setIsFocused] = useState<boolean>(false);
  // Last cursor position in the input, so picked emoji land where the user was typing.
  const selectionRef = useRef<TextSelection | null>(null);
  // Latest text, updated straight away on each pick: quick taps land before
  // the parent re-renders with the new value.
  const valueRef = useRef(chatValue);
  useEffect(() => {
    valueRef.current = chatValue;
  }, [chatValue]);
  const emojiPickerSettings = useEmojiPickerSettings();

  useEffect(() => {
    if (replyTarget) {
      inputRef.current?.focus();
    }
  }, [replyTarget]);

  const borderColor = isFocused ? 'border-primary' : 'border-gray-300';
  const hasText = chatValue.trim().length > 0;
  const hasPending = pendingAssets.length > 0;
  const showSendButton = hasText || hasPending;

  const attachmentHandlers = {
    onPickImage,
    onPickGif,
    onOpenCamera
  };

  const handlePaste = (payload: PasteEventPayload) => {
    if (payload.type === 'images') onPasteImages?.(payload.uris);
  };

  const handleToggleEmojiPicker = () => {
    if (isEmojiPickerOpen) {
      onEmojiPickerOpenChange(false);
      inputRef.current?.focus();
      return;
    }
    Keyboard.dismiss();
    onEmojiPickerOpenChange(true);
  };

  const handleEmojiSelected = ({ emoji }: EmojiType) => {
    const { text, cursor } = insertAtSelection(valueRef.current, selectionRef.current, emoji);
    valueRef.current = text;
    selectionRef.current = { start: cursor, end: cursor };
    onChatValueChange(text);
    // Keep the caret after the emoji for when the keyboard comes back.
    requestAnimationFrame(() => inputRef.current?.setSelection(cursor, cursor));
  };

  return (
    <>
      {replyTarget && (
        <View className="mb-2 flex-row items-center bg-surface rounded-3xl px-3 py-2">
          {replyTarget.messageType !== 'text' && (
            <View className="size-8 rounded-lg bg-surface-tertiary items-center justify-center mr-2">
              {replyTarget.messageType === 'video' ? (
                <IconPlayerPlayFilled size={16} color={colors.gray500} />
              ) : replyTarget.messageType === 'gif' ? (
                <IconGif size={16} color={colors.gray500} />
              ) : (
                <IconPhoto size={16} color={colors.gray500} />
              )}
            </View>
          )}
          <View className="flex-1">
            <Text className="text-xs font-inter text-gray-500" numberOfLines={1}>
              Replying to {replyTarget.isSent ? 'yourself' : (otherUserName ?? 'them')}
            </Text>
            <Text className="text-sm font-inter text-muted" numberOfLines={2}>
              {getSnippet(replyTarget)}
            </Text>
          </View>
          <Pressable
            onPress={onClearReply}
            accessibilityRole="button"
            accessibilityLabel="Cancel reply"
            className="ml-2 p-1"
          >
            <IconX size={16} color={colors.textPrimary} />
          </Pressable>
        </View>
      )}

      {hasPending && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-2"
          contentContainerStyle={{ gap: 8 }}
        >
          {pendingAssets.map((asset) => (
            <View key={asset.id} style={{ width: THUMB_SIZE, height: THUMB_SIZE }}>
              <Image
                source={{ uri: asset.thumbnailUri ?? asset.localUri }}
                style={{
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  borderRadius: 12
                }}
                contentFit="cover"
                cachePolicy="disk"
              />

              {asset.messageType === 'video' && (
                <View
                  pointerEvents="none"
                  className="absolute inset-0 items-center justify-center bg-black/20"
                  style={{ borderRadius: 12 }}
                >
                  <View className="bg-black/50 rounded-full p-1.5">
                    <IconPlayerPlayFilled size={14} color="white" />
                  </View>
                </View>
              )}

              <Pressable
                onPress={() => onRemovePendingAsset?.(asset.id)}
                accessibilityRole="button"
                accessibilityLabel="Remove attachment"
                className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5"
              >
                <IconX size={14} color="white" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      <View className="flex-row items-center gap-2" style={{ minHeight: INPUT_ROW_MIN_HEIGHT }}>
        {!hasText && (
          <Menu>
            <Menu.Trigger asChild>
              <Button
                isDisabled={isDisabled}
                accessibilityLabel="Add attachment"
                className="bg-surface-tertiary rounded-full size-12 items-center justify-center"
              >
                <IconPlus size={24} color={colors.textPrimary} />
              </Button>
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Overlay />
              <Menu.Content presentation="popover" placement="top" align="start" width={200}>
                {ATTACHMENT_OPTIONS.map(({ key, label, icon: Icon, handlerKey }) => (
                  <Menu.Item key={key} onPress={attachmentHandlers[handlerKey]}>
                    <Icon size={18} color={colors.textPrimary} />
                    <Menu.ItemTitle>{label}</Menu.ItemTitle>
                  </Menu.Item>
                ))}
              </Menu.Content>
            </Menu.Portal>
          </Menu>
        )}

        {/* The keyboard's own Paste button (cursor menu) lands here: the wrapper
            intercepts image pastes natively, while text pastes insert as usual. */}
        <TextInputWrapper style={{ flex: 1, minHeight: INPUT_ROW_MIN_HEIGHT }} onPaste={handlePaste}>
          <TextField
            isDisabled={isDisabled}
            className="flex-1"
            onFocus={() => {
              setIsFocused(true);
              onEmojiPickerOpenChange(false);
              onFocus?.();
            }}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
          >
            <InputGroup className={`rounded-full ${borderColor}`}>
              <InputGroup.Prefix className="p-0 pl-2">
                <Button
                  isIconOnly
                  isDisabled={isDisabled}
                  onPress={handleToggleEmojiPicker}
                  accessibilityLabel={isEmojiPickerOpen
                    ? 'Show keyboard'
                    : 'Show emoji picker'
                  }
                  className="size-8 items-center justify-center"
                  variant='ghost'
                >
                  {isEmojiPickerOpen ? (
                    <IconKeyboard size={22} color={colors.gray500} />
                  ) : (
                    <IconMoodSmile size={22} color={colors.gray500} />
                  )}
                </Button>
              </InputGroup.Prefix>

              <InputGroup.Input
                ref={inputRef}
                value={chatValue}
                numberOfLines={1}
                onChangeText={onChatValueChange}
                onSelectionChange={(event) => {
                  selectionRef.current = event.nativeEvent.selection;
                }}
                placeholder={hasPending ? 'Add a caption...' : chatPlaceholder}
                className="rounded-full border"
              />

              {showSendButton && (
                <InputGroup.Suffix className="p-0">
                  <Button
                    isDisabled={isDisabled}
                    onPress={onSendPress}
                    className="bg-accent rounded-full mr-1.5 w-14 h-9 items-center justify-center"
                  >
                    <IconSend size={20} color={colors.secondaryForeground} />
                  </Button>
                </InputGroup.Suffix>
              )}
            </InputGroup>
          </TextField>
        </TextInputWrapper>
      </View>

      {/* Inline panel in the keyboard's place: the message stays visible and it
          stays open for several picks until the keyboard button or the input. */}
      {isEmojiPickerOpen && (
        <View style={{ height: EMOJI_PANEL_HEIGHT }}>
          <EmojiKeyboard
            {...emojiPickerSettings}
            onEmojiSelected={handleEmojiSelected}
            disableSafeArea
            styles={{ container: { borderRadius: 0, shadowOpacity: 0, elevation: 0 } }}
          />
        </View>
      )}
    </>
  );
}
