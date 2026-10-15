/**
 * Reaction emoji sets. The vocabulary mirrors
 * `apps/mobile/app/chat/components/reactionEmojis.ts` so both platforms offer
 * the same reactions; the `keywords` metadata below is web-only, so the picker
 * can search by name instead of by raw emoji character.
 */

/** Long-press / hover strip set. Double-tap always reacts with HEART_REACTION. */
export const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍"] as const;

export const HEART_REACTION = "❤️";

export interface ReactionEmoji {
  emoji: string;
  /** Lowercase search terms. Matched as a substring, so "smi" finds "smile". */
  keywords: readonly string[];
}

/**
 * Full-picker catalogue. Grouped so the picker can render compact sections
 * without pulling in a heavyweight emoji dependency. Keywords are deliberately
 * coarse — enough to make the search box useful, not a full emoji-name index.
 */
export const EMOJI_GROUPS: { label: string; emojis: ReactionEmoji[] }[] = [
  {
    label: "Smileys",
    emojis: [
      { emoji: "😀", keywords: ["grinning", "smile", "happy"] },
      { emoji: "😃", keywords: ["smile", "happy"] },
      { emoji: "😄", keywords: ["smile", "happy", "laugh"] },
      { emoji: "😁", keywords: ["grin", "happy"] },
      { emoji: "😆", keywords: ["laugh", "lol", "happy"] },
      { emoji: "😅", keywords: ["sweat", "laugh", "relief"] },
      { emoji: "😂", keywords: ["joy", "tears", "lol", "laugh"] },
      { emoji: "🤣", keywords: ["rolling", "laugh", "floor"] },
      { emoji: "😊", keywords: ["blush", "happy", "warm"] },
      { emoji: "😇", keywords: ["angel", "innocent"] },
      { emoji: "🙂", keywords: ["smile", "slight"] },
      { emoji: "🙃", keywords: ["upside", "irony", "sarcasm"] },
      { emoji: "😉", keywords: ["wink"] },
      { emoji: "😌", keywords: ["relieved", "calm"] },
      { emoji: "😍", keywords: ["heart eyes", "love", "crush"] },
      { emoji: "🥰", keywords: ["smiling", "love", "hearts"] },
      { emoji: "😘", keywords: ["kiss", "love", "flirt"] },
      { emoji: "😗", keywords: ["kiss", "whistle"] },
      { emoji: "😚", keywords: ["kiss", "love"] },
      { emoji: "😙", keywords: ["kiss", "whistle"] },
      { emoji: "😋", keywords: ["yum", "tongue", "delicious"] },
      { emoji: "😛", keywords: ["tongue", "playful"] },
      { emoji: "😜", keywords: ["wink", "tongue", "playful"] },
      { emoji: "🤪", keywords: ["goofy", "crazy", "party"] },
      { emoji: "😝", keywords: ["tongue", "playful"] },
      { emoji: "🤗", keywords: ["hug", "huggy", "warm"] },
      { emoji: "🤭", keywords: ["hand over mouth", "giggle"] },
      { emoji: "🤫", keywords: ["shush", "quiet", "secret"] },
      { emoji: "🤔", keywords: ["thinking", "hmm", "consider"] },
      { emoji: "🤐", keywords: ["zipper", "quiet", "secret"] },
      { emoji: "😐", keywords: ["neutral", "blank"] },
      { emoji: "😑", keywords: ["expressionless", "unimpressed"] },
      { emoji: "😶", keywords: ["no mouth", "silent", "speechless"] },
      { emoji: "😏", keywords: ["smirk", "smug"] },
      { emoji: "😒", keywords: ["unamused", "meh"] },
      { emoji: "🙄", keywords: ["roll eyes", "annoyed"] },
      { emoji: "😬", keywords: ["grimace", "awkward", "eek"] },
      { emoji: "😮", keywords: ["open mouth", "surprise", "wow", "hmm"] },
      { emoji: "😯", keywords: ["hushed", "surprise"] },
      { emoji: "😴", keywords: ["sleep", "zzz", "tired"] },
      { emoji: "😪", keywords: ["sleepy", "drowsy"] },
      { emoji: "😵", keywords: ["dizzy", "knocked out"] },
      { emoji: "🤯", keywords: ["mind blown", "shocked", "wow"] },
      { emoji: "🥱", keywords: ["yawning", "bored", "tired"] },
      { emoji: "😷", keywords: ["mask", "sick", "ill"] },
      { emoji: "🤒", keywords: ["sick", "fever", "ill"] },
      { emoji: "🤕", keywords: ["sick", "headache", "bandage"] },
      { emoji: "🥴", keywords: ["woozy", "dizzy", "tipsy"] },
      { emoji: "😢", keywords: ["cry", "sad", "tear"] },
      { emoji: "😭", keywords: ["sob", "cry", "sad", "bawling"] },
      { emoji: "😤", keywords: ["triumph", "proud", "steam"] },
      { emoji: "😠", keywords: ["angry", "mad"] },
      { emoji: "😡", keywords: ["angry", "rage", "mad", "pouting"] },
      { emoji: "🤬", keywords: ["cursing", "swearing", "angry", "symbols"] },
      { emoji: "😈", keywords: ["devil", "evil", "imp"] },
      { emoji: "💀", keywords: ["skull", "dead", "deadline"] },
      { emoji: "🤡", keywords: ["clown", "circus"] },
      { emoji: "👻", keywords: ["ghost", "halloween", "boo"] },
      { emoji: "👽", keywords: ["alien", "ufo", "extraterrestrial"] },
      { emoji: "🤖", keywords: ["robot", "bot", "ai"] },
    ],
  },
  {
    label: "Gestures",
    emojis: [
      { emoji: "👍", keywords: ["thumbs up", "like", "approve", "yes"] },
      { emoji: "👎", keywords: ["thumbs down", "dislike", "no"] },
      { emoji: "👌", keywords: ["ok", "perfect", "hand"] },
      { emoji: "✌️", keywords: ["peace", "victory", "two"] },
      { emoji: "🤞", keywords: ["fingers crossed", "luck", "hope"] },
      { emoji: "🤟", keywords: ["love you", "ily", "rock on"] },
      { emoji: "🤘", keywords: ["rock", "horns", "metal"] },
      { emoji: "🤙", keywords: ["call me", "shaka", "hang loose"] },
      { emoji: "👈", keywords: ["point left", "back"] },
      { emoji: "👉", keywords: ["point right", "this way"] },
      { emoji: "👆", keywords: ["point up", "one"] },
      { emoji: "👇", keywords: ["point down", "below"] },
      { emoji: "☝️", keywords: ["point up", "one", "index"] },
      { emoji: "👋", keywords: ["wave", "hello", "goodbye"] },
      { emoji: "🤚", keywords: ["raised back of hand", "stop"] },
      { emoji: "🖐️", keywords: ["hand", "raised", "five"] },
      { emoji: "✋", keywords: ["raised hand", "stop", "high five"] },
      { emoji: "🖖", keywords: ["vulcan", "spock", "star trek"] },
      { emoji: "👏", keywords: ["clap", "applause", "well done", "bravo"] },
      { emoji: "🙌", keywords: ["raised hands", "celebrate", "praise", "hooray"] },
      { emoji: "🤝", keywords: ["handshake", "deal", "agreement"] },
      { emoji: "🙏", keywords: ["pray", "please", "thanks", "thank you"] },
      { emoji: "✍️", keywords: ["write", "signature", "pen"] },
      { emoji: "💅", keywords: ["nail", "manicure", "polish"] },
      { emoji: "🤳", keywords: ["selfie", "camera", "photo"] },
      { emoji: "💪", keywords: ["muscle", "strong", "flex", "stronger"] },
      { emoji: "🦾", keywords: ["mechanical arm", "strong", "bionic"] },
      { emoji: "🧠", keywords: ["brain", "smart", "think"] },
      { emoji: "👀", keywords: ["eyes", "look", "watching", "seen"] },
      { emoji: "🫶", keywords: ["heart hands", "love", "care"] },
    ],
  },
  {
    label: "Hearts & symbols",
    emojis: [
      { emoji: "❤️", keywords: ["heart", "love", "red"] },
      { emoji: "🧡", keywords: ["heart", "orange"] },
      { emoji: "💛", keywords: ["heart", "yellow"] },
      { emoji: "💚", keywords: ["heart", "green"] },
      { emoji: "💙", keywords: ["heart", "blue"] },
      { emoji: "💜", keywords: ["heart", "purple"] },
      { emoji: "🖤", keywords: ["heart", "black"] },
      { emoji: "🤍", keywords: ["heart", "white"] },
      { emoji: "🤎", keywords: ["heart", "brown"] },
      { emoji: "💔", keywords: ["broken heart", "sad", "breakup"] },
      { emoji: "❣️", keywords: ["heart exclamation", "love"] },
      { emoji: "💕", keywords: ["two hearts", "love", "affection"] },
      { emoji: "💞", keywords: ["revolving hearts", "love"] },
      { emoji: "💓", keywords: ["beating heart", "love", "pulse"] },
      { emoji: "💗", keywords: ["growing heart", "love"] },
      { emoji: "💖", keywords: ["sparkling heart", "love"] },
      { emoji: "💘", keywords: ["heart arrow", "cupid", "love"] },
      { emoji: "💝", keywords: ["heart ribbon", "gift", "love"] },
      { emoji: "💟", keywords: ["heart decoration", "love"] },
      { emoji: "✨", keywords: ["sparkles", "shiny", "magic", "new"] },
      { emoji: "⭐", keywords: ["star", "favourite", "rate"] },
      { emoji: "🌟", keywords: ["star", "glowing", "shine"] },
      { emoji: "💫", keywords: ["dizzy", "star", "shooting"] },
      { emoji: "🔥", keywords: ["fire", "hot", "lit", "burn"] },
      { emoji: "💯", keywords: ["100", "perfect", "full marks", "score"] },
      { emoji: "✅", keywords: ["check", "done", "tick", "complete", "yes"] },
      { emoji: "❌", keywords: ["cross", "wrong", "no", "cancel"] },
      { emoji: "❓", keywords: ["question", "help", "ask"] },
      { emoji: "❗", keywords: ["exclamation", "important", "alert"] },
      { emoji: "⚡", keywords: ["lightning", "fast", "power", "urgent"] },
    ],
  },
  {
    label: "Objects",
    emojis: [
      { emoji: "🎉", keywords: ["party", "celebrate", "tada", "congrats"] },
      { emoji: "🎊", keywords: ["party", "celebrate", "confetti"] },
      { emoji: "🎁", keywords: ["gift", "present", "birthday"] },
      { emoji: "🎈", keywords: ["balloon", "party"] },
      { emoji: "🏆", keywords: ["trophy", "win", "award", "champion"] },
      { emoji: "🥇", keywords: ["gold medal", "first place", "win"] },
      { emoji: "⚽", keywords: ["soccer", "football", "ball"] },
      { emoji: "🏀", keywords: ["basketball", "ball"] },
      { emoji: "🚗", keywords: ["car", "vehicle", "drive", "parking"] },
      { emoji: "🏠", keywords: ["house", "home", "rent", "apartment"] },
      { emoji: "📱", keywords: ["phone", "mobile", "device"] },
      { emoji: "💻", keywords: ["laptop", "computer", "work"] },
      { emoji: "⌚", keywords: ["watch", "time", "wrist"] },
      { emoji: "📷", keywords: ["camera", "photo", "picture"] },
      { emoji: "💰", keywords: ["money bag", "cash", "rich", "payment"] },
      { emoji: "💳", keywords: ["credit card", "payment", "pay", "billing"] },
      { emoji: "📦", keywords: ["package", "box", "parcel", "delivery"] },
      { emoji: "🔧", keywords: ["wrench", "tools", "repair", "maintenance"] },
      { emoji: "🔨", keywords: ["hammer", "tools", "build", "maintenance"] },
      { emoji: "🧹", keywords: ["broom", "clean", "cleaning"] },
      { emoji: "💡", keywords: ["lightbulb", "idea", "tip", "insight"] },
      { emoji: "🔑", keywords: ["key", "access", "lock", "keys"] },
      { emoji: "📌", keywords: ["pushpin", "pin", "important"] },
      { emoji: "📎", keywords: ["paperclip", "attach", "attachment", "file"] },
      { emoji: "⏰", keywords: ["alarm clock", "time", "reminder", "deadline"] },
      { emoji: "📅", keywords: ["calendar", "date", "schedule", "appointment"] },
      { emoji: "🗓️", keywords: ["calendar", "date", "schedule", "spiral"] },
      { emoji: "💎", keywords: ["gem", "diamond", "jewel", "valuable"] },
      { emoji: "🧪", keywords: ["test tube", "experiment", "lab"] },
      { emoji: "🌈", keywords: ["rainbow", "pride", "colour"] },
    ],
  },
];

/** Flattens the catalogue for search. */
export const ALL_REACTION_EMOJIS: ReactionEmoji[] = EMOJI_GROUPS.flatMap(
  (group) => group.emojis
);

/**
 * Case-insensitive substring match over each emoji's keywords and the emoji
 * itself. Substring (not prefix) matching so "art" finds "heart".
 */
export function searchReactionEmojis(query: string): ReactionEmoji[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return ALL_REACTION_EMOJIS.filter(
    (item) =>
      item.emoji.includes(q) ||
      item.keywords.some((keyword) => keyword.includes(q))
  );
}
