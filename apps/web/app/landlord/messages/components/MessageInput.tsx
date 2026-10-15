"use client";

import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { Input, Button } from "@heroui/react";
import { IconX } from "@tabler/icons-react";

import type { ChatMessage } from "@/app/components/chat/types";

interface MessageInputProps {
  onSend?: (message: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  /** Message being replied to; renders a quote bar above the field. */
  replyTarget?: ChatMessage | null;
  /** Who the reply targets, e.g. "Charlie" or "your message". */
  replyLabel?: string;
  onClearReply?: () => void;
}

export default function MessageInput({
  onSend,
  onTypingChange,
  replyTarget,
  replyLabel,
  onClearReply,
}: MessageInputProps) {
  const [value, setValue] = useState<string>("");
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const setTyping = (typing: boolean) => {
    if (typing === isTypingRef.current) return;
    isTypingRef.current = typing;
    onTypingChange?.(typing);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);

    if (e.target.value.trim()) {
      setTyping(true);
      // Reset the stop-typing timer on every keystroke
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
    } else {
      setTyping(false);
    }
  };

  const handleSend = (): void => {
    if (!value.trim()) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTyping(false);
    onSend?.(value.trim());
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Ensure typing stops if the component unmounts mid-type
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Focus the composer when a reply is started, like mobile's reply flow.
  useEffect(() => {
    if (replyTarget) inputRef.current?.focus();
  }, [replyTarget]);

  return (
    <div className="border-t border-border bg-card">
      {replyTarget && (
        <div className="mx-3 mt-2 flex items-start gap-2 rounded-xl border-l-4 border-primary bg-muted/60 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-primary">
              Replying to {replyLabel ?? "message"}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {replyTarget.message || "Attachment"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearReply}
            aria-label="Cancel reply"
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <IconX size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="p-4 flex gap-2 items-center">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          fullWidth
          className="rounded-full"
        />
        <Button
          className="px-8 font-medium"
          onPress={handleSend}
          isDisabled={!value.trim()}
        >
          Send
        </Button>
      </div>
    </div>
  );
}