"use client";

import { useState, KeyboardEvent, useEffect, useRef } from "react";
import { Input, Button } from "@heroui/react";

interface MessageInputProps {
  onSend?: (message: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
}

export default function MessageInput({ onSend, onTypingChange }: MessageInputProps) {
  const [value, setValue] = useState<string>("");
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

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
    // Clear typing state immediately on send
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

  return (
    <div className="p-4 border-t border-gray-200 bg-white flex gap-2 items-center">
      <Input
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        fullWidth
        variant="faded"
        radius="full"
      />
      <Button
        color="primary"
        radius="full"
        className="px-8 font-medium"
        onPress={handleSend}
        isDisabled={!value.trim()}
      >
        Send
      </Button>
    </div>
  );
}