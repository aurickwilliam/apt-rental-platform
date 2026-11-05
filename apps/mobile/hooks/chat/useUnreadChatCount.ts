import { useMemo } from "react";

import type { ConversationRole, ConversationWithMeta } from "@/service/chat/conversationService";

import { useConversations } from "./useConversations";

/**
 * Number of conversations that need attention. Archived and muted chats are
 * skipped, and a manually "marked unread" chat counts like one with new messages.
 */
export function countUnreadConversations(conversations: ConversationWithMeta[]): number {
  return conversations.filter(
    (conversation) =>
      !conversation.is_archived &&
      !conversation.is_muted &&
      ((conversation.unread_count ?? 0) > 0 || conversation.marked_unread)
  ).length;
}

/**
 * Unread badge for the Chat tab. Owns the portal's realtime list channel for
 * the tab layout, so the Chat screen itself must call `useConversations` with
 * `subscribe: false` (the channel can only be registered once).
 */
export function useUnreadChatCount(role: ConversationRole): number {
  const { conversations } = useConversations(role, { subscribe: true });
  return useMemo(() => countUnreadConversations(conversations), [conversations]);
}
