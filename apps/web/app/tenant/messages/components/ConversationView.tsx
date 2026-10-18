"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, ScrollShadow, Spinner } from "@heroui/react";
import {
  IconArrowDown,
  IconChevronLeft,
  IconMessage,
} from "@tabler/icons-react";

import ErrorBanner from "@/app/components/display/ErrorBanner";
import MessageInput from "./MessageInput";
import { Contact } from "./types";
import UserAvatar from "@/app/components/profile/UserAvatar";
import MessageContextMenu from "@/app/components/chat/MessageContextMenu";
import MessageBubble from "@/app/components/chat/MessageBubble";
import useConversation from "@/app/components/chat/useConversation";
import type { ChatMessage } from "@/app/components/chat/types";

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
    <div className="self-start flex items-center gap-1 bg-card px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-border w-fit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
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
  const [isContactTyping, setIsContactTyping] = useState(false);
  const channelRef = useRef<ReturnType<
    ReturnType<typeof useConversation>["supabase"]["channel"]
  > | null>(null);

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

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // True when the reader is within the threshold of the newest message. Drives
  // both the follow decision and the jump-to-latest button's visibility.
  const nearBottomRef = useRef(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(isLoadingEarlierMessages);
  const messageCount = messages.length;


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

  // Realtime: new messages + typing presence
  useEffect(() => {
    if (!activeContact || !conversationId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`conversation:${conversationId}`, {
        config: { presence: { key: currentUserId } },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat",
          filter: `sender_id=eq.${activeContact.id}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const incoming = payload.new as unknown as ChatMessage;
          if (apartmentId && incoming.apartment_id !== apartmentId) return;
          if (incoming.receiver_id !== currentUserId) return;

          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id)
              ? prev
              : [...prev, { ...incoming, reactions: incoming.reactions ?? [] }]
          );

          void supabase
            .from("chat")
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq("id", incoming.id)
            .eq("receiver_id", currentUserId)
            .eq("is_read", false);

          onConversationRead?.(activeContact.conversationKey);
        }
      )
      // Reactions live in their own table, so the `chat` INSERT subscription
      // above never fires for them. Without this the other person's reaction
      // only appeared on the next reload.
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_reactions",
        },
        () => {
          void refreshMessages();
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ isTyping: boolean }>();
        const contactState = state[activeContact.id];
        setIsContactTyping(contactState?.[0]?.isTyping ?? false);
      })
      .subscribe((status: "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR") => {
        if (status === "SUBSCRIBED") {
          void channel.track({ isTyping: false });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [
    activeContact,
    apartmentId,
    conversationId,
    currentUserId,
    supabase,
    setMessages,
    onConversationRead,
    refreshMessages,
  ]);

  /**
   * Owns the "follow the bottom" flag. Sampled on scroll, and again
   * whenever the thread grows so the decision uses the position from
   * *before* the new message was appended.
   */
  // Not memoized by hand — `reactCompiler` is on and preserves this shape.
  const handleThreadScroll = () => {
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
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
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
      if (channelRef.current) await channelRef.current.track({ isTyping });
    },
    []
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
      <div data-fab-clearance="conversation-header" data-fab-dock="conversation-header" className="p-3 border-b border-border flex items-center gap-3 bg-card shadow-sm z-10 sm:gap-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to conversations"
            className="-ml-1 shrink-0 rounded-lg p-2 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
          >
            <IconChevronLeft size={20} aria-hidden="true" />
          </button>
        )}
        <UserAvatar
          src={activeContact.avatar}
          initials={activeContact.name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("")}
          alt={activeContact.name}
          size="lg"
        />

        <div>
          <h2 className="text-base font-bold text-foreground leading-tight">
            {activeContact.name}
          </h2>
          <p className="text-xs text-muted-foreground font-medium">
            {activeContact.apartment}
          </p>
        </div>
      </div>

      {/* Chat History */}
      {/* `data-chat-scroll` is the clipping boundary the reaction strip measures
          against when deciding whether it can float above a message. */}
      <ScrollShadow
        ref={scrollRef}
        data-chat-scroll
        onScroll={handleThreadScroll}
        className="min-h-0 flex-1 overflow-y-auto bg-muted/20 dark:bg-background p-4"
        visibility="none"
      >
        {hasEarlierMessages && (
          <div className="flex justify-center pb-2">
            <Button
              variant="secondary"
              size="sm"
              onPress={() => void handleLoadEarlier()}
              isPending={isLoadingEarlier}
            >
              Load earlier messages
            </Button>
          </div>
        )}

        {messagesLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" color="accent" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex-col items-center justify-center gap-2 py-10 text-center text-default-500">
                <p className="text-sm font-medium text-foreground">No messages yet</p>
                <p className="text-xs text-default-500">
                  Say hi to start the conversation.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={msg.sender_id === currentUserId}
                  otherUserName={activeContact.name}
                  groupPosition={getGroupPosition(messages, index)}
                  hasLaterMessageFromSender={
                    index < messages.length - 1 &&
                    messages[index + 1].sender_id === msg.sender_id
                  }
                  onToggleReaction={toggleReaction}
                  onReply={handleReply}
                  onOpenContextMenu={(position) => openContextMenu(msg, position)}
                />
              ))
            )}

            {isContactTyping && <TypingIndicator />}

            <div ref={bottomRef} />
          </div>
        )}
      </ScrollShadow>

      {/* Jump-to-latest. Only mounted when the reader has scrolled away from
          the newest message, which is exactly the state in which auto-scroll
          deliberately does not follow. */}
      {!isNearBottom && (
        <button
          type="button"
          onClick={jumpToLatest}
          aria-label="Jump to latest messages"
          className="absolute bottom-4 left-1/2 z-20 flex size-10 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <IconArrowDown size={20} aria-hidden="true" />
        </button>
      )}

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
            myReaction: contextMenu.message.reactions.find((r) => r.is_mine)?.emoji,
            dateLabel: new Date(contextMenu.message.created_at).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            }),
            canReact: !contextMenu.message.isPending && !contextMenu.message.id.startsWith("temp-"),
            canCopy: (contextMenu.message.message_type ?? "text") === "text" && !!contextMenu.message.message,
          }}
          position={contextMenu.position}
          onSelectReaction={(emoji) => {
            void toggleReaction(contextMenu.message.id, emoji);
            closeContextMenu();
          }}
          onReply={() => {
            handleReply(contextMenu.message);
            closeContextMenu();
          }}
          onCopy={() => {
            if (contextMenu.message.message) {
              void handleCopy(contextMenu.message.message);
            }
          }}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}