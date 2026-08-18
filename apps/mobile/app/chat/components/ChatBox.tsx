import { useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, TextInput as RNTextInput, View } from 'react-native';
import { Image } from 'expo-image';
import EmojiPicker, { type EmojiType } from 'rn-emoji-keyboard';

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
import type { PickedChatAsset, MessageType } from '@/service/chat/chatService';

/** A locally-picked attachment sitting in the review strip, not yet sent. */
export type StagedAsset = PickedChatAsset & { id: string; messageType: MessageType };

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
  pendingAssets?: StagedAsset[];
  onRemovePendingAsset?: (id: string) => void;
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
  pendingAssets = [],
  onRemovePendingAsset,
}: ChatBoxProps) {
  const { colors } = useColors();

  const inputRef = useRef<RNTextInput>(null);

  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState<boolean>(false);

  const borderColor = isFocused ? 'border-primary' : 'border-gray-300';
  const hasText = chatValue.trim().length > 0;
  const hasPending = pendingAssets.length > 0;
  const showSendButton = hasText || hasPending;

  const attachmentHandlers = {
    onPickImage,
    onPickGif,
    onOpenCamera
  };

  const handleToggleEmojiPicker = () => {
    if (isEmojiPickerOpen) {
      setIsEmojiPickerOpen(false);
      inputRef.current?.focus();
      return;
    }
    Keyboard.dismiss();
    setIsEmojiPickerOpen(true);
  };

  const handleEmojiSelected = ({ emoji }: EmojiType) => {
    onChatValueChange(chatValue + emoji);
  };

  return (
    <>
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

      <View className="flex-row items-center gap-2">
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

        <TextField
          isDisabled={isDisabled}
          className="flex-1"
          onFocus={() => {
            setIsFocused(true);
            setIsEmojiPickerOpen(false);
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
      </View>

      <EmojiPicker
        open={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        onEmojiSelected={handleEmojiSelected}
      />
    </>
  );
}
