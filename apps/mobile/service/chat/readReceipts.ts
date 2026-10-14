interface ReadReceiptMessage {
  id: string;
  isSent: boolean;
  isRead?: boolean;
  isPending?: boolean;
  createdAt: string;
}

/**
 * The sent message to show "Seen" under (Messenger style): the newest one the
 * other person has read. Null when they have replied since (their reply shows
 * they saw it) or have read none. `messages` is newest-first.
 */
export function getSeenMessageId(messages: readonly ReadReceiptMessage[]): string | null {
  for (const message of messages) {
    if (!message.isSent) return null;
    if (message.isRead) return message.id;
  }
  return null;
}

/** Marks sent messages up to `readUpTo` (a message's created_at) as read. */
export function markSentReadUpTo<T extends ReadReceiptMessage>(
  messages: readonly T[],
  readUpTo: string
): T[] {
  const limit = new Date(readUpTo).getTime();
  if (Number.isNaN(limit)) return [...messages];
  return messages.map((message) =>
    message.isSent &&
    !message.isRead &&
    !message.isPending &&
    new Date(message.createdAt).getTime() <= limit
      ? { ...message, isRead: true }
      : message
  );
}

/** created_at of the newest message from the other person (what the reader saw). */
export function getNewestReceivedCreatedAt(
  messages: readonly ReadReceiptMessage[]
): string | null {
  let newest: string | null = null;
  for (const message of messages) {
    if (message.isSent) continue;
    if (newest === null || new Date(message.createdAt) > new Date(newest)) {
      newest = message.createdAt;
    }
  }
  return newest;
}
