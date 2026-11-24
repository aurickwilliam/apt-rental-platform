"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { useNotifications } from "@/hooks/use-notifications";
import type { ActivePortal } from "@/lib/notification-audience";
import {
  NOTIFICATION_SYNC_RETRY_DELAYS_MS,
  isViewingConversation,
  retryBounded,
  unreadIdsForConversation,
  type ConversationIdentity,
} from "@/lib/conversation-notification-sync";
import { markConversationNotificationsRead } from "@/service/conversationNotificationService";

interface UseConversationReadSyncArgs {
  supabase: SupabaseClient;
  portal: ActivePortal;
  currentUserId: string;
  contactId: string | null;
  apartmentId: string | null;
  conversationKey: string | null;
  onConversationRead?: (conversationKey: string) => void;
}

function subscribeVisibility(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/**
 * Viewing a conversation reads its incoming messages and the viewer's message
 * notifications of that same thread. Both only while the tab is visible: a
 * mounted route in a hidden tab has not shown anything to the person.
 *
 * Messages are marked first (`chat.is_read`). The notification update then
 * uses the newest read incoming message as its cutoff, so notifications of
 * messages that arrive later stay unread. A failed notification write is
 * retried a bounded number of times and again on the next open or refocus;
 * every step is idempotent. Returns the callback the realtime hook uses for a
 * message that arrives while the thread is open.
 */
export default function useConversationReadSync({
  supabase,
  portal,
  currentUserId,
  contactId,
  apartmentId,
  conversationKey,
  onConversationRead,
}: UseConversationReadSyncArgs): { syncNotificationsUpTo: (createdAt: string) => void } {
  const { getFeedRows, markIdsRead } = useNotifications(portal);

  // Optimistically flips the loaded matching rows, then persists by identity
  // (so rows past the loaded 50 are covered too). True only when persisted.
  const markConversationRead = useCallback(
    async (identity: ConversationIdentity, upTo: string): Promise<boolean> => {
      const write = () => markConversationNotificationsRead(currentUserId, identity, upTo).then(() => undefined);
      const ids = unreadIdsForConversation(getFeedRows(), identity, upTo);
      if (ids.length > 0) return markIdsRead(ids, write);
      try {
        // Nothing loaded to flip: the database update is still authoritative
        // and the feed's Realtime subscription reflects any change.
        await write();
        return true;
      } catch (error) {
        console.error("Couldn't mark conversation notifications read.", error);
        return false;
      }
    },
    [currentUserId, getFeedRows, markIdsRead],
  );
  const viewing = useSyncExternalStore(
    subscribeVisibility,
    () => isViewingConversation(document.visibilityState),
    () => false,
  );

  // Callbacks flow through refs so an identity change never re-runs the sync.
  const markRef = useRef(markConversationRead);
  const onReadRef = useRef(onConversationRead);
  const generationRef = useRef(0);
  useEffect(() => {
    markRef.current = markConversationRead;
    onReadRef.current = onConversationRead;
  }, [markConversationRead, onConversationRead]);

  const syncNotificationsUpTo = useCallback(
    (createdAt: string) => {
      if (!contactId) return;
      const generation = generationRef.current;
      const identity = { contactId, apartmentId };
      void retryBounded(
        async () => {
          const ok = await markRef.current(identity, createdAt);
          if (!ok) throw new Error("notification sync failed");
        },
        {
          delays: NOTIFICATION_SYNC_RETRY_DELAYS_MS,
          isCancelled: () => generationRef.current !== generation,
        },
      ).then((synced) => {
        if (!synced && generationRef.current === generation) {
          console.error("Messages were marked read, but their notifications could not be.");
        }
      });
    },
    [contactId, apartmentId],
  );

  useEffect(() => {
    if (!contactId || !viewing) return;
    generationRef.current += 1;
    let cancelled = false;

    const run = async () => {
      let mark = supabase
        .from("chat")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .select("id")
        .eq("sender_id", contactId)
        .eq("receiver_id", currentUserId)
        .eq("is_read", false);
      mark = apartmentId ? mark.eq("apartment_id", apartmentId) : mark.is("apartment_id", null);
      const { data, error } = await mark;
      if (cancelled || error) return;
      if ((data?.length ?? 0) > 0 && conversationKey) onReadRef.current?.(conversationKey);

      // Cutoff: the newest incoming message that is now read. Anything newer
      // (arriving mid-operation) is not covered and keeps its notification.
      let latest = supabase
        .from("chat")
        .select("created_at")
        .eq("sender_id", contactId)
        .eq("receiver_id", currentUserId)
        .eq("is_read", true);
      latest = apartmentId ? latest.eq("apartment_id", apartmentId) : latest.is("apartment_id", null);
      const { data: newest, error: newestError } = await latest
        .order("created_at", { ascending: false })
        .limit(1);
      if (cancelled || newestError || !newest?.[0]?.created_at) return;
      syncNotificationsUpTo(newest[0].created_at as string);
    };
    void run().catch((error: unknown) => console.error("Couldn't mark the conversation read.", error));

    return () => {
      cancelled = true;
      generationRef.current += 1;
    };
  }, [apartmentId, contactId, conversationKey, currentUserId, supabase, syncNotificationsUpTo, viewing]);

  return { syncNotificationsUpTo };
}
