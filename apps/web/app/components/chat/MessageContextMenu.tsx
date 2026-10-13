"use client";

import { Reply, Copy } from "lucide-react";

import ReactionStrip from "./ReactionStrip";

export interface MessageContextMenuData {
  /** The current user's reaction, if any. */
  myReaction?: string;
  /** Human-readable timestamp shown in the menu header. */
  dateLabel: string;
  /** Reactions require a persisted row — temp/optimistic messages can't react. */
  canReact: boolean;
  /** Only text messages can be copied. */
  canCopy: boolean;
}

interface MessageContextMenuProps {
  data: MessageContextMenuData;
  position: { x: number; y: number };
  onSelectReaction: (emoji: string) => void;
  onOpenFullPicker: () => void;
  onReply: () => void;
  onCopy: () => void;
  onClose: () => void;
}

/**
 * Contextual action card: quick reactions, timestamp, Reply and Copy.
 * Opened by right-click (desktop) or long-press (touch). Mirrors the mobile
 * HoldMenu minus Unsend, which is intentionally not offered here.
 *
 * The card is positioned with a viewport-aware flip so it never renders
 * off-screen near the right/bottom edges.
 */
export default function MessageContextMenu({
  data,
  position,
  onSelectReaction,
  onOpenFullPicker,
  onReply,
  onCopy,
  onClose,
}: MessageContextMenuProps) {
  const CARD_WIDTH = 224;
  const CARD_ESTIMATED_HEIGHT = data.canReact ? 208 : 128;

  // Flip toward the viewport interior when the click lands near an edge.
  const left = Math.max(
    8,
    Math.min(position.x, window.innerWidth - CARD_WIDTH - 8)
  );
  const flipY = position.y + CARD_ESTIMATED_HEIGHT > window.innerHeight - 8;
  const top = flipY
    ? Math.max(8, position.y - CARD_ESTIMATED_HEIGHT)
    : position.y;

  return (
    <>
      {/* Dismiss layer — a separate element so clicks inside the card don't close it. */}
      <div
        className="fixed inset-0 z-50"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
        aria-hidden="true"
      />

      <div
        role="menu"
        aria-label="Message actions"
        className="fixed z-50 min-w-56 rounded-[20px] border border-border bg-card p-2 shadow-lg"
        style={{ left, top }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {data.canReact && (
          <>
            <div className="px-1">
              <ReactionStrip
                bare
                myReaction={data.myReaction}
                onSelect={onSelectReaction}
                onOpenFullPicker={onOpenFullPicker}
              />
            </div>
            <div className="mx-2 my-1 h-px bg-border opacity-75" />
          </>
        )}

        <p className="py-1.5 text-center text-[13px] text-muted-foreground">
          {data.dateLabel || "Just now"}
        </p>

        <button
          type="button"
          role="menuitem"
          onClick={onReply}
          aria-label="Reply to message"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Reply size={18} className="shrink-0 text-foreground" aria-hidden="true" />
          <span className="text-sm text-foreground">Reply</span>
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={data.canCopy ? onCopy : undefined}
          disabled={!data.canCopy}
          aria-label="Copy message"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-40"
        >
          <Copy size={18} className="shrink-0 text-foreground" aria-hidden="true" />
          <span className="text-sm text-foreground">Copy</span>
        </button>
      </div>
    </>
  );
}