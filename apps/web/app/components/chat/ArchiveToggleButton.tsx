"use client";

import { IconArchive } from "@tabler/icons-react";

/** The archive icon beside the "Messages" title; opens the archived list. */
export default function ArchiveToggleButton({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={count > 0 ? `Archived chats (${count})` : "Archived chats"}
      className="relative flex size-10 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <IconArchive size={24} aria-hidden="true" />
    </button>
  );
}
