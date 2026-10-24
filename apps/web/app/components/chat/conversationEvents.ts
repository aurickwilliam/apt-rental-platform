/**
 * Pure reducers for the conversation views' realtime pipeline. They keep the
 * message list deduplicated, chronologically ordered, and merge-safe against
 * refreshes that raced a newer Realtime event.
 */

import type { ChatMessage } from "./types";

/** True for bubbles that only exist locally until the insert confirms. */
export function isOptimisticMessage(message: ChatMessage): boolean {
  return message.isPending === true || message.id.startsWith("temp-");
}

/** Oldest-first comparator; ids break ties so the order is deterministic. */
export function compareChatMessages(a: ChatMessage, b: ChatMessage): number {
  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1;
  if (a.id === b.id) return 0;
  return a.id < b.id ? -1 : 1;
}

/**
 * Confirmed rows in chronological order, optimistic rows pinned to the
 * bottom: their server timestamps don't exist yet, so a client clock (or a
 * peer whose clock runs ahead) must never re-sort a bubble mid-send.
 */
function arrangeMessages(rows: ChatMessage[]): ChatMessage[] {
  const confirmed = rows.filter((message) => !isOptimisticMessage(message));
  const optimistic = rows.filter(isOptimisticMessage);
  confirmed.sort(compareChatMessages);
  return optimistic.length > 0 ? [...confirmed, ...optimistic] : confirmed;
}

/**
 * Merges one incoming Realtime row: deduplicated by id, inserted at its
 * chronological position, and normalized so a payload without the joined
 * `reactions` field still renders. Returns the same array when the id is
 * already present, so a double delivery never re-renders the thread.
 */
export function mergeIncomingMessage(
  prev: ChatMessage[],
  incoming: ChatMessage
): ChatMessage[] {
  if (prev.some((message) => message.id === incoming.id)) return prev;

  const normalized: ChatMessage = {
    ...incoming,
    reactions: Array.isArray(incoming.reactions) ? incoming.reactions : [],
  };
  return arrangeMessages([...prev, normalized]);
}

/**
 * Merges a server page (initial load, reconnect/refocus resync) into the rows
 * already held: fetched rows win for the ids they contain, while rows the
 * fetch didn't see — a newer Realtime arrival, an older history page, a send
 * still in flight — are preserved. A stale read can therefore never drop a
 * newer message.
 */
export function reconcileMessages(
  prev: ChatMessage[],
  fetched: ChatMessage[]
): ChatMessage[] {
  const fetchedById = new Map(fetched.map((message) => [message.id, message]));
  const held = prev.filter((message) => !fetchedById.has(message.id));
  const merged = arrangeMessages([...held, ...fetched]);

  const unchanged =
    merged.length === prev.length &&
    merged.every((message, index) => message === prev[index]);
  return unchanged ? prev : merged;
}

/** Patches the read state of one sent message (Realtime UPDATE on `chat`). */
export function applyReadReceipt(
  prev: ChatMessage[],
  receipt: Pick<ChatMessage, "id" | "is_read" | "read_at">
): ChatMessage[] {
  const index = prev.findIndex((message) => message.id === receipt.id);
  if (index === -1) return prev;

  const current = prev[index];
  const readAt = receipt.read_at ?? current.read_at;
  if (current.is_read === receipt.is_read && current.read_at === readAt) {
    return prev;
  }

  const next = [...prev];
  next[index] = { ...current, is_read: receipt.is_read, read_at: readAt };
  return next;
}

/**
 * Drops an unsent message and marks replies that quoted it as unavailable
 * (mobile's unsend does the same). Returns the same array when the id isn't
 * loaded, so a delete for another thread never re-renders this one.
 */
export function removeMessage(prev: ChatMessage[], messageId: string): ChatMessage[] {
  if (!prev.some((message) => message.id === messageId)) return prev;
  return prev
    .filter((message) => message.id !== messageId)
    .map((message) =>
      message.replyTo?.id === messageId || message.reply_to === messageId
        ? { ...message, replyTo: null, replyDeleted: true }
        : message
    );
}
