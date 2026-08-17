import type { Message } from './chatService';

export type ChatMessagePlacement = 'newest' | 'older';

/**
 * Merges a page or realtime arrival without changing the server-provided order
 * of either collection. Newest records belong at the inverted list's index 0;
 * older records belong at its history edge.
 */
export function mergeChatMessages(
  current: readonly Message[],
  incoming: readonly Message[],
  placement: ChatMessagePlacement
): Message[] {
  const currentIds = new Set(current.map((message) => message.id));
  const uniqueIncoming: Message[] = [];

  for (const message of incoming) {
    if (currentIds.has(message.id)) continue;

    currentIds.add(message.id);
    uniqueIncoming.push(message);
  }

  return placement === 'newest'
    ? [...uniqueIncoming, ...current]
    : [...current, ...uniqueIncoming];
}
