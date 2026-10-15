import type { QueryClient } from "@tanstack/react-query";

import type {
  ConversationRole,
  ConversationWithMeta,
} from "@/service/chat/conversationService";

/** Every cached conversation list of a user (one per portal). */
export const getUserConversationsQueryPrefix = (myId: string | null) =>
  ["conversations", myId] as const;

export const getConversationsQueryKey = (myId: string | null, role: ConversationRole) =>
  [...getUserConversationsQueryPrefix(myId), role] as const;

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

/** A conversation's read state as the list shows it. */
export type CachedReadState = {
  unreadCount: number;
  markedUnread: boolean;
};

/**
 * Applies `patch` to one conversation in every cached list of the user and
 * returns the values it replaced (null when the conversation isn't cached),
 * so a failed server update can put them back.
 */
export function patchCachedConversation(
  queryClient: QueryClient,
  myId: string,
  conversationKey: string,
  patch: Partial<ConversationWithMeta>
): Partial<ConversationWithMeta> | null {
  let previous: Partial<ConversationWithMeta> | null = null;

  queryClient.setQueriesData<ConversationWithMeta[]>(
    { queryKey: getUserConversationsQueryPrefix(myId) },
    (current) =>
      current?.map((conversation) => {
        if (conversation.conversation_key !== conversationKey) return conversation;
        if (!previous) {
          previous = Object.fromEntries(
            Object.keys(patch).map((field) => [
              field,
              conversation[field as keyof ConversationWithMeta],
            ])
          ) as Partial<ConversationWithMeta>;
        }
        return { ...conversation, ...patch };
      })
  );

  return previous;
}

/**
 * Clears a conversation's unread badge (count and manual "mark unread") in the
 * user's cached lists and returns what it had, so a failed server update can
 * put it back.
 */
export function clearCachedUnreadCount(
  queryClient: QueryClient,
  myId: string,
  conversationKey: string
): CachedReadState {
  const previous: CachedReadState = { unreadCount: 0, markedUnread: false };

  queryClient.setQueriesData<ConversationWithMeta[]>(
    { queryKey: getUserConversationsQueryPrefix(myId) },
    (current) =>
      current?.map((conversation) => {
        if (conversation.conversation_key !== conversationKey) return conversation;
        previous.unreadCount = Math.max(previous.unreadCount, conversation.unread_count);
        previous.markedUnread ||= conversation.marked_unread;
        return conversation.unread_count === 0 && !conversation.marked_unread
          ? conversation
          : { ...conversation, unread_count: 0, marked_unread: false };
      })
  );

  return previous;
}

/** Puts back a read state cleared by a mark-read that failed on the server. */
export function restoreCachedUnreadCount(
  queryClient: QueryClient,
  myId: string,
  conversationKey: string,
  previous: CachedReadState
): void {
  if (previous.unreadCount <= 0 && !previous.markedUnread) return;

  queryClient.setQueriesData<ConversationWithMeta[]>(
    { queryKey: getUserConversationsQueryPrefix(myId) },
    (current) =>
      current?.map((conversation) =>
        conversation.conversation_key === conversationKey
          ? {
              ...conversation,
              // Keep any messages that arrived while the request was in flight.
              unread_count: conversation.unread_count + previous.unreadCount,
              marked_unread: conversation.marked_unread || previous.markedUnread,
            }
          : conversation
      )
  );
}
