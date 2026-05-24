import { View } from 'react-native'
import { useState } from 'react'

import { COLORS } from '@repo/constants';
import { IconArrowUp } from '@tabler/icons-react-native';

import { Button, Input, TextField } from 'heroui-native';

interface ChatBoxProps {
  chatValue: string;
  onChatValueChange: (text: string) => void;
  isDisabled?: boolean;
  chatPlaceholder?: string;
  onSendPress?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function ChatBox({
  chatValue,
  onChatValueChange,
  isDisabled = false,
  chatPlaceholder = "Type a message...",
  onSendPress,
  onFocus,
  onBlur,
}: ChatBoxProps) {

  const [isFocused, setIsFocused] = useState<boolean>(false);

  const borderColor = isFocused ? 'border-primary' : 'border-grey-300';

  return (
    <View className="px-5 flex-row items-center justify-between gap-3">
      <TextField
        isDisabled={isDisabled}
        className="flex-1"
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
      >
        <Input
          value={chatValue}
          numberOfLines={1}
          onChangeText={onChatValueChange}
          placeholder={chatPlaceholder}
          className={`rounded-full ${borderColor}`}
        />
      </TextField>

      <Button
        isIconOnly
        isDisabled={isDisabled}
        onPress={onSendPress}
        className="bg-secondary rounded-full"
      >
        <IconArrowUp size={26} color={COLORS.white} />
      </Button>
    </View>
  )
}