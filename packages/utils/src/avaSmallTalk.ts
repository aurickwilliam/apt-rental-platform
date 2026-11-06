// Small talk Ava answers herself, with a little personality, and then steers
// back to apartments. Obvious cases (hello, "have you eaten?", thanks, who are
// you) are recognised on the device, so they cost no model call and never run a
// leftover search. Anything else off-topic is answered by the model.

import { countAiSearchFilters, parseSearchKeywords } from './aiSearch';

export type AvaSmallTalkKind = 'greeting' | 'howAreYou' | 'thanks' | 'who' | 'bye';

const MAX_WORDS = 8;

const PATTERNS: { kind: AvaSmallTalkKind; pattern: RegExp }[] = [
  {
    kind: 'greeting',
    pattern:
      /^(?:hi|hello|hey|yo|hola|good (?:morning|afternoon|evening)|kumusta|musta|magandang (?:umaga|hapon|gabi|tanghali))(?: (?:there|po|ava|ava po|everyone|kuya|ate))*$/,
  },
  {
    kind: 'howAreYou',
    pattern:
      /\b(?:how are you|how's it going|how are things|kumusta ka|kumusta ka na|kumain (?:ka|kana|ka na)|kain (?:ka )?na (?:ba|po)|nakakain ka|busog ka)\b/,
  },
  { kind: 'thanks', pattern: /^(?:thanks|thank you|thank u|thanks a lot|ty|salamat|maraming salamat)(?: (?:po|ava|so much|a lot))*$/ },
  {
    kind: 'who',
    pattern:
      /\b(?:who are you|what(?:'s| is) your name|sino ka|ano (?:ang )?pangalan mo|are you (?:a )?(?:bot|ai|robot|human|real))\b/,
  },
  { kind: 'bye', pattern: /^(?:bye|goodbye|see you|see ya|paalam|ingat)(?: (?:po|ava|na))*$/ },
];

const clean = (message: string) =>
  message
    .toLowerCase()
    .replace(/[^a-z0-9ñ' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * The kind of small talk a short message is, or `null` for anything that asks
 * for a place to rent (it is never small talk when it carries a search detail).
 */
export function smallTalkKind(message: string): AvaSmallTalkKind | null {
  const text = clean(message);
  if (!text || text.split(' ').length > MAX_WORDS) return null;
  if (countAiSearchFilters(parseSearchKeywords(text)) > 0) return null;
  return PATTERNS.find((entry) => entry.pattern.test(text))?.kind ?? null;
}
