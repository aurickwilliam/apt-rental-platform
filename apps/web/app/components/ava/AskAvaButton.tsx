"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@heroui/react";
import { IconSparkles } from "@tabler/icons-react";

// The chat panel loads only when a tenant first opens it.
const AvaChatDrawer = dynamic(() => import("./AvaChatDrawer"));

interface AskAvaButtonProps {
  /** Browse base path for listing links and "See all results". */
  basePath: string;
}

/** Search-row entry for Ava, the APT Virtual Assistant (signed-in tenants). */
export default function AskAvaButton({ basePath }: AskAvaButtonProps) {
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
        variant="tertiary"
        size="lg"
        onPress={open}
        aria-label="Ask Ava, the APT Virtual Assistant"
        className="shrink-0 cursor-pointer text-primary"
      >
        <IconSparkles size={18} aria-hidden />
      </Button>

      {/* Kept mounted after the first open so the conversation survives closing. */}
      {hasOpened && <AvaChatDrawer isOpen={isOpen} onOpenChange={setIsOpen} basePath={basePath} />}
    </>
  );
}
