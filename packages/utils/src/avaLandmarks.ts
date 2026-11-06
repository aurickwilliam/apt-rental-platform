// Landmark recognition for Ava. A tenant says "near SM Grand Central" or
// "malapit sa Monumento"; this module finds the real landmark in the verified
// gazetteer (`@repo/constants` `CAMANAVA_LANDMARKS`, coordinates from
// OpenStreetMap) so listings can be ranked by distance. It never invents a
// place: anything it cannot match is reported as `none` and the caller says so.

import {
  CAMANAVA_CITIES,
  CAMANAVA_LANDMARKS,
  type CamanavaLandmark,
  type LandmarkKind,
} from '@repo/constants';

export interface LandmarkPoint {
  latitude: number;
  longitude: number;
}

/** What a search measures distance to: one landmark, or every landmark of a kind. */
export interface LandmarkTarget {
  /** Stable key kept in the conversation memory, e.g. "sm-grand-central". */
  key: string;
  /** What Ava calls it in a reply. */
  label: string;
  city: string | null;
  points: LandmarkPoint[];
}

export type LandmarkResolution =
  | { status: 'found'; target: LandmarkTarget }
  | { status: 'ambiguous'; options: CamanavaLandmark[]; label: string }
  | { status: 'unknown_place'; label: string }
  | { status: 'none' };

const KIND_WORDS: { kind: LandmarkKind; label: string; words: string[] }[] = [
  { kind: 'city_hall', label: 'city hall', words: ['city hall', 'munisipyo', 'munisipyo'] },
  { kind: 'hospital', label: 'hospital', words: ['hospital', 'ospital', 'medical center'] },
  { kind: 'school', label: 'school', words: ['school', 'university', 'college', 'campus', 'eskwelahan', 'paaralan', 'unibersidad'] },
  { kind: 'mall', label: 'mall', words: ['mall', 'shopping center'] },
  { kind: 'market', label: 'market', words: ['market', 'palengke', 'fish port'] },
  { kind: 'church', label: 'church', words: ['church', 'simbahan', 'parish', 'basilica'] },
  { kind: 'transport', label: 'train station', words: ['lrt', 'train station', 'station'] },
];

const NEARBY_WORDS = [
  'near', 'nearby', 'around', 'close to', 'closer to', 'next to', 'beside', 'walking distance',
  'malapit', 'malapit sa', 'katabi', 'paligid', 'sa tabi ng', 'sa may', 'around the',
];

const ARTICLE = /\b(?:the|sa|ng|ang|si|kay)\b/g;
const CLEAN = /[^a-z0-9ñ ]/g;

/** Lowercase, accent-free, punctuation-free text for matching. */
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(CLEAN, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Edit distance, stopping early once it passes `limit`. */
function editDistance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > limit) return limit + 1;
    previous = current;
  }
  return previous[b.length];
}

/** Typos allowed for a phrase of this length: none for short words, one or two for longer ones. */
function typoBudget(length: number): number {
  // One typo per six letters, at most two: "monumnto" passes, "in caloocan" for "sm caloocan" does not.
  return Math.min(2, Math.floor(length / 6));
}

interface AliasEntry {
  alias: string;
  landmark: CamanavaLandmark;
}

const ALIASES: AliasEntry[] = CAMANAVA_LANDMARKS.flatMap((landmark) =>
  [landmark.name, ...landmark.aliases].map((alias) => ({
    alias: normalizeForMatch(alias),
    landmark,
  })),
).sort((a, b) => b.alias.length - a.alias.length);

/** Every window of 1 to `size` consecutive words of the message. */
function phraseWindows(words: string[], size: number): string[] {
  const windows: string[] = [];
  for (let start = 0; start < words.length; start += 1) {
    for (let length = 1; length <= size && start + length <= words.length; length += 1) {
      windows.push(words.slice(start, start + length).join(' '));
    }
  }
  return windows;
}

function hasWord(text: string, word: string): boolean {
  return ` ${text} `.includes(` ${word} `);
}

/** The city a message names ("Malabon", "Kalookan"), if exactly one. */
export function findMentionedCity(text: string): string | null {
  const normalized = normalizeForMatch(text);
  const cities = CAMANAVA_CITIES.filter(
    (city) =>
      hasWord(normalized, city.toLowerCase()) || (city === 'Caloocan' && hasWord(normalized, 'kalookan')),
  );
  return cities.length === 1 ? cities[0] : null;
}

export function landmarkToTarget(landmark: CamanavaLandmark): LandmarkTarget {
  return {
    key: landmark.id,
    label: landmark.name,
    city: landmark.city,
    points: [{ latitude: landmark.latitude, longitude: landmark.longitude }],
  };
}

/** Every landmark of a kind (optionally in one city) as a single target. */
export function kindToTarget(kind: LandmarkKind, city: string | null): LandmarkTarget | null {
  const meta = KIND_WORDS.find((entry) => entry.kind === kind);
  const landmarks = CAMANAVA_LANDMARKS.filter(
    (landmark) => landmark.kind === kind && (city === null || landmark.city === city),
  );
  if (!meta || landmarks.length === 0) return null;
  return {
    key: `kind:${kind}:${city ?? 'all'}`,
    label: city ? `${meta.label}s in ${city}` : `${meta.label}s`,
    city,
    points: landmarks.map((landmark) => ({ latitude: landmark.latitude, longitude: landmark.longitude })),
  };
}

/** Restores a remembered target from its key (the conversation memory stores keys, not coordinates). */
export function targetFromKey(key: string): LandmarkTarget | null {
  if (key.startsWith('kind:')) {
    const [, kind, city] = key.split(':');
    const known = KIND_WORDS.some((entry) => entry.kind === kind);
    return known ? kindToTarget(kind as LandmarkKind, city === 'all' ? null : city) : null;
  }
  const landmark = CAMANAVA_LANDMARKS.find((entry) => entry.id === key);
  return landmark ? landmarkToTarget(landmark) : null;
}

function matchAlias(normalized: string): CamanavaLandmark[] {
  const words = normalized.split(' ').filter(Boolean);
  const matched = new Map<string, CamanavaLandmark>();

  // Exact phrase first, longest alias wins ("sm city grand central" over "grand central").
  for (const { alias, landmark } of ALIASES) {
    if (hasWord(normalized, alias)) {
      // A shorter alias contained in a longer match of the same landmark is not a new hit.
      matched.set(landmark.id, landmark);
      break;
    }
  }
  if (matched.size > 0) return [...matched.values()];

  // Minor spelling mistakes. Only when the message points at a place ("near
  // monumnto") or is short, so ordinary words in a long request ("an apartment
  // in Caloocan") are never read as a landmark.
  if (!mentionsNearbyIntent(normalized) && words.length > 4) return [];

  let best: { distance: number; landmarks: CamanavaLandmark[] } | null = null;
  for (const window of phraseWindows(words, 5)) {
    if (window.length < 7) continue;
    const windowWords = window.split(' ').length;
    for (const { alias, landmark } of ALIASES) {
      // Same number of words, so "in caloocan" can never stand for "sm caloocan".
      if (alias.split(' ').length !== windowWords) continue;
      const budget = typoBudget(Math.min(window.length, alias.length));
      if (budget === 0) continue;
      const distance = editDistance(window, alias, budget);
      if (distance > budget) continue;
      if (!best || distance < best.distance) best = { distance, landmarks: [landmark] };
      else if (distance === best.distance && !best.landmarks.some((entry) => entry.id === landmark.id)) {
        best.landmarks.push(landmark);
      }
    }
  }
  return best?.landmarks ?? [];
}

// Words that may sit before a kind word without naming a specific place.
const GENERIC_WORDS = new Set([
  'a', 'an', 'the', 'any', 'some', 'good', 'nearest', 'closest', 'public', 'private', 'big', 'local',
  'nearby', 'near', 'around', 'close', 'to', 'in', 'at', 'of', 'next', 'beside', 'by', 'walking',
  'distance', 'within', 'from', 'malapit', 'katabi', 'paligid', 'may', 'isang', 'mga', 'lang',
  'apartment', 'apartments', 'house', 'houses', 'place', 'places', 'unit', 'units', 'find', 'show',
  'me', 'i', 'want', 'live', 'stay', 'need', 'looking', 'for', 'is', 'there', 'are', 'do', 'you',
  'have', 'and', 'or', 'with', 'gusto', 'ko', 'hanap', 'ba', 'po', 'sa', 'ng',
  ...CAMANAVA_CITIES.map((city) => city.toLowerCase()),
]);

/** The words naming a specific place right before a kind word, e.g. "sampaguita" in "sampaguita school". */
function namePrecedingKind(normalized: string, kindWords: string[]): string | null {
  const words = normalized.split(' ');
  for (const kindWord of kindWords.map(normalizeForMatch)) {
    const kindParts = kindWord.split(' ');
    for (let index = 0; index + kindParts.length <= words.length; index += 1) {
      if (words.slice(index, index + kindParts.length).join(' ') !== kindWord) continue;
      const name: string[] = [];
      for (let back = index - 1; back >= 0 && !GENERIC_WORDS.has(words[back]); back -= 1) {
        name.unshift(words[back]);
      }
      if (name.length > 0) {
        return [...name, ...kindParts].map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');
      }
    }
  }
  return null;
}

/** What to call several possible places: "city hall" when all are, otherwise just "place". */
function ambiguityLabel(options: CamanavaLandmark[]): string {
  const kinds = new Set(options.map((option) => option.kind));
  if (kinds.size === 1) {
    return KIND_WORDS.find((entry) => entry.kind === options[0].kind)?.label ?? 'place';
  }
  return 'place';
}

function mentionsNearbyIntent(normalized: string): boolean {
  return NEARBY_WORDS.some((word) => normalized.includes(normalizeForMatch(word)));
}

/**
 * Finds the landmark a message refers to.
 *
 * - A named landmark ("sm grand central", "monumento", "grand sentral") resolves
 *   to it; the city is not needed.
 * - "SM" or "city hall" alone are ambiguous across cities: Ava asks which one,
 *   unless the message or `preferredCity` names the city.
 * - "near a hospital in Malabon" targets every hospital in Malabon.
 * - A place the message points at ("near Sampaguita School") that is not in the
 *   gazetteer is `unknown_place`; Ava says she cannot pinpoint it.
 */
export function resolveLandmark(
  message: string,
  options: { preferredCity?: string | null } = {},
): LandmarkResolution {
  const normalized = normalizeForMatch(message).replace(ARTICLE, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return { status: 'none' };

  const city = findMentionedCity(message) ?? options.preferredCity ?? null;

  const named = matchAlias(normalized);
  if (named.length === 1) return { status: 'found', target: landmarkToTarget(named[0]) };
  if (named.length > 1) {
    return { status: 'ambiguous', options: named, label: ambiguityLabel(named) };
  }

  const kindMeta = KIND_WORDS.find((entry) => entry.words.some((word) => hasWord(normalized, normalizeForMatch(word))));
  if (kindMeta) {
    if (kindMeta.kind === 'city_hall') {
      if (city) {
        const hall = CAMANAVA_LANDMARKS.find((entry) => entry.kind === 'city_hall' && entry.city === city);
        if (hall) return { status: 'found', target: landmarkToTarget(hall) };
      }
      const halls = CAMANAVA_LANDMARKS.filter((entry) => entry.kind === 'city_hall');
      return { status: 'ambiguous', options: halls, label: 'city hall' };
    }

    // "near Sampaguita School": a named place that is not in the list.
    const named = namePrecedingKind(normalized, kindMeta.words);
    if (named) return { status: 'unknown_place', label: named };

    // "my school" / "our school": a specific place Ava cannot know.
    if (/\b(my|our|aking|amin|ko)\b/.test(normalized) && (kindMeta.kind === 'school' || kindMeta.kind === 'church')) {
      return { status: 'unknown_place', label: `your ${kindMeta.label}` };
    }

    const target = kindToTarget(kindMeta.kind, city);
    if (target && mentionsNearbyIntent(normalized)) return { status: 'found', target };
    if (target && city) return { status: 'found', target };
    // A kind word alone ("school") is the amenity filter, not a landmark search.
  }

  // "SM" with no mall name: three malls share it.
  if (hasWord(normalized, 'sm')) {
    const malls = CAMANAVA_LANDMARKS.filter((entry) => entry.id.startsWith('sm-') && (!city || entry.city === city));
    if (malls.length === 1) return { status: 'found', target: landmarkToTarget(malls[0]) };
    if (malls.length > 1) return { status: 'ambiguous', options: malls, label: 'SM' };
  }

  return { status: 'none' };
}

/**
 * True when the message points at a named place ("near Sampaguita School") even
 * though it is not a known landmark, so Ava can say so instead of ignoring it.
 */
export function mentionsUnknownPlace(message: string): string | null {
  const text = message.trim();
  const match = text.match(
    /\b(?:near|around|close to|next to|malapit sa|malapit kay|malapit|katabi ng)\s+(?:the\s+|ang\s+)?([A-Z][\w.'&-]*(?:\s+[A-Z][\w.'&-]*){0,4})/,
  );
  if (!match) return null;
  const place = match[1].trim();
  // City and barangay names are handled by the normal city/keyword filters.
  const normalized = normalizeForMatch(place);
  if (!normalized || findMentionedCity(place)) return null;
  return place.slice(0, 60);
}
