import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@repo/supabase";

import { useCurrentUser } from "@/hooks/auth";
import { fetchConversationsWithMetadata } from "@/service/chat/conversationService";
import { markMessagesAsRead, toMessageType } from "@/service/chat/chatService";

import type { ConversationRole, ConversationWithMeta } from "@/service/chat/conversationService";

import {
  clearCachedUnreadCount,
  getConversationsQueryKey,
  isViewingConversation,
  restoreCachedUnreadCount,
} from "./conversationReadState";

export { getConversationsQueryKey };

function getErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "An unexpected error occurred.";
}

type NewChatRow = {
  sender_id: string;
  receiver_id: string;
  apartment_id: string | null;
  message: string | null;
  message_type: string;
  created_at: string;
};

type OldChatRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  apartment_id: string | null;
  created_at: string;
};

export function useConversations(role: ConversationRole) {
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUser();
  const myId = currentUserQuery.data?.id ?? null;

  const queryKey = useMemo(() => getConversationsQueryKey(myId), [myId]);

  const conversationsQuery = useQuery({
    queryKey,
    queryFn: () => fetchConversationsWithMetadata(myId as string, role),
    enabled: myId !== null,
  });

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Realtime: merge INSERTs into the cached list (same splice semantics as the
  // screen-local code it replaces); unknown conversations trigger a refetch.
  //
  // supabase-js returns the EXISTING channel for a repeated channel name and
  // throws when postgres_changes callbacks are added to an already-joined
  // channel. The effect therefore keys only on stable identity: a queryKey
  // array literal in the deps re-ran this effect on every render, and the
  // fire-and-forget removeChannel had not unregistered the joined channel
  // before the next run chained .on() onto it (the reported
  // "cannot add postgres_changes callbacks ... after subscribe()" crash).
  useEffect(() => {
    if (!myId) return;

    const handleInsert = (payload: { new: unknown }) => {
      const row = payload.new as NewChatRow;
      if (typeof row.sender_id !== "string") return;
      if (row.sender_id !== myId && row.receiver_id !== myId) return;

      const otherUserId = row.sender_id === myId ? row.receiver_id : row.sender_id;

      queryClient.setQueryData<ConversationWithMeta[]>(queryKey, (current) => {
        if (!current) return current;

        const next = [...current];
        const index = next.findIndex(
          (conv) =>
            conv.other_user_id === otherUserId &&
            (conv.apartment_id ?? null) === (row.apartment_id ?? null)
        );

        if (index === -1) {
          // If the conversation doesn't exist in the cache, refresh from backend.
          void queryClient.invalidateQueries({ queryKey, exact: true });
          return current;
        }

        // A message arriving in the chat on screen is read as it lands.
        const countsAsUnread =
          row.sender_id !== myId &&
          !isViewingConversation(next[index].conversation_key);

        const updated = {
          ...next[index],
          last_message: row.message,
          last_message_type: toMessageType(row.message_type),
          last_message_time: row.created_at,
          last_sender_is_me: row.sender_id === myId,
          unread_count: countsAsUnread
            ? (next[index].unread_count ?? 0) + 1
            : next[index].unread_count,
        };

        next.splice(index, 1);
        return [updated, ...next];
      });
    };

    const handleDelete = (payload: { old: unknown }) => {
      const row = payload.old as OldChatRow;
      if (typeof row.sender_id !== "string") return;
      if (row.sender_id !== myId && row.receiver_id !== myId) return;

      const otherUserId = row.sender_id === myId ? row.receiver_id : row.sender_id;

      queryClient.setQueryData<ConversationWithMeta[]>(queryKey, (current) => {
        if (!current) return current;
        const index = nextFindIndex(current, otherUserId, row.apartment_id);
        if (index === -1) {
          void queryClient.invalidateQueries({ queryKey, exact: true });
          return current;
        }
        const next = [...current];
        const updated = {
          ...next[index],
          last_message: "This message was unsent",
          last_message_type: null,
          last_message_time: row.created_at,
          last_sender_is_me: row.sender_id === myId,
        };
        next[index] = updated;
        // Keep ordering stable; background refetch will correct if deleted was not latest.
        void queryClient.invalidateQueries({ queryKey, exact: true });
        return next;
      });

      function nextFindIndex(
        arr: ConversationWithMeta[],
        otherId: string,
        aptId: string | null
      ) {
        return arr.findIndex(
          (conv) => conv.other_user_id === otherId && (conv.apartment_id ?? null) === (aptId ?? null)
        );
      }
    };

    // A channel with this identity is still unregistering (removeChannel is
    // async): reuse it instead of re-registering on the joined channel. The
    // live callback closes over the same myId-scoped key, so behavior is
    // identical; this run takes over teardown ownership.
    const existing = supabase
      .getChannels()
      .find((channel) => channel.topic === `realtime:chat-list:${myId}`);
    if (existing) {
      channelRef.current = existing;
      return () => {
        if (channelRef.current === existing) {
          channelRef.current = null;
          void supabase.removeChannel(existing);
        }
      };
    }

    const channel = supabase
      .channel(`chat-list:${myId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat",
        },
        handleInsert
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chat",
        },
        handleDelete
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current === channel) {
        channelRef.current = null;
        void supabase.removeChannel(channel);
      }
    };
  }, [myId, queryClient, queryKey]);

  // Clears the badge right away, then saves the read state; a failed save
  // puts the badge back so the list never shows a read that didn't happen.
  const markConversationRead = useCallback(
    async (conversationKey: string) => {
      if (!myId) return;

      const conversation = queryClient
        .getQueryData<ConversationWithMeta[]>(queryKey)
        ?.find((c) => c.conversation_key === conversationKey);
      if (!conversation) return;

      const previousUnread = clearCachedUnreadCount(queryClient, myId, conversationKey);

      try {
        await markMessagesAsRead(myId, conversation.other_user_id, conversation.apartment_id);
      } catch (markError) {
        console.error("[conversations] Failed to mark conversation as read:", markError);
        restoreCachedUnreadCount(queryClient, myId, conversationKey, previousUnread);
      } finally {
        void queryClient.invalidateQueries({ queryKey, exact: true, refetchType: "none" });
      }
    },
    [myId, queryClient, queryKey]
  );

  const error = getErrorMessage(currentUserQuery.error ?? conversationsQuery.error);

  return {
    conversations: conversationsQuery.data ?? [],
    loading: currentUserQuery.isLoading || conversationsQuery.isLoading,
    refreshing: conversationsQuery.isFetching && !conversationsQuery.isLoading,
    error,
    refetch: conversationsQuery.refetch,
    markConversationRead,
  };
}