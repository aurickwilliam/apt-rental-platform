"use client";

import { IconCopy, IconCornerUpLeft } from "@tabler/icons-react";
import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

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
  onReply,
  onCopy,
  onClose,
}: MessageContextMenuProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const previousFocus = document.activeElement;
    const place = () => {
      const gap = 12;
      const { width, height } = card.getBoundingClientRect();
      card.style.left = `${Math.max(gap, Math.min(position.x, window.innerWidth - width - gap))}px`;
      card.style.top = `${Math.max(gap, Math.min(position.y, window.innerHeight - height - gap))}px`;
    };
    place();
    card.querySelector<HTMLButtonElement>("button")?.focus();
    const observer = new ResizeObserver(place);
    observer.observe(card);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [position.x, position.y]);

  return createPortal(
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
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label="Message actions"
        className="fixed z-50 w-64 max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card p-2 shadow-lg"
        style={{ left: 12, top: 12 }}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
          const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
          const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
          if (["Tab", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const backwards = event.shiftKey || event.key === "ArrowUp" || event.key === "ArrowLeft";
            const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (backwards ? -1 : 1) + buttons.length) % buttons.length;
            buttons[next]?.focus();
          }
        }}
      >
        {data.canReact && (
          <>
            <div className="px-1">
              <ReactionStrip
                bare
                myReaction={data.myReaction}
                onSelect={onSelectReaction}
              />
            </div>
            <div className="mx-2 my-1 h-px bg-border opacity-75" />
          </>
        )}

        <p className="border-b border-border px-2 py-2 font-inter text-[11px] text-muted-foreground">
          {data.dateLabel || "Just now"}
        </p>

        <button
          type="button"
          onClick={onReply}
          aria-label="Reply to message"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <IconCornerUpLeft size={18} className="shrink-0 text-foreground" aria-hidden="true" />
          <span className="text-sm text-foreground">Reply</span>
        </button>

        {data.canCopy && <button
          type="button"
          onClick={data.canCopy ? onCopy : undefined}
          disabled={!data.canCopy}
          aria-label="Copy message"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-40"
        >
          <IconCopy size={18} className="shrink-0 text-foreground" aria-hidden="true" />
          <span className="text-sm text-foreground">Copy</span>
        </button>}
      </div>
    </>, document.body
  );
}
