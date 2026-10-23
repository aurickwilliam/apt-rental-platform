"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Button, ScrollShadow } from "@heroui/react";
import {
  IconArrowDown,
  IconMessage,
} from "@tabler/icons-react";

import ErrorBanner from "@/app/components/display/ErrorBanner";
import MessageInput from "./MessageInput";
import { Contact } from "./types";
import ConversationHeader from "@/app/components/chat/ConversationHeader";
import ConversationThreadSkeleton from "@/app/components/chat/ConversationThreadSkeleton";
import ConversationApartmentRow from "@/app/components/chat/ConversationApartmentRow";
import ConversationIntroduction from "@/app/components/chat/ConversationIntroduction";
import { useConversationContext } from "@/hooks/use-conversation-context";
import { conversationApartmentPresentation } from "@/lib/conversation-context";
import MessageContextMenu from "@/app/components/chat/MessageContextMenu";
import RemovePhotoConfirmModal from "@/app/components/profile/RemovePhotoConfirmModal";
import { canUnsendMessage } from "@/app/components/chat/unsend";
import { canCopyImageMessage, copyChatImage } from "@/app/components/chat/copyImage";
import MessageBubble from "@/app/components/chat/MessageBubble";
import useConversation from "@/app/components/chat/useConversation";
import useConversationRealtime from "@/app/components/chat/useConversationRealtime";
import useReplyNavigation from "@/app/components/chat/useReplyNavigation";
import type { ChatMessage } from "@/app/components/chat/types";
import { formatMessageMenuDate, latestOutgoingMessageId } from "@/lib/chat-message-presentation";

interface ConversationViewProps {
  activeContact: Contact | null;
  currentUserId: string;
  onConversationRead?: (contactId: string) => void;
  apartmentId?: string | null;
  /** Shows the back-to-contacts control in the header (mobile only). */
  onBack?: () => void;
  /** Layout overrides, used for the mobile master-detail swap. */
  className?: string;
}

/**
 * How close to the newest message the reader must be for the thread to
 * keep auto-scrolling. Mirrors mobile's 150px proximity rule so both
 * platforms behave the same way.
 */
const BOTTOM_FOLLOW_THRESHOLD_PX = 150;

/**
 * Runs consecutive messages from the same sender into a group, so a
 * multi-file attachment batch (one shared `group_id`) reads as one visual
 * cluster instead of a stack of unrelated bubbles. Realtime inserts can split
 * a run, so a gap in time also breaks it — otherwise a message sent minutes
 * later would be pulled into the previous group.
 */
const RUN_GAP_MS = 5 * 60 * 1000;

function getGroupPosition(
  messages: ChatMessage[],
  index: number
): "single" | "first" | "middle" | "last" {
  const current = messages[index];
  if (!current) return "single";

  const previous = messages[index - 1];
  const next = messages[index + 1];

  const continuesRun = (other: ChatMessage | undefined) =>
    Boolean(
      other &&
        other.sender_id === current.sender_id &&
        // A pending row and a just-inserted row can straddle the boundary.
        Math.abs(
          new Date(other.created_at).getTime() -
            new Date(current.created_at).getTime()
        ) <= RUN_GAP_MS
    );

  const joinsPrevious = continuesRun(previous);
  const joinsNext = continuesRun(next);

  if (joinsPrevious && joinsNext) return "middle";
  if (joinsPrevious) return "last";
  if (joinsNext) return "first";
  return "single";
}

function TypingIndicator() {
  return (
    <div role="status" aria-label="Typing" className="mt-4 self-start flex items-center gap-1 bg-muted/60 px-4 py-3 rounded-2xl w-fit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function ConversationView({
  activeContact,
  currentUserId,
  onConversationRead,
  apartmentId,
  onBack,
  className = "",
}: ConversationViewProps) {
  const [sendError, setSendError] = useState<{ key: string; message: string } | null>(null);
  const [unsendTargetId, setUnsendTargetId] = useState<string | null>(null);
  const { context, loading: contextLoading } = useConversationContext(activeContact?.id ?? null, activeContact?.apartmentId ?? null, "landlord", currentUserId);
  const apartment = conversationApartmentPresentation(activeContact?.apartmentId ?? null, context.apartment, "landlord");

  const {
    supabase,
    conversationId,
    messages,
    setMessages,
    isLoading: messagesLoading,
    replyTarget,
    contextMenu,
    hasEarlierMessages,
    isLoadingEarlier: isLoadingEarlierMessages,
    loadEarlierMessages,
    sendMessage,
    sendAttachments,
    sendGif,
    toggleReaction,
    unsendMessage,
    handleReply,
    clearReply,
    openContextMenu,
    closeContextMenu,
    refreshMessages,
  } = useConversation({
    currentUserId,
    otherUserId: activeContact?.id ?? null,
    apartmentId,
    onConversationRead,
    onSendError: (message) =>
      setSendError({ key: activeContact?.conversationKey ?? "", message }),
  });

  // Realtime: incoming messages, read receipts for sent ones, contact typing
  // presence, and a resync after reconnects/refocus. Shared with the tenant
  // view so both portals subscribe identically.
  const { isContactTyping, trackTyping } = useConversationRealtime({
    supabase,
    conversationId,
    currentUserId,
    contactId: activeContact?.id ?? null,
    conversationKey: activeContact?.conversationKey ?? null,
    apartmentId,
    setMessages,
    refreshMessages,
    onConversationRead,
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // True when the reader is within the threshold of the newest message. Drives
  // both the follow decision and the jump-to-latest button's visibility.
  const nearBottomRef = useRef(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(isLoadingEarlierMessages);
  const messageCount = messages.length;
  const latestOutgoingId = latestOutgoingMessageId(messages, currentUserId, activeContact?.id ?? null);
  const replyNavigation = useReplyNavigation({
    conversationKey: activeContact ? `${currentUserId}:${activeContact.conversationKey}` : null,
    scrollRef,
    hasEarlierMessages,
    loadEarlierMessages,
    pauseFollowing: () => { nearBottomRef.current = false; setIsNearBottom(false); },
  });


  // Mark incoming messages as read when this conversation is opened
  useEffect(() => {
    if (!activeContact) return;

    const markAsRead = async () => {
      let query = supabase
        .from("chat")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .select("id")
        .eq("sender_id", activeContact.id)
        .eq("receiver_id", currentUserId)
        .eq("is_read", false);

      if (apartmentId) {
        query = query.eq("apartment_id", apartmentId);
      }

      const { data, error } = await query;

      if (!error && (data?.length ?? 0) > 0) {
        onConversationRead?.(activeContact.conversationKey);
      }
    };

    void markAsRead();
  }, [activeContact, apartmentId, currentUserId, onConversationRead, supabase]);

  /**
   * Owns the "follow the bottom" flag. Sampled on scroll, and again
   * whenever the thread grows so the decision uses the position from
   * *before* the new message was appended.
   */
  // Not memoized by hand — `reactCompiler` is on and preserves this shape.
  const handleThreadScroll = () => {
    // Do not re-arm bottom-follow while pagination or smooth reply navigation
    // is moving the viewport, even if it started within the 150px threshold.
    if (replyNavigation.notice || replyNavigation.highlightedId) {
      nearBottomRef.current = false;
      return;
    }
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distanceFromBottom <= BOTTOM_FOLLOW_THRESHOLD_PX;
    nearBottomRef.current = near;
    // Only re-render when the boolean actually flips — a scroll handler firing
    // on every pixel would otherwise re-render the whole thread continuously.
    setIsNearBottom((prev) => (prev === near ? prev : near));
  };

  /** Returns the reader to the newest message and re-arms auto-follow. */
  const jumpToLatest = () => {
    nearBottomRef.current = true;
    setIsNearBottom(true);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /**
   * Prepends the previous page of history. The initial load is capped at the
   * newest {@link INITIAL_MESSAGE_LIMIT} rows, so without this the older
   * history would be unreachable. Scroll position is restored afterwards,
   * because prepending content above the viewport would otherwise fling the
   * reader to the bottom.
   */
  const handleLoadEarlier = async () => {
    if (isLoadingEarlier || !hasEarlierMessages || !scrollRef.current) return;
    const el = scrollRef.current;
    const previousHeight = el.scrollHeight;
    const previousTop = el.scrollTop;

    setIsLoadingEarlier(true);
    try {
      await loadEarlierMessages();
      // Restore the reading position relative to the content that was there
      // before, so newly prepended rows stay out of view.
      requestAnimationFrame(() => {
        el.scrollTop = previousTop + (el.scrollHeight - previousHeight);
      });
    } finally {
      setIsLoadingEarlier(false);
    }
  };

  // Re-sample before the new message lands, so the follow decision uses
  // the position the reader actually left behind.
  useEffect(() => {
    handleThreadScroll();
  });

  /**
   * Keeps the thread pinned to the newest message without hijacking the
   * scroll position of someone reading history.
   *
   * The previous version scrolled on every `messages` change, which meant a
   * reaction toggle — that also calls `setMessages` — yanked the reader back to
   * the bottom. The scroll now depends on the message *count*, so in-place
   * updates never move it, and it only follows when the reader is already near
   * the bottom. `nearBottomRef` is sampled during the height change, before the
   * new message has been laid out, so "was I at the bottom?" is answered
   * against the pre-update position.
   */
  useEffect(() => {
    if (messageCount === 0) {
      return;
    }
    if (!nearBottomRef.current) return;
    bottomRef.current?.scrollIntoView({
      behavior: isContactTyping ? "smooth" : "auto",
    });
  }, [messageCount, isContactTyping]);

  // Delegates to the hook, which owns the optimistic row, its rollback and the
  // realtime dedupe. Clearing the banner up front means a successful send
  // wipes any stale failure.
  const handleSend = useCallback(
    (content: string) => {
      if (!activeContact || !content.trim()) return;
      setSendError(null);
      void sendMessage(content, replyTarget?.id ?? null);
    },
    [activeContact, replyTarget, sendMessage]
  );

  const handleTypingChange = useCallback(
    async (isTyping: boolean) => {
      await trackTyping(isTyping);
    },
    [trackTyping]
  );

  const handleCopy = useCallback(async (text: string) => {
    closeContextMenu();
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }, [closeContextMenu]);

  // Empty State
  if (!activeContact) {
    return (
      <div
        className={`min-w-0 flex-1 flex-col items-center justify-center text-center px-8 py-16 bg-card ${className}`}
      >
        <div className="relative mb-8">
          <div className="w-18 h-18 rounded-full bg-primary/10 border border-border flex items-center justify-center">
            <IconMessage className="w-7 h-7 text-primary" />
          </div>
        </div>

        <p className="text-sm font-medium text-foreground mb-1.5">
          No conversation selected
        </p>
        <p className="text-xs text-muted-foreground max-w-60 leading-relaxed mb-8">
          Pick a thread from the sidebar to continue where you left off.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-card ${className}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header. `data-fab-dock` parks the floating notifications bell in the
          empty right end of this row on the messages route — pinned and never
          draggable, so it cannot cover the thread; `data-fab-clearance` still
          keeps it off this row on routes that offer no dock. */}
      <ConversationHeader contact={activeContact} onBack={onBack} />
      <ConversationApartmentRow apartment={apartment} hasApartmentId={Boolean(activeContact.apartmentId)} loading={contextLoading} />

      {/* Chat History */}
      {/* The jump control stays within the history pane, above the composer. */}
      <div className="relative flex min-h-0 flex-1 flex-col">
      <ScrollShadow
        ref={scrollRef}
        data-chat-scroll
        onScroll={handleThreadScroll}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-background/50 px-3 py-4"
        visibility="none"
      >
        {hasEarlierMessages && (
          <div className="flex justify-center pb-2">
            <Button
              variant="secondary"
              size="sm"
              onPress={() => void handleLoadEarlier()}
              isPending={isLoadingEarlier}
              isDisabled={replyNavigation.locating}
            >
              Load earlier messages
            </Button>
          </div>
        )}

        {messagesLoading ? (
          <ConversationThreadSkeleton />
        ) : (
          <div data-message-timeline className="flex w-full min-w-0 flex-col">
            {!hasEarlierMessages ? <ConversationIntroduction contact={activeContact} verified={context.verified} apartment={apartment} /> : null}
            {messages.length === 0 ? (
              <div className="flex-col items-center justify-center gap-2 py-4 text-center text-muted-foreground">
                <p className="text-sm font-medium text-foreground">No messages yet</p>
                <p className="text-xs text-default-500">
                  Say hi to start the conversation.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <Fragment key={msg.id}>
                {(index === 0 || new Date(messages[index - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString()) && (
                  <p className="my-5 text-center font-inter text-[11px] text-muted-foreground"><time dateTime={msg.created_at}>{new Date(msg.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</time></p>
                )}
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={msg.sender_id === currentUserId}
                  otherUserName={activeContact.name}
                  otherUserAvatar={activeContact.avatar}
                  groupPosition={getGroupPosition(messages, index)}
                  isContextMenuOpen={contextMenu?.message.id === msg.id}
                  isLatestOutgoing={msg.id === latestOutgoingId}
                  onToggleReaction={toggleReaction}
                  onReply={handleReply}
                  onJumpToOriginal={replyNavigation.jumpToOriginal}
                  isReplyHighlighted={replyNavigation.highlightedId === msg.id}
                  onOpenContextMenu={(position) => openContextMenu(msg, position)}
                />
                </Fragment>
              ))
            )}

            {isContactTyping && <TypingIndicator />}

            <div ref={bottomRef} className="h-1 shrink-0" />
          </div>
        )}
      </ScrollShadow>
      {replyNavigation.notice ? (
        <div className="absolute bottom-3 left-1/2 z-20 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
          <p role="status" aria-live="polite" className="min-w-0 flex-1 text-xs text-muted-foreground">{replyNavigation.notice}</p>
          <Button variant="ghost" size="sm" onPress={replyNavigation.dismiss}>{replyNavigation.locating ? "Cancel" : "Dismiss"}</Button>
        </div>
      ) : null}

      {/* Jump-to-latest. Only mounted when the reader has scrolled away from
          the newest message, which is exactly the state in which auto-scroll
          deliberately does not follow. */}
      {!isNearBottom && !replyNavigation.notice && (
        <button
          type="button"
          onClick={jumpToLatest}
          aria-label="Jump to latest messages"
          className="absolute bottom-4 left-1/2 z-20 flex size-10 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <IconArrowDown size={20} aria-hidden="true" />
        </button>
      )}
      </div>

      {sendError?.key === activeContact.conversationKey ? (
        <div className="px-4">
          <ErrorBanner message={sendError.message} />
        </div>
      ) : null}

      <MessageInput
        onSend={handleSend}
        onTypingChange={handleTypingChange}
        onSendAttachments={sendAttachments}
        onSendGif={sendGif}
        onError={(message) =>
          setSendError({ key: activeContact?.conversationKey ?? "", message })
        }
        replyTarget={replyTarget}
        replyLabel={
          replyTarget
            ? replyTarget.sender_id === currentUserId
              ? "your message"
              : activeContact.name
            : undefined
        }
        onClearReply={clearReply}
      />

      {contextMenu && (
        <MessageContextMenu
          data={{
            dateLabel: formatMessageMenuDate(contextMenu.message.created_at),
            canCopy: (contextMenu.message.message_type ?? "text") === "text" && !!contextMenu.message.message,
            canCopyImage: canCopyImageMessage(contextMenu.message),
            canUnsend: canUnsendMessage(contextMenu.message, currentUserId),
          }}
          position={contextMenu.position}
          onReply={() => {
            handleReply(contextMenu.message);
            closeContextMenu();
          }}
          onCopy={() => {
            if (contextMenu.message.message) {
              void handleCopy(contextMenu.message.message);
            }
          }}
          onCopyImage={() => {
            const message = contextMenu.message;
            closeContextMenu();
            copyChatImage(message).catch((err) => {
              console.error("Copy image failed:", err);
              setSendError({ key: activeContact?.conversationKey ?? "", message: "Couldn't copy that image. Please try again." });
            });
          }}
          onUnsend={() => {
            setUnsendTargetId(contextMenu.message.id);
            closeContextMenu();
          }}
          onClose={closeContextMenu}
        />
      )}

      <RemovePhotoConfirmModal
        isOpen={unsendTargetId !== null}
        title="Unsend message?"
        description="This will remove it for everyone."
        confirmLabel="Unsend"
        isRemoving={false}
        onClose={() => setUnsendTargetId(null)}
        onConfirm={() => {
          if (unsendTargetId) void unsendMessage(unsendTargetId);
          setUnsendTargetId(null);
        }}
      />
    </div>
  );
}
