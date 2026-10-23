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
  /** The inbox list: user-pinned first (newest pin first), then unread first. Archived are left out. */
  inbox: T[];
  /** Archived conversations, in the order given (newest first). */
  archived: T[];
}

/**
 * Orders the non-app-pinned conversations like mobile's `groupConversations`:
 * pinned on top, unread before read, archived moved to their own list.
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
    inbox: [...pinned, ...rest.filter(hasUnreadContact), ...rest.filter((contact) => !hasUnreadContact(contact))],
    archived,
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
