import type { ConversationWithMeta } from "./conversationService";

/** Route params for `/chat/[conversationId]`. Never carries contact details (PII). */
export type ChatRouteParams = {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string;
  apartmentId: string;
  apartmentTitle: string;
};

/**
 * Keeps conversations whose person, property or last message contains the
 * query (case-insensitive, surrounding spaces ignored). A blank query keeps all.
 */
export function filterConversations(
  conversations: ConversationWithMeta[],
  query: string
): ConversationWithMeta[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return conversations;

  return conversations.filter(
    (conversation) =>
      conversation.other_user_name.toLowerCase().includes(needle) ||
      (conversation.apartment_name ?? "").toLowerCase().includes(needle) ||
      (conversation.last_message ?? "").toLowerCase().includes(needle)
  );
}

/** Unread conversations first; newest-first order preserved within each group. */
export function sortUnreadFirst(conversations: ConversationWithMeta[]): ConversationWithMeta[] {
  return [
    ...conversations.filter((conversation) => conversation.unread_count > 0),
    ...conversations.filter((conversation) => conversation.unread_count <= 0),
  ];
}

export function getChatRouteParams(conversation: ConversationWithMeta): ChatRouteParams {
  return {
    conversationId: conversation.conversation_key,
    otherUserId: conversation.other_user_id,
    otherUserName: conversation.other_user_name,
    otherUserAvatar: conversation.other_user_avatar ?? "",
    apartmentId: conversation.apartment_id ?? "",
    apartmentTitle: conversation.apartment_name ?? "",
  };
}
