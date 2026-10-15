"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollShadow, Spinner } from "@heroui/react";
import { IconChevronLeft, IconMessage } from "@tabler/icons-react";

import ErrorBanner from "@/app/components/display/ErrorBanner";
import MessageInput from "./MessageInput";
import { Contact } from "./types";
import UserAvatar from "@/app/components/profile/UserAvatar";
import EmojiPicker from "@/app/components/chat/EmojiPicker";
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
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  // The message the full picker is reacting to. Held separately from
  // `contextMenu` so the picker can be the only overlay on screen — the
  // context menu's dismiss layer would otherwise sit on top of the modal.
  const [emojiPickerTarget, setEmojiPickerTarget] = useState<ChatMessage | null>(null);
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
    sendMessage,
    toggleReaction,
    handleReply,
    clearReply,
    openContextMenu,
    closeContextMenu,
  } = useConversation({
    currentUserId,
    otherUserId: activeContact?.id ?? null,
    apartmentId,
    onConversationRead,
    onSendError: (message) =>
      setSendError({ key: activeContact?.conversationKey ?? "", message }),
  });

  const bottomRef = useRef<HTMLDivElement>(null);

  // Opening the picker always dismisses the context menu first, so only one
  // overlay is ever mounted and the modal is never fighting a stale
  // `fixed inset-0` layer for clicks.
  const openEmojiPicker = useCallback(
    (message: ChatMessage) => {
      setEmojiPickerTarget(message);
      closeContextMenu();
      setIsEmojiPickerOpen(true);
    },
    [closeContextMenu]
  );

  const closeEmojiPicker = useCallback(() => {
    setIsEmojiPickerOpen(false);
    setEmojiPickerTarget(null);
  }, []);

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
  ]);

  // Auto-scroll to bottom on new messages or typing indicator change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isContactTyping]);

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
      className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-card ${className}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center gap-3 bg-card shadow-sm z-10 sm:gap-4">
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
        data-chat-scroll
        className="min-h-0 flex-1 overflow-y-auto bg-muted/20 dark:bg-background p-4"
        visibility="none"
      >
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
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={msg.sender_id === currentUserId}
                  otherUserName={activeContact.name}
                  onToggleReaction={toggleReaction}
                  onReply={handleReply}
                  onOpenContextMenu={(position) => openContextMenu(msg, position)}
                  onOpenEmojiPicker={() => openEmojiPicker(msg)}
                />
              ))
            )}

            {isContactTyping && <TypingIndicator />}

            <div ref={bottomRef} />
          </div>
        )}
      </ScrollShadow>

      {sendError?.key === activeContact.conversationKey ? (
        <div className="px-4">
          <ErrorBanner message={sendError.message} />
        </div>
      ) : null}

      <MessageInput
        onSend={handleSend}
        onTypingChange={handleTypingChange}
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
          onOpenFullPicker={() => openEmojiPicker(contextMenu.message)}
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

      <EmojiPicker
        isOpen={isEmojiPickerOpen && emojiPickerTarget !== null}
        onClose={closeEmojiPicker}
        onEmojiSelected={(emoji) => {
          if (emojiPickerTarget) void toggleReaction(emojiPickerTarget.id, emoji);
        }}
      />
    </div>
  );
}