/** A row of the `get_portal_conversations` RPC (the fields the web lists use). */
export interface PortalConversationRow {
  other_user_id: string;
  other_user_name: string | null;
  other_user_avatar: string | null;
  apartment_id: string | null;
  apartment_name: string | null;
  unread_count: number | null;
  last_message?: string | null;
  last_message_time?: string | null;
  last_message_type?: string | null;
}

/** Sidebar contact, structurally identical to both portals' `Contact`. */
export interface ConversationContact {
  id: string;
  conversationKey: string;
  name: string;
  avatar: string;
  apartment: string;
  apartmentId: string | null;
  unreadCount: number;
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  lastMessageType?: string | null;
}

interface BuildPortalContactsOptions {
  /** Conversations from `get_portal_conversations`, newest first. */
  rows: PortalConversationRow[];
  /** Pinned contacts (active tenancies), shown even before any message. */
  pinned: ConversationContact[];
  /** Subtitle for a conversation outside the pinned group. */
  describeApartment: (apartmentName: string | null) => string;
}

/**
 * Contact photo URL, or "" so `UserAvatar` shows initials. Never a
 * third-party placeholder: those would send user IDs off-site.
 */
export function resolveContactAvatar(avatarUrl: string | null | undefined): string {
  return avatarUrl?.trim() ?? "";
}

/** Web conversation key: `{otherUserId}:{apartmentId|'none'}` (see ARCHITECTURE.md §8.1). */
export function getContactConversationKey(
  otherUserId: string,
  apartmentId: string | null
): string {
  return `${otherUserId}:${apartmentId ?? "none"}`;
}

/**
 * Deep-link target for `?conversation=`: the requested conversation when the
 * portal's lists contain it, otherwise the list default (first pinned, then
 * first other). The function never invents a conversation, so callers know a
 * returned contact whose key differs from `requestedKey` is the fallback.
 */
export function selectPortalConversation<C extends { conversationKey: string }>(
  pinned: readonly C[],
  others: readonly C[],
  requestedKey: string | null | undefined,
): C | null {
  const match = requestedKey
    ? [...pinned, ...others].find((contact) => contact.conversationKey === requestedKey)
    : undefined;
  return match ?? pinned[0] ?? others[0] ?? null;
}

/**
 * Splits one portal's conversations into the pinned group (with unread
 * counts filled in) and every other conversation, newest first.
 */
export function buildPortalContacts({
  rows,
  pinned,
  describeApartment,
}: BuildPortalContactsOptions): {
  pinned: ConversationContact[];
  others: ConversationContact[];
} {
  const unreadByKey = new Map<string, number>();
  const latestByKey = new Map<string, Pick<ConversationContact, "lastMessage" | "lastMessageTime" | "lastMessageType">>();
  for (const row of rows) {
    latestByKey.set(getContactConversationKey(row.other_user_id, row.apartment_id), {
      lastMessage: row.last_message,
      lastMessageTime: row.last_message_time,
      lastMessageType: row.last_message_type,
    });
    unreadByKey.set(
      getContactConversationKey(row.other_user_id, row.apartment_id),
      row.unread_count ?? 0
    );
  }

  const pinnedKeys = new Set(pinned.map((contact) => contact.conversationKey));

  const others = rows
    .filter(
      (row) =>
        !pinnedKeys.has(getContactConversationKey(row.other_user_id, row.apartment_id))
    )
    .map((row) => ({
      id: row.other_user_id,
      conversationKey: getContactConversationKey(row.other_user_id, row.apartment_id),
      name: row.other_user_name?.trim() ?? "",
      avatar: resolveContactAvatar(row.other_user_avatar),
      apartment: describeApartment(row.apartment_name),
      apartmentId: row.apartment_id,
      unreadCount: row.unread_count ?? 0,
      lastMessage: row.last_message,
      lastMessageTime: row.last_message_time,
      lastMessageType: row.last_message_type,
    }));

  return {
    pinned: pinned.map((contact) => ({
      ...contact,
      unreadCount: unreadByKey.get(contact.conversationKey) ?? 0,
      ...latestByKey.get(contact.conversationKey),
    })),
    others,
  };
}
