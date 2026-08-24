import { useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@repo/supabase";

import { useCurrentUser } from "@/hooks/auth";
import { fetchConversationsWithMetadata } from "@/service/chat/conversationService";
import { toMessageType } from "@/service/chat/chatService";

import type { ConversationRole, ConversationWithMeta } from "@/service/chat/conversationService";

export const getConversationsQueryKey = (myId: string | null) =>
  ["conversations", myId] as const;

type NewChatRow = {
  sender_id: string;
  receiver_id: string;
  apartment_id: string | null;
  message: string | null;
  message_type: string;
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

        const updated = {
          ...next[index],
          last_message: row.message,
          last_message_type: toMessageType(row.message_type),
          last_message_time: row.created_at,
          last_sender_is_me: row.sender_id === myId,
          unread_count:
            row.sender_id !== myId
              ? (next[index].unread_count ?? 0) + 1
              : next[index].unread_count,
        };

        next.splice(index, 1);
        return [updated, ...next];
      });
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
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current === channel) {
        channelRef.current = null;
        void supabase.removeChannel(channel);
      }
    };
  }, [myId, queryClient, queryKey]);

  const markConversationRead = (conversationKey: string) => {
    queryClient.setQueryData<ConversationWithMeta[]>(queryKey, (current) =>
      current?.map((c) =>
        c.conversation_key === conversationKey ? { ...c, unread_count: 0 } : c
      )
    );
  };

  return {
    conversations: conversationsQuery.data ?? [],
    loading: currentUserQuery.isLoading || conversationsQuery.isLoading,
    refreshing: conversationsQuery.isFetching && !conversationsQuery.isLoading,
    refetch: conversationsQuery.refetch,
    markConversationRead,
  };
}