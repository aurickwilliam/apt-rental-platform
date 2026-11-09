"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Button } from "@heroui/react";

// The chat panel loads only when a tenant first opens it.
const AvaChatDrawer = dynamic(() => import("./AvaChatDrawer"));

interface AskAvaButtonProps {
  /** Browse base path for listing links and "See all results". */
  basePath: string;
  /** The search bar embeds the entry as a quiet ghost button. */
  variant?: "tertiary" | "ghost";
  size?: "md" | "lg";
}

/** Search-row entry for Ava, the APT Virtual Assistant (signed-in tenants). */
export default function AskAvaButton({ basePath, variant = "tertiary", size = "lg" }: AskAvaButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const open = () => {
    setHasOpened(true);
    setIsOpen(true);
  };

  return (
    <>
      <Button
        isIconOnly
        variant={variant}
        size={size}
        onPress={open}
        aria-label="Ask Ava, the APT Virtual Assistant"
        className="shrink-0 cursor-pointer"
      >
        <Image src="/images/ava-icon.png" alt="" width={26} height={26} className="size-[26px]" />
      </Button>

      {/* Kept mounted after the first open so the conversation survives closing. */}
      {hasOpened && <AvaChatDrawer isOpen={isOpen} onOpenChange={setIsOpen} basePath={basePath} />}
    </>
  );
}
