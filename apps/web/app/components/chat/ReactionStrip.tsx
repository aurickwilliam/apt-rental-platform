"use client";

import { QUICK_REACTIONS } from "./reactionEmojis";

interface ReactionStripProps {
  /** The current user's reaction, if any (highlighted) */
  myReaction?: string;
  onSelect?: (emoji: string) => void;
  /** Renders inline without the floating pill surface (used in the context menu) */
  bare?: boolean;
}

/**
 * Quick-reaction row. This is the whole reaction surface — the quick set only,
 * no full catalogue — so the strip is intentionally the only entry point.
 * `bare` renders the same row without the floating pill styling, for inline use
 * inside the message context menu.
 */
export default function ReactionStrip({
  myReaction,
  onSelect,
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
    </div>
  );
}