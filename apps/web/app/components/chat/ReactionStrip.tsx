"use client";

import { QUICK_REACTIONS } from "./reactionEmojis";

interface ReactionStripProps {
  /** The current user's reaction, if any (tinted) */
  myReaction?: string;
  onSelect?: (emoji: string) => void;
}

/**
 * Quick-reaction row, mirroring mobile's ReactionStrip: icon-only 40px round
 * buttons with 24px emoji, the current reaction tinted. The preset set only —
 * there is no custom picker. The floating pill surface (border, shadow,
 * padding) comes from the `apt-reaction-popover` popover that hosts it.
 */
export default function ReactionStrip({ myReaction, onSelect }: ReactionStripProps) {
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Quick reactions">
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect?.(emoji)}
          aria-label={`React with ${emoji}`}
          aria-pressed={myReaction === emoji}
          className={`flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            myReaction === emoji ? "bg-primary/15" : ""
          }`}
        >
          <span className="text-2xl leading-8">{emoji}</span>
        </button>
      ))}
    </div>
  );
}
