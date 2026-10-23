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
const EMOJI_FONT_SIZES = [46, 40, 34] as const;

/** True when the text is nothing but emoji and whitespace (mobile's `isEmojiOnly`). */
export function isEmojiOnlyMessage(text: string | null | undefined): boolean {
  const trimmed = text?.trim();
  return Boolean(trimmed) && EMOJI_ONLY.test(trimmed as string);
}

/** Font size in px for an emoji-only message: 46 for one emoji, 40 for two, 34 for three or more (mobile). */
export function emojiMessageFontSize(text: string): number {
  const count = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text.trim())].length;
  return EMOJI_FONT_SIZES[Math.min(count, EMOJI_FONT_SIZES.length) - 1] ?? EMOJI_FONT_SIZES[0];
}
