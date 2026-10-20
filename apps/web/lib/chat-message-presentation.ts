/** Presentation-only selection; never infers reads from presence or typing. */
export function latestOutgoingMessageId(
  messages: readonly { id: string; sender_id: string; receiver_id: string }[],
  currentUserId: string,
  recipientId: string | null,
): string | null {
  if (!recipientId) return null;
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index];
    if (message.sender_id === currentUserId && message.receiver_id === recipientId) {
      // Include pending/unread rows: an older read must not imply that the
      // newest outgoing message was read. The bubble checks its own is_read.
      return message.id;
    }
  }
  return null;
}
