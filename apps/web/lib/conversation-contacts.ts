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
  /** Who sent the latest message (`get_portal_conversations.last_sender_id`). */
  last_sender_id?: string | null;
  /** Per-user list state, written only through `set_conversation_preference`. */
  is_pinned?: boolean | null;
  pinned_at?: string | null;
  is_archived?: boolean | null;
  is_muted?: boolean | null;
  marked_unread?: boolean | null;
  blocked_by_me?: boolean | null;
  in_active_tenancy?: boolean | null;
}

/** The per-user list state shown and changed from a row's menu. */
export interface ConversationPreferences {
  isPinned: boolean;
  pinnedAt: string | null;
  isArchived: boolean;
  isMuted: boolean;
  markedUnread: boolean;
  blockedByMe: boolean;
  inActiveTenancy: boolean;
}

export function preferencesFromRow(row: PortalConversationRow): ConversationPreferences {
  return {
    isPinned: row.is_pinned === true,
    pinnedAt: row.pinned_at ?? null,
    isArchived: row.is_archived === true,
    isMuted: row.is_muted === true,
    markedUnread: row.marked_unread === true,
    blockedByMe: row.blocked_by_me === true,
    inActiveTenancy: row.in_active_tenancy === true,
  };
}

/** Sidebar contact, structurally identical to both portals' `Contact`. */
export interface ConversationContact extends Partial<ConversationPreferences> {
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
  /** The signed-in user sent the latest message (shown as "You: …"). */
  lastSenderIsMe?: boolean;
}

interface BuildPortalContactsOptions {
  /** Conversations from `get_portal_conversations`, newest first. */
  rows: PortalConversationRow[];
  /** The signed-in user's internal `users.id`, to tell who sent the latest message. */
  currentUserId: string;
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
  currentUserId,
  pinned,
  describeApartment,
}: BuildPortalContactsOptions): {
  pinned: ConversationContact[];
  others: ConversationContact[];
} {
  const unreadByKey = new Map<string, number>();
  const latestByKey = new Map<string, Pick<ConversationContact, "lastMessage" | "lastMessageTime" | "lastMessageType" | "lastSenderIsMe" | keyof ConversationPreferences>>();
  for (const row of rows) {
    latestByKey.set(getContactConversationKey(row.other_user_id, row.apartment_id), {
      lastMessage: row.last_message,
      lastMessageTime: row.last_message_time,
      lastMessageType: row.last_message_type,
      lastSenderIsMe: Boolean(row.last_sender_id) && row.last_sender_id === currentUserId,
      ...preferencesFromRow(row),
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
      lastSenderIsMe: Boolean(row.last_sender_id) && row.last_sender_id === currentUserId,
      ...preferencesFromRow(row),
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
