import type { QueryClient } from "@tanstack/react-query";

import type { ConversationWithMeta } from "@/service/chat/conversationService";

export const getConversationsQueryKey = (myId: string | null) =>
  ["conversations", myId] as const;

// Conversations currently on screen (chat focused, app in the foreground).
// Counted so a conversation pushed twice stays "viewed" until both close.
const viewedConversations = new Map<string, number>();

/** Marks a conversation as on screen; the returned function ends it. */
export function beginViewingConversation(conversationKey: string): () => void {
  viewedConversations.set(
    conversationKey,
    (viewedConversations.get(conversationKey) ?? 0) + 1
  );

  let ended = false;
  return () => {
    if (ended) return;
    ended = true;

    const remaining = (viewedConversations.get(conversationKey) ?? 1) - 1;
    if (remaining > 0) {
      viewedConversations.set(conversationKey, remaining);
    } else {
      viewedConversations.delete(conversationKey);
    }
  };
}

/** Whether new messages in this conversation are being read as they arrive. */
export function isViewingConversation(conversationKey: string): boolean {
  return viewedConversations.has(conversationKey);
}

/**
 * Zeroes a conversation's unread badge in the cached list and returns the
 * count it had, so a failed server update can put it back.
 */
export function clearCachedUnreadCount(
  queryClient: QueryClient,
  myId: string,
  conversationKey: string
): number {
  let previousUnread = 0;

  queryClient.setQueryData<ConversationWithMeta[]>(
    getConversationsQueryKey(myId),
    (current) =>
      current?.map((conversation) => {
        if (conversation.conversation_key !== conversationKey) return conversation;
        previousUnread = conversation.unread_count;
        return conversation.unread_count === 0
          ? conversation
          : { ...conversation, unread_count: 0 };
      })
  );

  return previousUnread;
}

/** Puts back an unread count cleared by a mark-read that failed on the server. */
export function restoreCachedUnreadCount(
  queryClient: QueryClient,
  myId: string,
  conversationKey: string,
  previousUnread: number
): void {
  if (previousUnread <= 0) return;

  queryClient.setQueryData<ConversationWithMeta[]>(
    getConversationsQueryKey(myId),
    (current) =>
      current?.map((conversation) =>
        conversation.conversation_key === conversationKey
          ? {
              ...conversation,
              // Keep any messages that arrived while the request was in flight.
              unread_count: conversation.unread_count + previousUnread,
            }
          : conversation
      )
  );
}
