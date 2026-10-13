/**
 * Reaction emoji sets, mirroring `apps/mobile/app/chat/components/reactionEmojis.ts`
 * so both platforms offer the same vocabulary.
 */

/** Long-press / hover strip set. Double-tap always reacts with HEART_REACTION. */
export const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍"] as const;

export const HEART_REACTION = "❤️";

/**
 * Full-picker catalogue. Grouped so the picker can render compact sections
 * without pulling in a heavyweight emoji dependency.
 */
export const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: "Smileys",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
      "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😚", "😙",
      "😋", "😛", "😜", "🤪", "😝", "🤗", "🤭", "🤫", "🤔", "🤐",
      "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😮", "😯", "😴",
      "😪", "😵", "🤯", "🥱", "😷", "🤒", "🤕", "🥴", "😢", "😭",
      "😤", "😠", "😡", "🤬", "😈", "💀", "🤡", "👻", "👽", "🤖",
    ],
  },
  {
    label: "Gestures",
    emojis: [
      "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉",
      "👆", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌",
      "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🧠", "👀", "🫶",
    ],
  },
  {
    label: "Hearts & symbols",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "✨",
      "⭐", "🌟", "💫", "🔥", "💯", "✅", "❌", "❓", "❗", "⚡",
    ],
  },
  {
    label: "Objects",
    emojis: [
      "🎉", "🎊", "🎁", "🎈", "🏆", "🥇", "⚽", "🏀", "🚗", "🏠",
      "📱", "💻", "⌚", "📷", "💰", "💳", "📦", "🔧", "🔨", "🧹",
      "💡", "🔑", "📌", "📎", "⏰", "📅", "🗓️", "💎", "🧪", "🌈",
    ],
  },
];