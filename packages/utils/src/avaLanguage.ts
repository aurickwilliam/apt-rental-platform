// Language handling for Ava. English is the default; Tagalog is used only when
// the tenant writes in Tagalog. Detection is rule-based and runs on the device
// (the model is also told the language, so its own replies stay consistent).

export type AvaLanguage = 'en' | 'tl';

// Words that are Tagalog and not also common English or place names. Short
// ambiguous ones ("po", "na", "ang") are kept: English text never uses them.
const TAGALOG_WORDS = new Set([
  'ang', 'ng', 'mga', 'sa', 'ako', 'ko', 'mo', 'ka', 'ba', 'po', 'opo', 'oo', 'hindi', 'wala',
  'may', 'mayroon', 'meron', 'malapit', 'malayo', 'gusto', 'hanap', 'hanapin', 'maghanap', 'naghahanap',
  'pwede', 'puwede', 'paano', 'saan', 'ano', 'magkano', 'kailan', 'kung', 'para', 'pero', 'at',
  'lang', 'naman', 'din', 'rin', 'pa', 'na', 'ito', 'iyan', 'iyon', 'yung', 'yong', 'dito', 'doon',
  'mura', 'murang', 'mas', 'pinakamura', 'libo', 'kwarto', 'kuwarto', 'banyo', 'kusina', 'paaralan',
  'eskwelahan', 'ospital', 'palengke', 'simbahan', 'tirahan', 'upa', 'bahay', 'isang', 'dalawang',
  'tatlong', 'apat', 'kahit', 'saan', 'hanggang', 'ipakita', 'iba', 'pang', 'muna', 'salamat',
  'kumusta', 'magandang', 'umaga', 'hapon', 'gabi', 'ilan', 'tayo', 'natin', 'namin', 'nila',
  'akin', 'amin', 'siya', 'sila', 'kayo', 'ikaw', 'bakit', 'nasaan', 'nasa', 'galing', 'papunta',
  'lumipat', 'lilipat', 'titira', 'tumira', 'sakayan', 'alaga', 'aso', 'pusa', 'bata', 'babae',
  'lalaki', 'mag-isa', 'magkasama', 'kasama', 'pamilya', 'trabaho', 'opisina', 'eskuwela', 'kapitbahay',
]);

const WORD_PATTERN = /[a-zñ-]+/g;

/** Counts Tagalog words in a message (0 for empty text). */
function tagalogScore(text: string): { tagalog: number; words: number } {
  const words = text.toLowerCase().match(WORD_PATTERN) ?? [];
  return { tagalog: words.filter((word) => TAGALOG_WORDS.has(word)).length, words: words.length };
}

/**
 * The language of one message, or `null` when it carries no signal (a bare
 * place name or number such as "Malabon" or "2BR"). Ambiguous messages keep the
 * conversation's language instead of flipping it.
 */
export function detectMessageLanguage(text: string): AvaLanguage | null {
  const { tagalog, words } = tagalogScore(text);
  if (words === 0) return null;
  if (tagalog === 0) {
    // Plain English needs a few real words; "Malabon" or "8k" tells us nothing.
    return words >= 3 ? 'en' : null;
  }
  // Taglish with more Tagalog than a stray "po" reads as Tagalog.
  return tagalog / words >= 0.2 || tagalog >= 2 ? 'tl' : 'en';
}

/**
 * The language Ava should answer in: the newest message that carries a signal,
 * English when none does. Looking back over the tenant's messages keeps short
 * follow-ups ("2BR", "mas mura") in the language they started in.
 */
export function detectConversationLanguage(userMessages: string[]): AvaLanguage {
  for (let index = userMessages.length - 1; index >= 0; index -= 1) {
    const language = detectMessageLanguage(userMessages[index]);
    if (language) return language;
  }
  return 'en';
}

const ENGLISH_WORDS = new Set([
  'the', 'is', 'are', 'and', 'to', 'you', 'your', 'for', 'with', 'in', 'of', 'a', 'an', 'i',
  'it', 'that', 'this', 'there', 'here', 'what', 'which', 'any', 'have', 'can', 'will', 'me',
  'my', 'on', 'at', 'or', 'not', 'nothing', 'matches', 'budget', 'try', 'kindly',
]);

/**
 * The language of text Ava is about to show (usually the model's reply), or
 * `null` when unsure. Stricter than `detectMessageLanguage`: only clear
 * Tagalog or clear English counts, because a Tagalog sentence with words
 * outside the word list must not be mistaken for English and thrown away.
 */
export function detectReplyLanguage(text: string): AvaLanguage | null {
  const words = text.toLowerCase().match(WORD_PATTERN) ?? [];
  if (words.length < 3) return null;
  const tagalog = words.filter((word) => TAGALOG_WORDS.has(word)).length;
  if (tagalog >= 2 || (tagalog >= 1 && tagalog / words.length >= 0.25)) return 'tl';
  const english = words.filter((word) => ENGLISH_WORDS.has(word)).length;
  return tagalog === 0 && english >= 2 ? 'en' : null;
}
