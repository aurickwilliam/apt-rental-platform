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

/** Unread messages, or marked unread by the user. */
export function hasUnread(conversation: ConversationWithMeta): boolean {
  return conversation.unread_count > 0 || conversation.marked_unread;
}

/** Unread conversations first; newest-first order preserved within each group. */
export function sortUnreadFirst(conversations: ConversationWithMeta[]): ConversationWithMeta[] {
  return [
    ...conversations.filter(hasUnread),
    ...conversations.filter((conversation) => !hasUnread(conversation)),
  ];
}

export type ConversationGroups = {
  /** Always-pinned first (e.g. the current landlord), then newest pin first. */
  pinned: ConversationWithMeta[];
  /** Everything else that isn't archived, unread first. */
  others: ConversationWithMeta[];
  /** Archived, newest first. */
  archived: ConversationWithMeta[];
};

/**
 * Splits a list into the Messages groups. A conversation `isAlwaysPinned`
 * matches stays pinned on top even if it was archived.
 */
export function groupConversations(
  conversations: ConversationWithMeta[],
  isAlwaysPinned: (conversation: ConversationWithMeta) => boolean = () => false
): ConversationGroups {
  const alwaysPinned: ConversationWithMeta[] = [];
  const userPinned: ConversationWithMeta[] = [];
  const unpinned: ConversationWithMeta[] = [];
  const archived: ConversationWithMeta[] = [];

  for (const conversation of conversations) {
    if (isAlwaysPinned(conversation)) alwaysPinned.push(conversation);
    else if (conversation.is_archived) archived.push(conversation);
    else if (conversation.is_pinned) userPinned.push(conversation);
    else unpinned.push(conversation);
  }

  userPinned.sort(
    (a, b) => new Date(b.pinned_at ?? 0).getTime() - new Date(a.pinned_at ?? 0).getTime()
  );

  return {
    pinned: [...alwaysPinned, ...userPinned],
    others: sortUnreadFirst(unpinned),
    archived,
  };
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

/** One row of a Messages list. */
export type ConversationListItem =
  | {
      kind: "conversation";
      key: string;
      conversation: ConversationWithMeta;
      /** Pinned by the app (current landlord): Pin/Archive are disabled. */
      isPinLocked: boolean;
    }
  | {
      /** Current landlord before any message: starts the conversation. */
      kind: "landlord-shortcut";
      key: string;
      conversationId: string;
      landlordId: string;
      landlordName: string;
      landlordAvatar: string | null;
      apartmentId: string;
      apartmentName: string;
    }
  | { kind: "separator"; key: "separator" };

export function toConversationItem(
  conversation: ConversationWithMeta,
  isPinLocked = false
): ConversationListItem {
  return { kind: "conversation", key: conversation.conversation_key, conversation, isPinLocked };
}

/**
 * Pinned rows, then a separator, then the rest. No section headers
 * (Messenger-style); archived chats open from the header's archive button.
 */
export function buildConversationListItems({
  pinned,
  others,
}: {
  pinned: ConversationListItem[];
  others: ConversationWithMeta[];
}): ConversationListItem[] {
  const items: ConversationListItem[] = [...pinned];
  if (pinned.length > 0 && others.length > 0) {
    items.push({ kind: "separator", key: "separator" });
  }
  items.push(...others.map((conversation) => toConversationItem(conversation)));
  return items;
}
