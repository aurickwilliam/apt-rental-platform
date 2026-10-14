interface GroupedMessage {
  isSent: boolean;
}

/**
 * Whether a received message closes its run of consecutive received messages,
 * so the sender's avatar sits beside it (Messenger style). `messages` is
 * newest-first, as the inverted chat list renders it.
 */
export function showsSenderAvatar(messages: readonly GroupedMessage[], index: number): boolean {
  const message = messages[index];
  if (!message || message.isSent) return false;
  const newer = messages[index - 1];
  return !newer || newer.isSent;
}

/** Width reserved left of received bubbles for the avatar: `w-8` + `mr-2`. */
export const SENDER_AVATAR_GUTTER = 40;
