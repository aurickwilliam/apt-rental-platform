/** A row of the `get_portal_conversations` RPC (the fields the web lists use). */
export interface PortalConversationRow {
  other_user_id: string;
  other_user_name: string | null;
  other_user_avatar: string | null;
  apartment_id: string | null;
  apartment_name: string | null;
  unread_count: number | null;
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
  for (const row of rows) {
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
    }));

  return {
    pinned: pinned.map((contact) => ({
      ...contact,
      unreadCount: unreadByKey.get(contact.conversationKey) ?? 0,
    })),
    others,
  };
}
