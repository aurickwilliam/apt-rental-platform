import type { ConversationContact, ConversationPreferences } from "./conversation-contacts";

/** Unread messages, or marked unread by the user (mobile's `hasUnread`). */
export function hasUnreadContact(contact: Pick<ConversationContact, "unreadCount" | "markedUnread">): boolean {
  return contact.unreadCount > 0 || contact.markedUnread === true;
}

export type ConversationPreferenceChange = Partial<Pick<ConversationPreferences, "isPinned" | "isArchived" | "isMuted" | "markedUnread">>;

/** Applies a preference change to a contact the way the database will record it. */
export function applyPreferenceChange<T extends ConversationContact>(contact: T, change: ConversationPreferenceChange): T {
  const next: T = { ...contact, ...change };
  if (change.isPinned !== undefined) next.pinnedAt = change.isPinned ? new Date().toISOString() : null;
  return next;
}

export interface ArrangedContacts<T extends ConversationContact> {
  /** The inbox list: user-pinned first (newest pin first), then newest message first. Archived are left out. */
  inbox: T[];
  /** Archived conversations, newest message first. */
  archived: T[];
}

const messageTime = (contact: ConversationContact) => {
  const time = contact.lastMessageTime ? new Date(contact.lastMessageTime).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

/** Newest message first; conversations with no messages sink. Equal times keep their order. */
const byNewestMessage = (a: ConversationContact, b: ConversationContact) => messageTime(b) - messageTime(a);

/**
 * Orders the non-app-pinned conversations like an inbox: pinned on top (newest
 * pin first), everything else by its latest message, and archived chats moved to
 * their own list. A message you send or receive moves its row to the top of the
 * unpinned group, behind any pinned rows.
 */
export function arrangeContacts<T extends ConversationContact>(contacts: readonly T[]): ArrangedContacts<T> {
  const archived: T[] = [];
  const pinned: T[] = [];
  const rest: T[] = [];
  for (const contact of contacts) {
    if (contact.isArchived) archived.push(contact);
    else if (contact.isPinned) pinned.push(contact);
    else rest.push(contact);
  }
  pinned.sort((a, b) => new Date(b.pinnedAt ?? 0).getTime() - new Date(a.pinnedAt ?? 0).getTime());
  return {
    inbox: [...pinned, ...[...rest].sort(byNewestMessage)],
    archived: [...archived].sort(byNewestMessage),
  };
}

/** The newest message of a conversation, from a `chat` insert. */
export interface LatestMessage {
  message: string | null;
  messageType: string | null;
  createdAt: string;
  /** Sent by the signed-in user. */
  fromMe: boolean;
}

/**
 * Updates a row for a new message: the preview, its time and sender, and (for a
 * message you received in a chat you aren't viewing) the unread count.
 */
export function applyLatestMessage<T extends ConversationContact>(contact: T, latest: LatestMessage, countAsUnread: boolean): T {
  return {
    ...contact,
    lastMessage: latest.message,
    lastMessageType: latest.messageType,
    lastMessageTime: latest.createdAt,
    lastSenderIsMe: latest.fromMe,
    unreadCount: countAsUnread ? contact.unreadCount + 1 : contact.unreadCount,
  };
}

export type ConversationMenuAction =
  | "togglePin"
  | "toggleArchive"
  | "toggleRead"
  | "viewApartment"
  | "toggleMute"
  | "report"
  | "toggleBlock";

export interface ConversationMenuItem {
  action: ConversationMenuAction;
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  /** Why an item is unavailable. */
  note?: string;
}

const firstName = (name: string) => name.split(" ")[0] || "this person";

/**
 * The options in a row's menu (mobile's `ConversationMoreSheet`). "View
 * profile" is mobile-only until the web has a profile page. `pinLocked` rows
 * are pinned by the app (the current landlord / active tenants).
 */
export function getConversationMenuItems(contact: ConversationContact, pinLocked: boolean): ConversationMenuItem[] {
  const name = firstName(contact.name);
  const pinned = pinLocked || contact.isPinned === true;
  const archived = contact.isArchived === true && !pinLocked;

  return [
    pinned
      ? { action: "togglePin", label: "Unpin", disabled: pinLocked }
      : { action: "togglePin", label: "Pin" },
    archived
      ? { action: "toggleArchive", label: "Unarchive" }
      : { action: "toggleArchive", label: "Archive", disabled: pinLocked },
    hasUnreadContact(contact)
      ? { action: "toggleRead", label: "Mark as read" }
      : { action: "toggleRead", label: "Mark as unread" },
    ...(contact.apartmentId ? [{ action: "viewApartment", label: "View apartment" } as const] : []),
    contact.isMuted
      ? { action: "toggleMute", label: "Unmute notifications" }
      : { action: "toggleMute", label: "Mute notifications" },
    { action: "report", label: `Report ${name}`, destructive: true },
    contact.blockedByMe
      ? { action: "toggleBlock", label: `Unblock ${name}` }
      : contact.inActiveTenancy
        ? {
            action: "toggleBlock",
            label: `Block ${name}`,
            destructive: true,
            disabled: true,
            note: "You can block after your tenancy ends. Report or mute instead.",
          }
        : { action: "toggleBlock", label: `Block ${name}`, destructive: true },
  ];
}
