"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Popover } from "@heroui/react";
import { IconCornerUpLeft, IconDots, IconMoodSmile, IconPaperclip, IconPhoto, IconPlayerPlay } from "@tabler/icons-react";

import { attachmentDisplayUrl, hasAttachment } from "./attachments";
import { formatChatAttachmentSize } from "@repo/utils";
import type { ChatMessage } from "./types";
import ReactionStrip from "./ReactionStrip";
import { HEART_REACTION } from "./reactionEmojis";
import UserAvatar from "@/app/components/profile/UserAvatar";
import { emojiMessageFontSize, isEmojiOnlyMessage } from "@/lib/chat-message-presentation";

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  otherUserName?: string;
  otherUserAvatar?: string | null;
  /**
   * Where this bubble sits in a run of consecutive messages from the same
   * sender. Tightens the gap between them and is what makes a multi-file
   * attachment batch read as one group instead of a stack.
   */
  groupPosition?: "single" | "first" | "middle" | "last";
  /** Selected once by the view, across the entire loaded conversation. */
  isLatestOutgoing?: boolean;
  /** The parent owns the portaled context menu; keep only its message active. */
  isContextMenuOpen?: boolean;
  onToggleReaction: (messageId: string, emoji: string) => void | Promise<void>;
  onReply: (message: ChatMessage) => void;
  onJumpToOriginal: (messageId: string) => void;
  isReplyHighlighted?: boolean;
  onOpenContextMenu: (position: { x: number; y: number }) => void;
}

/**
 * A single chat bubble with reply quoting, reaction badges and a hover /
 * long-press quick-reaction affordance. Mirrors the mobile `ChatBubble`
 * behaviour (quick strip on hold, double-tap to heart) on the web surface.
 */
export default function MessageBubble({
  message,
  isMine,
  otherUserName,
  otherUserAvatar,
  groupPosition = "single",
  isLatestOutgoing = false,
  isContextMenuOpen = false,
  onToggleReaction,
  onReply,
  onJumpToOriginal,
  isReplyHighlighted = false,
  onOpenContextMenu,
}: MessageBubbleProps) {
  const [isReactionOpen, setIsReactionOpen] = useState(false);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const canInteract = !message.isPending && !message.id.startsWith("temp-");
  const myReaction = message.reactions.find((r) => r.is_mine)?.emoji;

  // Double-tap / double-click always hearts, matching mobile.
  const handleDoubleClick = () => {
    if (!canInteract) return;
    void onToggleReaction(message.id, HEART_REACTION);
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canInteract) return;
    e.preventDefault();
    e.currentTarget.focus({ preventScroll: true });
    onOpenContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Press-and-hold for touch devices. Long-press opens the context menu at
  // the bubble's centre, matching mobile's long-press behaviour.
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPress = () => {
    if (!canInteract) return;
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

  // A single send keeps the full gap; only the inside of a run tightens.
  const continuesPrevious = groupPosition === "middle" || groupPosition === "last";
  const endsRun = groupPosition === "single" || groupPosition === "last";
  const contactInitials = (otherUserName ?? "").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("");
  const seenLabel = otherUserName ? `Seen by ${otherUserName}` : "Seen by recipient";
  const showSeen = isMine && isLatestOutgoing && canInteract && message.is_read;
  const mediaUrl = attachmentDisplayUrl(message);
  const showsAttachment = hasAttachment(message);
  // Like mobile: a text message of only emoji renders large, with no bubble.
  const isEmojiMessage = !showsAttachment && message.message_type === "text" && isEmojiOnlyMessage(message.message);

  // Consecutive messages hug together; separate runs keep the full gap.
  const runSpacing = continuesPrevious ? "mt-1" : "mt-4 first:mt-0";

  const hasReply = message.replyDeleted || !!message.replyTo;
  const replierLabel = hasReply
    ? isMine
      ? "You replied"
      : `${otherUserName ?? "Someone"} replied`
    : null;

  return (
    <div
      className={`relative flex min-w-0 flex-col sm:max-w-[75%] lg:max-w-[65%] ${runSpacing} ${
        isMine ? "max-w-[calc(100%-3.25rem)] self-end items-end" : "ml-9 max-w-[calc(100%-5.5rem)] self-start items-start"
      }`}
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
          aria-label="Jump to original message"
          onClick={(event) => {
            event.stopPropagation();
            const selection = window.getSelection();
            if (event.detail > 0 && selection && !selection.isCollapsed && event.currentTarget.contains(selection.anchorNode)) return;
            const originalId = message.reply_to ?? message.replyTo?.id;
            if (originalId) onJumpToOriginal(originalId);
          }}
          onDoubleClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          className="mb-1 max-w-full cursor-pointer select-text rounded-2xl bg-muted px-3 py-2 text-left transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none sm:max-w-[260px]"
        >
          {message.replyTo.messageType === "text" ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {message.replyTo.message}
            </p>
          ) : (
            <span className="flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card">
                {message.replyTo.messageType === "video" ? (
                  <IconPlayerPlay size={14} className="text-muted-foreground" aria-hidden="true" />
                ) : message.replyTo.messageType === "image" ||
                  message.replyTo.messageType === "gif" ? (
                  <IconPhoto size={14} className="text-muted-foreground" aria-hidden="true" />
                ) : (
                  <IconPaperclip size={14} className="text-muted-foreground" aria-hidden="true" />
                )}
              </span>
              <span className="line-clamp-2 flex-1 text-sm text-muted-foreground">
                {message.replyTo.message || "Attachment"}
              </span>
            </span>
          )}
        </button>
      ) : null}

      <div className="flex min-w-0 max-w-full flex-col items-end" data-message-with-reactions>
      {/* This shrink-to-content boundary owns both the bubble and its actions.
          Its CSS hit area bridges the gap without changing the visible bubble. */}
      <div
        className="apt-message-interaction relative min-w-0 max-w-full"
        data-group-position={groupPosition}
        data-interactive={canInteract}
        data-overlay-open={isReactionOpen || isContextMenuOpen}
      >
      {!isMine && endsRun ? (
        <span data-message-sender-avatar aria-hidden="true" className="pointer-events-none absolute bottom-0 -left-9">
          <UserAvatar src={otherUserAvatar} initials={contactInitials} alt={otherUserName ?? "Sender"} size="sm" className="apt-message-sender-avatar" />
        </span>
      ) : null}
      {canInteract && <div className={`apt-message-actions ${isMine ? "self-end right-full mr-1" : "self-start left-full ml-1"}`} role="group" aria-label="Message actions">
        <Popover isOpen={isReactionOpen} onOpenChange={setIsReactionOpen}>
          <Button variant="ghost" isIconOnly size="sm" aria-label="React to message" className="apt-chat-action"><IconMoodSmile size={17} aria-hidden="true" /></Button>
          <Popover.Content placement={isMine ? "top end" : "top start"} offset={6} containerPadding={12} className="apt-reaction-popover">
            <Popover.Dialog aria-label="Choose a reaction">
              <ReactionStrip bare myReaction={myReaction} onSelect={(emoji) => { void onToggleReaction(message.id, emoji); setIsReactionOpen(false); }} />
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
        <Button variant="ghost" isIconOnly size="sm" aria-label="Reply to message" className="apt-chat-action" onPress={() => onReply(message)}><IconCornerUpLeft size={17} aria-hidden="true" /></Button>
        <Button variant="ghost" isIconOnly size="sm" aria-label="More message actions" className="apt-chat-action" onPress={() => {
          const rect = bubbleRef.current?.getBoundingClientRect();
          if (rect) onOpenContextMenu({ x: isMine ? rect.right : rect.left, y: rect.bottom });
        }}><IconDots size={17} aria-hidden="true" /></Button>
      </div>}

      <div
        ref={bubbleRef}
        role={showsAttachment ? undefined : "button"}
        tabIndex={canInteract ? 0 : undefined}
        aria-haspopup={canInteract ? "dialog" : undefined}
        onContextMenu={handleContextMenu}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchMove={cancelPress}
        onTouchCancel={cancelPress}
        onDoubleClick={handleDoubleClick}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if ((e.key === "Enter" || e.key === " " || (e.shiftKey && e.key === "F10")) && canInteract) {
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            onOpenContextMenu({ x: rect.left + rect.width / 2, y: rect.top });
          }
        }}
        data-group={groupPosition}
        data-mine={isMine}
        data-chat-message-id={message.id}
        data-reply-highlight={isReplyHighlighted}
        className={`apt-message-bubble relative rounded-3xl ${showsAttachment && !message.message ? "max-w-80 overflow-hidden p-0" : isEmojiMessage ? "p-0" : "px-3.5 py-2"} transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          isEmojiMessage
            ? "bg-transparent text-foreground"
            : isMine
              ? "bg-primary text-white"
              : "bg-muted/60 text-foreground"
        } ${canInteract ? "cursor-pointer" : ""}`}
      >
        {mediaUrl && showsAttachment ? (
          <AttachmentBody message={message} url={mediaUrl} />
        ) : null}
        {!mediaUrl && showsAttachment && <span className="flex items-center gap-2 text-sm"><IconPaperclip size={16} aria-hidden="true" />Attachment unavailable</span>}
        {message.message && (isEmojiMessage
          ? <p className="whitespace-pre-wrap leading-tight [overflow-wrap:anywhere]" style={{ fontSize: emojiMessageFontSize(message.message) }}>{message.message}</p>
          : <p className="whitespace-pre-wrap font-inter text-sm leading-6 [overflow-wrap:anywhere]">{message.message}</p>)}
        {!message.message && !showsAttachment && (
          <span className="flex items-center gap-2 text-sm">
            <IconPaperclip size={16} aria-hidden="true" />
            Attachment
          </span>
        )}
      </div>
      </div>

      {message.reactions.length > 0 && (
        <ReactionBadges
          messageId={message.id}
          reactions={message.reactions}
          onToggle={onToggleReaction}
        />
      )}
      </div>

      {/* Exact timestamps remain in the message actions menu. */}
      {/* Reserve the same 16px status lane before and after a receipt arrives.
          Run interiors retain their existing 4px spacing. Reactions stay above
          this lane, and the incoming avatar is anchored to the bubble itself. */}
      {isMine && (endsRun || message.isPending) ? (
        <div data-message-read-status className="mt-1 flex h-4 min-w-4 justify-end font-inter text-[11px] leading-4 text-muted-foreground">
          {message.isPending ? <span>Sending…</span> : showSeen ? (
            <span role="img" aria-label={seenLabel} title={seenLabel}>
              <span aria-hidden="true"><UserAvatar src={otherUserAvatar} initials={contactInitials} alt={otherUserName ?? "Recipient"} size="sm" className="apt-message-seen-avatar" /></span>
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Attachment content. Images and GIFs render inline; video gets real controls
 * because it can't autoplay usefully in a chat bubble. A caption sits above
 * the media when the message also carries text.
 */
function AttachmentBody({
  message,
  url,
}: {
  message: ChatMessage;
  url: string;
}) {
  const isVideo = message.message_type === "video";

  if (message.message_type === "file") {
    const name = message.attachment_name || "Shared document";
    return (
      <a
        href={message.isPending ? undefined : url}
        target="_blank"
        rel="noopener noreferrer"
        download={name}
        aria-label={`Open ${name}`}
        aria-disabled={message.isPending || undefined}
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
        className="flex min-w-0 max-w-80 items-center gap-3 rounded-2xl p-3.5 text-inherit focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-current"
      >
        <IconPaperclip size={24} className="shrink-0" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block truncate font-nunito text-sm font-semibold" title={name}>{name}</span>
          <span className="block text-xs">
            {message.attachment_mime_type === "application/pdf" ? "PDF" : "DOCX"}
            {message.attachment_size != null ? ` · ${formatChatAttachmentSize(message.attachment_size)}` : ""}
          </span>
        </span>
      </a>
    );
  }

  return (
    <span className="block">
      {/* A media-only message needs no padding, so the bubble hugs the media. */}
      <span
        className={`block overflow-hidden ${
          message.message ? "mb-1.5 rounded-xl" : "rounded-2xl"
        }`}
      >
        {isVideo ? (
          <video
            src={url}
            controls
            playsInline
            aria-label="Shared video"
            preload="metadata"
            // Captured first frame, so the poster matches mobile's rows
            // instead of depending on the browser painting frame zero.
            poster={message.resolvedThumbnailUrl ?? undefined}
            className="max-h-80 w-full max-w-80 bg-black object-contain"
          >
            <track kind="captions" />
          </video>
        ) : (
          // Signed URL with a 60-minute TTL. `next/image` would cache the
          // optimized copy past expiry and then re-fetch a dead URL, so this
          // follows the plain-`<img>` convention used for private storage.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={message.message || (message.message_type === "gif" ? "Shared GIF" : "Shared photo")}
            loading="lazy"
            className="max-h-80 w-auto max-w-[min(20rem,100%)] object-contain"
          />
        )}
      </span>
    </span>
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
      className="relative z-10 -mt-2 mx-1 flex max-w-full flex-wrap items-center justify-end gap-0.5 self-end"
      aria-label="Reactions"
    >
      {[...byEmoji.entries()].map(([emoji, count]) => {
        const mine = reactions.some((r) => r.is_mine && r.emoji === emoji);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggle(messageId, emoji)}
            aria-label={`${emoji}, ${count} ${count === 1 ? "reaction" : "reactions"}${mine ? ", including yours" : ""}`}
            aria-pressed={mine}
            className={`flex h-5 items-center justify-center gap-1 rounded-full border text-sm leading-none shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${count === 1 ? "w-5 shrink-0 p-0" : "min-w-5 px-0.5"} ${
              mine
                ? "border-card bg-secondary ring-1 ring-primary/30"
                : "border-border bg-card hover:bg-muted"
            }`}
          >
            <span>{emoji}</span>
            {count > 1 && <span className="pr-0.5 text-[10px] text-muted-foreground">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

