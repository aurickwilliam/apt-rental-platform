import { useRef, useState } from 'react';
import { Keyboard, TextInput as RNTextInput, View } from 'react-native';
import EmojiPicker, { type EmojiType } from 'rn-emoji-keyboard';

import {
  IconSend,
  IconPlus,
  IconPhoto,
  IconGif,
  IconCamera,
  IconMoodSmile,
  IconKeyboard,
} from '@tabler/icons-react-native';

import { Button, TextField, InputGroup, Menu } from 'heroui-native';

import { useColors } from '@/hooks/useTheme';

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
}

const ATTACHMENT_OPTIONS = [
  { key: 'image', label: 'Photo/Video', icon: IconPhoto, handlerKey: 'onPickImage' },
  { key: 'gif', label: 'GIF', icon: IconGif, handlerKey: 'onPickGif' },
  { key: 'camera', label: 'Camera', icon: IconCamera, handlerKey: 'onOpenCamera' },
] as const;

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
}: ChatBoxProps) {
  const { colors } = useColors();
  const inputRef = useRef<RNTextInput>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState<boolean>(false);
  const borderColor = isFocused ? 'border-primary' : 'border-gray-300';
  const hasValue = chatValue.trim().length > 0;

  const attachmentHandlers = { onPickImage, onPickGif, onOpenCamera };

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
      <View className="flex-row items-center gap-2">
        {!hasValue && (
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
                  <IconKeyboard size={22} color={colors.textPrimary} />
                ) : (
                  <IconMoodSmile size={22} color={colors.textPrimary} />
                )}
              </Button>
            </InputGroup.Prefix>

            <InputGroup.Input
              ref={inputRef}
              value={chatValue}
              numberOfLines={1}
              onChangeText={onChatValueChange}
              placeholder={chatPlaceholder}
              className="rounded-full border"
            />

            {hasValue && (
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
