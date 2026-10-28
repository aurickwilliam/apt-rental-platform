import type { Ref } from "react";
import { View, TextInput as RNTextInput } from "react-native";
import { IconArrowUp } from "@tabler/icons-react-native";
import { Button, InputGroup, TextField } from "heroui-native";

import { useColors } from "@/hooks/useTheme";

const MAX_MESSAGE_LENGTH = 500;
const MAX_INPUT_HEIGHT = 120;

interface MessageComposerProps {
  inputRef: Ref<RNTextInput>;
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isDisabled: boolean;
}

// A roomy rounded field that grows with the message, with a round send
// button that only lights up when there is something to send.
export default function MessageComposer({
  inputRef,
  value,
  onChangeText,
  onSend,
  isDisabled,
}: MessageComposerProps) {
  const { colors } = useColors();
  const canSend = value.trim().length > 0 && !isDisabled;

  return (
    <View className="px-4 pt-1 pb-2 bg-background">
      <TextField>
        <InputGroup className="rounded-3xl bg-surface">
          <InputGroup.Input
            ref={inputRef}
            className="rounded-3xl border bg-surface pl-4 py-3 text-base"
            style={{ maxHeight: MAX_INPUT_HEIGHT }}
            placeholder="Ask Ava about rentals..."
            placeholderTextColor={colors.gray400}
            value={value}
            onChangeText={onChangeText}
            multiline
            submitBehavior="submit"
            onSubmitEditing={onSend}
            returnKeyType="send"
            maxLength={MAX_MESSAGE_LENGTH}
            accessibilityLabel="Message Ava"
          />

          <InputGroup.Suffix className="p-0 self-end pb-1.5">
            <Button
              onPress={onSend}
              isDisabled={!canSend}
              isIconOnly
              className={`mr-1.5 size-9 rounded-full ${canSend ? "bg-accent" : "bg-surface-tertiary"}`}
              accessibilityLabel="Send message"
            >
              <IconArrowUp
                size={20}
                color={canSend ? colors.secondaryForeground : colors.gray400}
              />
            </Button>
          </InputGroup.Suffix>
        </InputGroup>
      </TextField>
    </View>
  );
}
