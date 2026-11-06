import type { ConversationContact } from "./conversation-contacts";
import { compareReadTimestamps } from "./notification-read-state";

/** A read response cannot erase an incoming arrival newer than its snapshot.
 * The existing list channel's trailing count/refocus reconciles that race. */
export function applyConversationReadCount<T extends ConversationContact>(contact: T, count: number, through?: string): T {
  const newerArrival = through && contact.lastMessageTime && !contact.lastSenderIsMe &&
    compareReadTimestamps(contact.lastMessageTime, through) < 0;
  const unreadCount = Math.max(0, newerArrival ? Math.max(contact.unreadCount, count) : count);
  return contact.unreadCount === unreadCount && !contact.markedUnread
    ? contact : { ...contact, unreadCount, markedUnread: false };
}
