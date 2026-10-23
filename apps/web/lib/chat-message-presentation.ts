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

const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|[‍️⃣\u{1F3FB}-\u{1F3FF}\u{E0020}-\u{E007F}]|\s)+$/u;

/** True when the text is nothing but emoji and whitespace (mobile's `isEmojiOnly`). */
export function isEmojiOnlyMessage(text: string | null | undefined): boolean {
  const trimmed = text?.trim();
  return Boolean(trimmed) && EMOJI_ONLY.test(trimmed as string);
}

/** How many emoji a message holds, counting a flag or family as one (grapheme clusters). */
export function emojiCount(text: string): number {
  return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text.trim())].length;
}

/** "Oct 20, 2026 at 3:15 PM" — the timestamp in a message's action menu (same wording as mobile's hold menu). */
export function formatMessageMenuDate(createdAt: string): string {
  const date = new Date(createdAt);
  if (!Number.isFinite(date.getTime())) return "";
  return `${date.toLocaleDateString([], { dateStyle: "medium" })} at ${date.toLocaleTimeString([], { timeStyle: "short" })}`;
}

/** One-line text for a quoted message in a reply card (mobile's `getReplySnippet`): the text, else Photo / Video / GIF / Document. */
export function replyQuoteSnippet(reply: { message?: string | null; messageType?: string | null }): string {
  const text = reply.message?.trim();
  if (text) return text.length > 90 ? `${text.slice(0, 90)}…` : text;
  switch (reply.messageType) {
    case "image": return "Photo";
    case "video": return "Video";
    case "gif": return "GIF";
    case "file": return "Document";
    default: return "";
  }
}

/**
 * The preview line of a conversation row (mobile's `MessageCard`): the text,
 * else "Sent a photo" / "Sent a video" / "Sent a GIF" / "Sent a document". When
 * you sent the latest message it reads "You: text" or "You sent a photo".
 */
export function conversationPreview(contact: {
  lastMessage?: string | null;
  lastMessageType?: string | null;
  lastSenderIsMe?: boolean;
}): string | null {
  const mine = contact.lastSenderIsMe === true;
  const text = contact.lastMessage?.trim();
  if (text) return mine ? `You: ${text}` : text;
  const kind = { image: "photo", video: "video", gif: "GIF", file: "document" }[contact.lastMessageType ?? ""];
  if (!kind) return null;
  return mine ? `You sent a ${kind}` : `Sent a ${kind}`;
}
