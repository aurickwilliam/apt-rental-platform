/** Font sizes (px) for an emoji-only chat message: one emoji, two, then three or more. Shared by web and mobile. */
export const EMOJI_MESSAGE_FONT_SIZES = [46, 40, 34] as const;

/** The size for a message made of `count` emoji (grapheme clusters on web, code points on mobile). */
export function emojiFontSizeForCount(count: number): number {
  const index = Math.min(Math.max(count, 1), EMOJI_MESSAGE_FONT_SIZES.length) - 1;
  return EMOJI_MESSAGE_FONT_SIZES[index];
}

/**
 * One list both platforms' emoji-only detectors are tested against (web uses
 * Unicode property escapes, mobile `emoji-regex-xs`), so they cannot drift apart.
 */
export const EMOJI_ONLY_SAMPLES = {
  emojiOnly: ["😂", " 👍🏽 ", "👨‍👩‍👧", "🇵🇭", "😂😂", "😂 😂 😂"],
  notEmojiOnly: ["", "   ", "hi 😂", "123", "#", "ok"],
} as const;
