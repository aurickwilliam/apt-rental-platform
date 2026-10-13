"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Play, FileImage } from "lucide-react";

import type { ChatMessage } from "./types";
import ReactionStrip from "./ReactionStrip";
import { HEART_REACTION } from "./reactionEmojis";

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  currentUserId: string;
  otherUserName?: string;
  onToggleReaction: (messageId: string, emoji: string) => void | Promise<void>;
  onReply: (message: ChatMessage) => void;
  onOpenContextMenu: (position: { x: number; y: number }) => void;
  onOpenEmojiPicker: () => void;
}

/**
 * A single chat bubble with reply quoting, reaction badges and a hover /
 * long-press quick-reaction affordance. Mirrors the mobile `ChatBubble`
 * behaviour (quick strip on hold, double-tap to heart) on the web surface.
 */
export default function MessageBubble({
  message,
  isMine,
  currentUserId,
  otherUserName,
  onToggleReaction,
  onReply,
  onOpenContextMenu,
  onOpenEmojiPicker,
}: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const canInteract = !message.isPending && !message.id.startsWith("temp-");
  const myReaction = message.reactions.find((r) => r.is_mine)?.emoji;

  // Double-tap / double-click always hearts, matching mobile.
  const handleDoubleClick = () => {
    if (!canInteract) return;
    void onToggleReaction(message.id, HEART_REACTION);
  };

  const handleLongPress = () => {
    if (!canInteract) return;
    const rect = bubbleRef.current?.getBoundingClientRect();
    if (!rect) return;
    onOpenContextMenu({ x: rect.left + rect.width / 2, y: rect.top });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!canInteract) return;
    e.preventDefault();
    onOpenContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Press-and-hold for touch devices. Long-press opens the context menu at
  // the bubble's centre, matching mobile's long-press behaviour.
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPress = () => {
    pressTimer.current = setTimeout(() => {
      const el = bubbleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      onOpenContextMenu({ x: rect.left + rect.width / 2, y: rect.top });
    }, 500);
  };
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  useEffect(() => () => cancelPress(), []);

  const hasReply = message.replyDeleted || !!message.replyTo;
  const replierLabel = hasReply
    ? isMine
      ? "You replied"
      : `${otherUserName ?? "Someone"} replied`
    : null;

  return (
    <div
      className={`flex flex-col max-w-[80%] ${
        isMine ? "self-end items-end" : "self-start items-start"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {hasReply && (
        <p
          className={`mb-1 px-2 text-xs text-muted-foreground ${
            isMine ? "self-end text-right" : "self-start text-left"
          }`}
        >
          {replierLabel}
        </p>
      )}

      {message.replyDeleted ? (
        <div className="px-3 py-2 rounded-2xl bg-muted">
          <p className="text-xs italic text-muted-foreground">
            Original message unavailable
          </p>
        </div>
      ) : message.replyTo ? (
        <button
          type="button"
          onClick={() => canInteract && onReply(message)}
          className="mb-1 max-w-[260px] rounded-2xl bg-muted px-3 py-2 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {message.replyTo.messageType === "text" ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {message.replyTo.message}
            </p>
          ) : (
            <span className="flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card">
                {message.replyTo.messageType === "video" ? (
                  <Play size={14} className="text-muted-foreground" aria-hidden="true" />
                ) : (
                  <ImageIcon size={14} className="text-muted-foreground" aria-hidden="true" />
                )}
              </span>
              <span className="line-clamp-2 flex-1 text-sm text-muted-foreground">
                {message.replyTo.message || "Attachment"}
              </span>
            </span>
          )}
        </button>
      ) : null}

      {/* Quick reactions on hover (desktop parity with mobile hold). */}
      {isHovered && canInteract && (
        <div
          className="absolute z-20 -translate-y-full pb-1"
          style={{ [isMine ? "right" : "left"]: 0 }}
        >
          <ReactionStrip
            myReaction={myReaction}
            onSelect={(emoji) => void onToggleReaction(message.id, emoji)}
            onOpenFullPicker={onOpenEmojiPicker}
          />
        </div>
      )}

      <div
        ref={bubbleRef}
        role="button"
        tabIndex={0}
        onContextMenu={handleContextMenu}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchMove={cancelPress}
        onDoubleClick={handleDoubleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" && canInteract) {
            const rect = e.currentTarget.getBoundingClientRect();
            onOpenContextMenu({ x: rect.left + rect.width / 2, y: rect.top });
          }
        }}
        className={`relative rounded-2xl px-3 py-2 shadow-sm transition-colors ${
          isMine
            ? "bg-primary text-primary-foreground rounded-tr-none"
            : "bg-card text-foreground border border-border rounded-tl-none"
        } ${canInteract ? "cursor-pointer" : ""}`}
      >
        {message.message && <p className="text-sm break-words">{message.message}</p>}
        {!message.message && (
          <span className="flex items-center gap-2 text-sm">
            <FileImage size={16} aria-hidden="true" />
            Attachment
          </span>
        )}
      </div>

      {message.reactions.length > 0 && (
        <ReactionBadges
          messageId={message.id}
          reactions={message.reactions}
          onToggle={onToggleReaction}
        />
      )}

      <span className="mt-1 text-[10px] text-muted-foreground">
        {message.isPending ? "Sending…" : formatTime(message.created_at)}
      </span>
    </div>
  );
}

/** Aggregated reaction chips; clicking one toggles the current user's own. */
function ReactionBadges({
  messageId,
  reactions,
  onToggle,
}: {
  messageId: string;
  reactions: ChatMessage["reactions"];
  onToggle: (messageId: string, emoji: string) => void;
}) {
  // One chip per distinct emoji, with the total count.
  const byEmoji = new Map<string, number>();
  for (const r of reactions) {
    byEmoji.set(r.emoji, (byEmoji.get(r.emoji) ?? 0) + 1);
  }

  return (
    <div
      className="-mt-1.5 flex flex-wrap items-center gap-1 self-start"
      aria-label="Reactions"
    >
      {[...byEmoji.entries()].map(([emoji, count]) => {
        const mine = reactions.some((r) => r.is_mine && r.emoji === emoji);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggle(messageId, emoji)}
            className={`flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              mine
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:bg-muted"
            }`}
          >
            <span>{emoji}</span>
            <span className="text-[10px] text-muted-foreground">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}