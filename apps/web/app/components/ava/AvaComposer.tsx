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

// One rounded row: the message field grows with the text and the round send
// button sits at the bottom right. Enter sends, Shift+Enter adds a line. The
// send button only lights up with something to send.
export default function AvaComposer({ value, onChange, onSend, isDisabled }: AvaComposerProps) {
  const canSend = value.trim().length > 0 && !isDisabled;

  return (
    <div className="flex items-end gap-2 rounded-3xl border border-gray-300 bg-card py-1.5 pl-4 pr-1.5 shadow-sm transition-all focus-within:border-[#376BF5] focus-within:ring-2 focus-within:ring-[#376BF5]/15">
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
        className="max-h-40 min-h-9 flex-1 resize-none rounded-none border-0 bg-transparent p-0 py-1.5 text-sm leading-6 shadow-none outline-none focus:ring-0"
      />
      <Button
        isIconOnly
        size="sm"
        onPress={onSend}
        isDisabled={!canSend}
        aria-label="Send message"
        className={`size-9 shrink-0 cursor-pointer rounded-full ${
          canSend ? "bg-primary text-white" : "bg-primary/40 text-white"
        }`}
      >
        <IconArrowUp size={18} aria-hidden />
      </Button>
    </div>
  );
}
