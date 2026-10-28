"use client";

import { Button, TextArea } from "@heroui/react";
import { IconArrowUp } from "@tabler/icons-react";

const MAX_MESSAGE_LENGTH = 500;

interface AvaComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isDisabled: boolean;
}

// A roomy rounded field that grows with the message. Enter sends, Shift+Enter
// adds a line. The round send button only lights up with something to send.
export default function AvaComposer({ value, onChange, onSend, isDisabled }: AvaComposerProps) {
  const canSend = value.trim().length > 0 && !isDisabled;

  return (
    <div className="flex items-end gap-2 rounded-3xl border border-gray-300 bg-card px-2 py-2 transition-all focus-within:border-[#376BF5] focus-within:ring-2 focus-within:ring-[#376BF5]/15">
      <TextArea
        aria-label="Message Ava"
        placeholder="Ask Ava about rentals..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            if (canSend) onSend();
          }
        }}
        rows={1}
        maxLength={MAX_MESSAGE_LENGTH}
        className="max-h-32 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none outline-none focus:ring-0"
      />
      <Button
        isIconOnly
        size="sm"
        onPress={onSend}
        isDisabled={!canSend}
        aria-label="Send message"
        className={`size-9 shrink-0 cursor-pointer rounded-full ${
          canSend ? "bg-primary text-white" : "bg-muted text-muted-foreground"
        }`}
      >
        <IconArrowUp size={18} aria-hidden />
      </Button>
    </div>
  );
}
