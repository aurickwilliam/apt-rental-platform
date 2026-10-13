"use client";

import { Plus } from "lucide-react";

import { QUICK_REACTIONS } from "./reactionEmojis";

interface ReactionStripProps {
  /** The current user's reaction, if any (highlighted) */
  myReaction?: string;
  onSelect?: (emoji: string) => void;
  /** Open the full emoji picker */
  onOpenFullPicker?: () => void;
  /** Renders inline without the floating pill surface (used in the context menu) */
  bare?: boolean;
}

/**
 * Quick-reaction row. `bare` renders the same row without the floating pill
 * styling, for inline use inside the message context menu.
 */
export default function ReactionStrip({
  myReaction,
  onSelect,
  onOpenFullPicker,
  bare = false,
}: ReactionStripProps) {
  if (bare) {
    return (
      <div className="flex items-center justify-between gap-0.5">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect?.(emoji)}
            aria-label={`React with ${emoji}`}
            className={`rounded-full p-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              myReaction === emoji ? "bg-accent/15" : ""
            }`}
          >
            <span className="text-base leading-6">{emoji}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={onOpenFullPicker}
          aria-label="More reactions"
          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-card px-2 py-1 shadow-md">
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect?.(emoji)}
          aria-label={`React with ${emoji}`}
          className={`rounded-full p-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            myReaction === emoji ? "bg-accent/15" : ""
          }`}
        >
          <span className="text-xl leading-7">{emoji}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onOpenFullPicker}
        aria-label="More reactions"
        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Plus size={18} aria-hidden="true" />
      </button>
    </div>
  );
}