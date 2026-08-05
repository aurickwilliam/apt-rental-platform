import type { Ref } from "react";
import { View, TextInput as RNTextInput } from "react-native";
import { IconSend } from "@tabler/icons-react-native";
import { Button, InputGroup, TextField } from "heroui-native";

import { useColors } from "@/hooks/useTheme";

interface MessageComposerProps {
  inputRef: Ref<RNTextInput>;
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isDisabled: boolean;
}

export default function MessageComposer({
  inputRef,
  value,
  onChangeText,
  onSend,
  isDisabled,
}: MessageComposerProps) {
  const { colors } = useColors();

  return (
    <View className="px-3 py-2 border-t border-border">
      <TextField>
        <InputGroup className="rounded-full">
          <InputGroup.Input
            ref={inputRef}
            className="rounded-full border"
            placeholder="Ask me anything about rentals..."
            placeholderTextColor={colors.gray400}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSend}
            returnKeyType="send"
            maxLength={500}
          />

          {value.trim().length > 0 && (
            <InputGroup.Suffix className="p-0">
              <Button
                onPress={onSend}
                isDisabled={isDisabled}
                className="bg-accent rounded-full mr-1.5 w-14 h-9 items-center justify-center"
                accessibilityLabel="Send message"
              >
                <IconSend size={20} color={colors.secondaryForeground} />
              </Button>
            </InputGroup.Suffix>
          )}
        </InputGroup>
      </TextField>
    </View>
  );
}