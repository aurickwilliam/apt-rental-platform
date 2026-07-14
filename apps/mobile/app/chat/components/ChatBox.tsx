import { View } from 'react-native';
import { useState } from 'react';

import { IconSend } from '@tabler/icons-react-native';

import { Button,TextField, InputGroup } from 'heroui-native';

import { useColors } from '@/hooks/useTheme';

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
  const { colors } = useColors();

  const [isFocused, setIsFocused] = useState<boolean>(false);

  const borderColor = isFocused ? 'border-primary' : 'border-gray-300';
  const hasValue = chatValue.trim().length > 0;

  return (
    <View className="flex-row items-center gap-3">
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
        <InputGroup className={`rounded-full ${borderColor}`}>
          <InputGroup.Input
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
  )
}