"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@heroui/react";

import { searchReactionEmojis } from "./reactionEmojis";

interface EmojiInsertPanelProps {
  /** Inserts the emoji at the caret in the composer draft. */
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

/**
 * Inline emoji panel anchored inside the composer, rather than a modal: the
 * point is to drop an emoji into the draft and keep typing, so it must not
 * steal focus or cover the input. Reuses the catalogue and search already in
 * `reactionEmojis.ts` — the reaction surface stays the quick set only.
 */
export default function EmojiInsertPanel({
  onSelect,
  onClose,
}: EmojiInsertPanelProps) {
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Click-away and Escape close the panel. It is an inline surface, not a
  // dialog, so no focus trap or backdrop is wanted here.
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  // With no query, show a flat recent-ish set rather than every group, so the
  // panel stays a fixed, predictable height.
  const filtered = searchReactionEmojis(query);

  return (
    <div
      ref={panelRef}
      className="mx-3 mb-3 rounded-2xl border border-border bg-card p-3 shadow-lg"
    >
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search emoji…"
        aria-label="Search emoji"
        className="mb-3 rounded-xl"
      />

      <div className="max-h-56 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No emoji found.
          </p>
        ) : (
          <div className="grid grid-cols-8 gap-1">
            {filtered.map((item) => (
              <button
                key={item.emoji}
                type="button"
                onClick={() => onSelect(item.emoji)}
                aria-label={`Insert ${item.emoji}`}
                className="rounded-lg p-1 text-2xl leading-8 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {item.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}