"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { IconCheck, IconCopy } from "@tabler/icons-react";

const COPIED_RESET_MS = 2000;

export default function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch (error) {
      console.error("Could not copy to the clipboard", error);
      setCopied(false);
    }
  }

  return (
    <Button
      isIconOnly
      size="sm"
      variant="secondary"
      onPress={copy}
      aria-label={copied ? `${label} copied` : label}
      className="shrink-0 cursor-pointer"
    >
      {copied ? <IconCheck size={16} aria-hidden="true" /> : <IconCopy size={16} aria-hidden="true" />}
    </Button>
  );
}
