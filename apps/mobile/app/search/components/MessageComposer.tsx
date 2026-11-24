import type { Ref } from "react";
import { View, TextInput as RNTextInput } from "react-native";
import { IconArrowUp } from "@tabler/icons-react-native";
import { Button } from "heroui-native";

import { useColors } from "@/hooks/useTheme";

const MAX_MESSAGE_LENGTH = 500;
const MAX_INPUT_HEIGHT = 120;
const BUTTON_SIZE = 36;

interface MessageComposerProps {
  inputRef: Ref<RNTextInput>;
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isDisabled: boolean;
}

// One rounded row: the message field grows with the text and the round send
// button stays at the bottom right, lit only when there is something to send.
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
    <View className="px-4 pt-1 pb-3 bg-background">
      <View className="flex-row items-end gap-2 rounded-3xl border border-border bg-surface py-1.5 pl-4 pr-1.5">
        <RNTextInput
          ref={inputRef}
          className="flex-1 text-base font-inter text-foreground"
          // Explicit padding and line height: iOS adds its own inset to a multiline
          // field, which made the row taller than the button and pushed it off centre.
          style={{
            minHeight: BUTTON_SIZE,
            maxHeight: MAX_INPUT_HEIGHT,
            paddingTop: 8,
            paddingBottom: 8,
            lineHeight: 20,
          }}
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

        {/* Not `isDisabled`: its extra fade made the idle button vanish into the field. */}
        <Button
          onPress={canSend ? onSend : undefined}
          isIconOnly
          className={`size-9 rounded-full bg-accent ${canSend ? "" : "opacity-40"}`}
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !canSend }}
        >
          <IconArrowUp size={20} color={colors.secondaryForeground} />
        </Button>
      </View>
    </View>
  );
}
