"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

import { applyReadReceipt, mergeIncomingMessage, removeMessage } from "./conversationEvents";
import type { ChatMessage } from "./types";

/** How long a typing Broadcast stays on until a fresh or stopping one arrives. */
const TYPING_FRESH_WINDOW_MS = 5000;

/** A `typing` Broadcast message (sent by `broadcastTyping`, mirrored by mobile). */
interface TypingBroadcast {
  payload: { userId: string; isTyping: boolean };
}

interface UseConversationRealtimeArgs {
  supabase: SupabaseClient;
  /** Users-pair id (`a_b`); identical on both sides and the channel topic. */
  conversationId: string | null;
  currentUserId: string;
  contactId: string | null;
  /** Contact-list key for the open conversation, so its badge can clear. */
  conversationKey: string | null;
  apartmentId?: string | null;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  refreshMessages: () => Promise<void>;
  onConversationRead?: (conversationKey: string) => void;
}

interface UseConversationRealtimeResult {
  isContactTyping: boolean;
  broadcastTyping: (isTyping: boolean) => Promise<void>;
}

/** The `system` event payload Realtime delivers for subscription errors. */
interface RealtimeSystemMessage {
  extension?: string;
  status?: "ok" | "error";
  message?: string;
}

type SubscribeStatus = "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR";

/**
 * The realtime half of a conversation, shared by the tenant and landlord
 * views: `chat` INSERTs from the active contact, read receipts for messages
 * this user sent (the `chat` UPDATE event), typing Broadcasts, and a resync
 * whenever the channel re-joins or the tab becomes visible again.
 *
 * Only `chat` is bound. `chat_reactions` is not in the `supabase_realtime`
 * publication, and Realtime rejects an unpublished table by failing the whole
 * join — silently disabling the valid bindings too — so reactions stay
 * refresh-based until that publication change is reviewed.
 */
export default function useConversationRealtime({
  supabase,
  conversationId,
  currentUserId,
  contactId,
  conversationKey,
  apartmentId,
  setMessages,
  refreshMessages,
  onConversationRead,
}: UseConversationRealtimeArgs): UseConversationRealtimeResult {
  const [isContactTyping, setIsContactTyping] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  // Auto-clears a typing Broadcast whose "stop" never arrived.
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read through refs so a live channel never needs its bindings
  // re-registered — Realtime refuses those once the channel subscribed.
  const apartmentRef = useRef(apartmentId);
  const conversationKeyRef = useRef(conversationKey);
  const onReadRef = useRef(onConversationRead);
  const refreshRef = useRef(refreshMessages);
  useEffect(() => {
    apartmentRef.current = apartmentId;
    conversationKeyRef.current = conversationKey;
    onReadRef.current = onConversationRead;
    refreshRef.current = refreshMessages;
  }, [apartmentId, conversationKey, onConversationRead, refreshMessages]);

  /**
   * Publishes this user's typing state as a Broadcast on the conversation
   * channel. Presence was removed on purpose: its client-side limit (5 updates
   * per 30 s) closed the whole channel and silenced its message bindings while
   * someone was chatting normally.
   */
  const broadcastTyping = useCallback(
    async (isTyping: boolean) => {
      const channel = channelRef.current;
      if (!channel) return;
      await channel
        .send({ type: "broadcast", event: "typing", payload: { userId: currentUserId, isTyping } })
        .catch(() => undefined); // a lost typing signal is never an error for the user
    },
    [currentUserId]
  );

  useEffect(() => {
    if (!conversationId || !contactId) return;

    let disposed = false;
    let joinedOnce = false;
    let refreshInFlight = false;

    // One resync at a time: a re-join and a refocus can race, and both would
    // otherwise issue their own read of the same conversation.
    const requestRefresh = () => {
      if (refreshInFlight) return;
      refreshInFlight = true;
      void Promise.resolve(refreshRef.current())
        .catch((err: unknown) => {
          console.error("Failed to resync messages:", err);
        })
        .finally(() => {
          refreshInFlight = false;
        });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") requestRefresh();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const topic = `conversation:${conversationId}`;

    const start = async () => {
      // `supabase-js` dedupes channels by topic, and a previous channel for
      // this conversation may still be unregistering (React remounts, a fast
      // switch back). Realtime refuses bindings on a joined/joining channel
      // and ignores `subscribe()` on an open one, so close any leftover
      // first — a closed channel can be chained and re-joined.
      const leftovers = supabase
        .getChannels()
        .filter((existing) => existing.topic === `realtime:${topic}`);
      for (const leftover of leftovers) {
        await supabase.removeChannel(leftover);
        // A leave that couldn't complete (socket down) leaves the adapter
        // open; `teardown` is idempotent and guarantees the subscription
        // below actually joins instead of silently reusing a dying channel.
        leftover.teardown();
      }
      if (disposed) return;

      const channel = supabase
        .channel(topic)
        // Messages from the active contact. `chat` is in `supabase_realtime`.
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat",
            filter: `sender_id=eq.${contactId}`,
          },
          (payload: { new: Record<string, unknown> }) => {
            const incoming = payload.new as unknown as ChatMessage;
            if (
              apartmentRef.current &&
              incoming.apartment_id !== apartmentRef.current
            ) {
              return;
            }
            if (incoming.receiver_id !== currentUserId) return;

            setMessages((prev) => mergeIncomingMessage(prev, incoming));

            void supabase
              .from("chat")
              .update({ is_read: true, read_at: new Date().toISOString() })
              .eq("id", incoming.id)
              .eq("receiver_id", currentUserId)
              .eq("is_read", false);

            const key = conversationKeyRef.current;
            if (key) onReadRef.current?.(key);
          }
        )
        // Read receipts: rows this user sent — their receiver is the active
        // contact, who marks them read when they open the thread.
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "chat",
            filter: `receiver_id=eq.${contactId}`,
          },
          (payload: { new: Record<string, unknown> }) => {
            const updated = payload.new as unknown as ChatMessage;
            if (typeof updated.id !== "string") return;
            setMessages((prev) =>
              applyReadReceipt(prev, {
                id: updated.id,
                is_read: updated.is_read,
                read_at: updated.read_at,
              })
            );
          }
        )
        // Unsends from either side (web or mobile). DELETE events can't be
        // filtered and carry only the old primary key; `removeMessage` ignores
        // ids that aren't in this thread.
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "chat" },
          (payload: { old: Record<string, unknown> }) => {
            const id = payload.old?.id;
            if (typeof id !== "string") return;
            setMessages((prev) => removeMessage(prev, id));
          }
        )
        // Typing arrives as Broadcast on the same channel (its sender drops
        // presence entirely — see `broadcastTyping`). The payload's user id
        // filters out anything not from the active contact.
        .on("broadcast", { event: "typing" }, (message: TypingBroadcast) => {
          const payload = message?.payload;
          if (!payload || payload.userId !== contactId) return;
          const isTyping = payload.isTyping === true;
          setIsContactTyping(isTyping);
          if (typingClearRef.current) clearTimeout(typingClearRef.current);
          // A lost "stop" can never leave the indicator stuck.
          typingClearRef.current = isTyping
            ? setTimeout(() => {
                typingClearRef.current = null;
                setIsContactTyping(false);
              }, TYPING_FRESH_WINDOW_MS)
            : null;
        })
        .on("system", { event: "*" }, (message: RealtimeSystemMessage) => {
          if (message.status === "error") {
            console.error("Realtime subscription error:", message.message);
            // The channel is closing; the indicator must not outlive it.
            setIsContactTyping(false);
          }
        })
        .subscribe((status: SubscribeStatus, err?: Error) => {
          if (status === "SUBSCRIBED") {
            // Every join starts quiet: a switch between threads (or a
            // reconnect in one) must not inherit the previous channel's
            // typing state. Broadcast has no presence sync to re-resolve it.
            setIsContactTyping(false);
            // The first join is covered by the initial fetch; a later one
            // means the socket dropped and events were missed while it was
            // gone, so reconcile against the server.
            if (joinedOnce) requestRefresh();
            joinedOnce = true;
            return;
          }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error(`Realtime channel ${status} for ${topic}`, err);
          }
        });

      channelRef.current = channel;
    };

    void start().catch((err: unknown) => {
      console.error("Failed to start the conversation channel:", err);
    });

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (typingClearRef.current) {
        clearTimeout(typingClearRef.current);
        typingClearRef.current = null;
      }
      const channel = channelRef.current;
      channelRef.current = null;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [contactId, conversationId, currentUserId, setMessages, supabase]);

  return { isContactTyping, broadcastTyping };
}
