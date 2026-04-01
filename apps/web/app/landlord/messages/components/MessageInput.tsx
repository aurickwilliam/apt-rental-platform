"use client";

import { useState, KeyboardEvent } from "react";
import { Input, Button } from "@heroui/react";

interface MessageInputProps {
  onSend?: (message: string) => void;
}

export default function MessageInput({ onSend }: MessageInputProps) {
  const [value, setValue] = useState<string>("");

  const handleSend = (): void => {
    if (!value.trim()) return;
    onSend?.(value.trim());
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 bg-white flex gap-2 items-center">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
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