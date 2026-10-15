"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@repo/supabase/browser";

import {
  attachReplyPreviews,
  groupReactions,
  toggleChatReaction,
  toReplyPreview,
} from "./chatReactions";
import type { ChatMessage, ReplyPreview } from "./types";

interface UseConversationArgs {
  currentUserId: string;
  otherUserId: string | null;
  apartmentId?: string | null;
  /** Reports that new messages arrived so the contact list can mark it read. */
  onConversationRead?: (conversationId: string) => void;
  /** Called with a user-facing message when a send fails, for the error banner. */
  onSendError?: (message: string) => void;
}

export interface ContextMenuTarget {
  message: ChatMessage;
  position: { x: number; y: number };
}

type SupabaseClient = ReturnType<typeof createClient>;

/**
 * Loads a conversation's messages together with their reactions and resolved
 * reply originals. Pure with respect to React — it returns rows rather than
 * setting state, so callers decide when to apply them.
 */
async function loadConversation(
  supabase: SupabaseClient,
  currentUserId: string,
  otherUserId: string,
  apartmentId: string | null
): Promise<ChatMessage[]> {
  const base = supabase
    .from("chat")
    .select("*")
    .or(
      `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),` +
        `and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
    )
    .order("created_at", { ascending: true });

  const { data, error } = apartmentId
    ? await base.eq("apartment_id", apartmentId)
    : await base.is("apartment_id", null);

  if (error || !data) return [];

  // The generated row type lags the chat table's extra columns; the columns
  // this view reads (message, reply_to, timestamps) line up.
  const rows = data as unknown as ChatMessage[];
  const messageIds = rows.map((r) => r.id);

  // Reactions for the page (one row per reacting user per message).
  const reactionRows = messageIds.length
    ? (
        await supabase
          .from("chat_reactions")
          .select("message_id, user_id, emoji")
          .in("message_id", messageIds)
      ).data ?? []
    : [];

  // Quoted originals for reply previews (text placeholder for media).
  const replyIds = [
    ...new Set(rows.map((r) => r.reply_to).filter((v): v is string => !!v)),
  ];
  const replyRows = replyIds.length
    ? (
        await supabase
          .from("chat")
          .select("id, message, message_type, sender_id")
          .in("id", replyIds)
      ).data ?? []
    : [];

  const reactionsByMessage = groupReactions(
    reactionRows as { message_id: string; user_id: string; emoji: string }[],
    currentUserId
  );

  return attachReplyPreviews(
    rows,
    replyRows as Pick<ChatMessage, "id" | "message" | "message_type" | "sender_id">[],
    currentUserId
  ).map((m) => ({
    ...m,
    reactions: reactionsByMessage.get(m.id) ?? [],
  }));
}

/**
 * Shared conversation state for the tenant and landlord chat views: message
 * fetch (with reactions and resolved reply previews), optimistic send, reply
 * targeting, and reaction toggling.
 *
 * Reactions are applied optimistically so the badge updates on tap, then
 * rolled back if the write fails.
 */
export default function useConversation({
  currentUserId,
  otherUserId,
  apartmentId,
  onConversationRead,
  onSendError,
}: UseConversationArgs) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuTarget | null>(null);

  // Keep the callback fresh without re-subscribing the realtime channel.
  const onReadRef = useRef(onConversationRead);
  useEffect(() => {
    onReadRef.current = onConversationRead;
  }, [onConversationRead]);

  const conversationId = useMemo(
    () => (otherUserId ? [currentUserId, otherUserId].sort().join("_") : null),
    [currentUserId, otherUserId]
  );

  // Clearing on "no conversation" is a prop-to-state reset, so it happens
  // during render by comparing against the previous id rather than inside an
  // effect — `react-hooks/set-state-in-effect` is enforced in CI.
  const [prevOtherUserId, setPrevOtherUserId] = useState(otherUserId);
  if (prevOtherUserId !== otherUserId) {
    setPrevOtherUserId(otherUserId);
    if (!otherUserId) {
      setMessages([]);
      setReplyTarget(null);
      setContextMenu(null);
    }
  }

  // Loading is derived, not stored: a conversation is loading whenever it isn't
  // the one already fetched. Setting a flag before the fetch would need a
  // synchronous setState in the effect body, which cascades renders.
  const fetchKey = otherUserId ? `${otherUserId}:${apartmentId ?? "any"}` : null;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const isLoading = fetchKey !== null && loadedKey !== fetchKey;

  useEffect(() => {
    if (!fetchKey || !otherUserId) return;

    let isCancelled = false;

    // Rows are applied in the promise callback, never in the effect body —
    // `loadConversation` is pure, so the linter sees no setState here.
    loadConversation(supabase, currentUserId, otherUserId, apartmentId ?? null)
      .then((hydrated) => {
        if (isCancelled) return;
        setMessages(hydrated);
        setLoadedKey(fetchKey);
      })
      .catch((err: unknown) => {
        console.error("Failed to load messages:", err);
        // Stop the spinner even on failure; the view falls back to its empty state.
        if (!isCancelled) setLoadedKey(fetchKey);
      });

    return () => {
      isCancelled = true;
    };
  }, [apartmentId, currentUserId, fetchKey, otherUserId, supabase]);

  /** Re-reads the current conversation, e.g. after a failed reaction write. */
  const refreshMessages = useCallback(async () => {
    if (!otherUserId) return;
    const hydrated = await loadConversation(
      supabase,
      currentUserId,
      otherUserId,
      apartmentId ?? null
    );
    setMessages(hydrated);
  }, [apartmentId, currentUserId, otherUserId, supabase]);

  /** Sends a text message, optionally as a reply. Optimistic with rollback. */
  const sendMessage = useCallback(
    async (content: string, replyToId: string | null) => {
      if (!otherUserId || !content.trim()) return;

      const text = content.trim();
      const tempId = `temp-${Date.now()}`;
      const preview: ReplyPreview | null = replyTarget
        ? toReplyPreview(replyTarget, currentUserId)
        : null;

      const pending: ChatMessage = {
        id: tempId,
        sender_id: currentUserId,
        receiver_id: otherUserId,
        message: text,
        message_type: "text",
        is_read: false,
        read_at: null,
        apartment_id: apartmentId ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reply_to: replyToId,
        replyTo: preview,
        reactions: [],
        isPending: true,
      };

      setMessages((prev) => [...prev, pending]);
      setReplyTarget(null);

      const { data, error } = await supabase
        .from("chat")
        .insert({
          sender_id: currentUserId,
          receiver_id: otherUserId,
          message: text,
          message_type: "text",
          apartment_id: apartmentId ?? null,
          reply_to: replyToId,
          is_read: false,
        })
        .select("id, message, message_type, created_at, sender_id, reply_to")
        .single();

      if (error || !data) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        console.error("Failed to send:", error?.message);
        onSendError?.(error?.message ?? "Failed to send");
        return;
      }

      setMessages((prev) => {
        // The realtime INSERT may have already landed the real row.
        const withoutPending = prev.filter((m) => m.id !== tempId);
        if (withoutPending.some((m) => m.id === data.id)) return withoutPending;
        const sent: ChatMessage = {
          ...pending,
          id: data.id,
          created_at: data.created_at,
          isPending: false,
        };
        return [...withoutPending, sent];
      });
    },
    [apartmentId, currentUserId, onSendError, otherUserId, replyTarget, supabase]
  );

  /**
   * Applies a reaction optimistically and persists it. Tapping the emoji the
   * current user already chose removes their reaction.
   */
  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const hadReaction = messages.some(
        (m) =>
          m.id === messageId &&
          m.reactions.some((r) => r.is_mine && r.emoji === emoji)
      );

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          if (hadReaction) {
            return { ...m, reactions: m.reactions.filter((r) => r.emoji !== emoji || !r.is_mine) };
          }
          return {
            ...m,
            // One reaction per user: drop the previous emoji, keep others'.
            reactions: [
              ...m.reactions.filter((r) => !r.is_mine),
              { emoji, user_id: currentUserId, is_mine: true },
            ],
          };
        })
      );

      try {
        await toggleChatReaction(supabase, {
          messageId,
          userId: currentUserId,
          emoji,
          hadReaction,
        });
      } catch (err) {
        console.error("Failed to save reaction:", err);
        // Re-sync from the server so the optimistic badge can't drift.
        void refreshMessages();
      }
    },
    [currentUserId, messages, refreshMessages, supabase]
  );

  const handleReply = useCallback((msg: ChatMessage) => {
    if (msg.isPending || msg.id.startsWith("temp-")) return;
    setReplyTarget(msg);
  }, []);

  const clearReply = useCallback(() => setReplyTarget(null), []);

  const openContextMenu = useCallback((message: ChatMessage, position: { x: number; y: number }) => {
    setContextMenu({ message, position });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  return {
    supabase,
    conversationId,
    messages,
    setMessages,
    isLoading,
    replyTarget,
    contextMenu,
    sendMessage,
    toggleReaction,
    handleReply,
    clearReply,
    openContextMenu,
    closeContextMenu,
  };
}