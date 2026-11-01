// Search filters for Ava, the AI chatbot search. The model (Gemini, through
// the `ai-search` edge function) only proposes filters; listings always come
// from the normal apartments query, so RLS stays the authority. Everything the
// model returns goes through `sanitizeAiFilters` first, and
// `parseSearchKeywords` is the no-AI fallback used when the model is
// unavailable or the daily limit is reached.

import { APARTMENT_TYPES, CAMANAVA_CITIES, FURNISHED_TYPES } from '@repo/constants';

export const AI_SEARCH_MIN_BUDGET = 1000;
export const AI_SEARCH_MAX_BUDGET = 50000;
export const AI_SEARCH_KEYWORD_MAX_LENGTH = 40;
export const AI_SEARCH_ROOM_OPTIONS = ['1', '2', '3', '4+'] as const;
export const AI_SEARCH_SORTS = ['price_asc', 'price_desc', 'most_popular'] as const;

export type AiSearchRoomCount = (typeof AI_SEARCH_ROOM_OPTIONS)[number];
export type AiSearchSort = (typeof AI_SEARCH_SORTS)[number];

export interface AiSearchFilters {
  cities: string[];
  priceMin: number | null;
  priceMax: number | null;
  bedrooms: AiSearchRoomCount | null;
  bathrooms: AiSearchRoomCount | null;
  types: string[];
  furnishing: string[];
  amenities: string[];
  verifiedOnly: boolean;
  sort: AiSearchSort | null;
  keyword: string | null;
}

export const EMPTY_AI_SEARCH_FILTERS: AiSearchFilters = {
  cities: [],
  priceMin: null,
  priceMax: null,
  bedrooms: null,
  bathrooms: null,
  types: [],
  furnishing: [],
  amenities: [],
  verifiedOnly: false,
  sort: null,
  keyword: null,
};

interface SearchableAmenity {
  id: string;
  /** Whole words or phrases (English and Tagalog), matched case-insensitively. */
  keywords: readonly string[];
}

// The amenities people ask for in plain words. Ids match the listing amenity
// ids (mobile `constants/perks.ts`, web `app/components/inputs/perks.ts`).
export const AI_SEARCH_AMENITIES: readonly SearchableAmenity[] = [
  { id: 'petfriendly', keywords: ['pet', 'pets', 'pet friendly', 'pet-friendly', 'dog', 'dogs', 'cat', 'cats', 'aso', 'pusa'] },
  { id: 'parking', keywords: ['parking', 'garage', 'carport', 'paradahan', 'kotse', 'sasakyan'] },
  { id: 'motorbikeparking', keywords: ['motor', 'motorcycle', 'motorbike', 'scooter'] },
  { id: 'wifi', keywords: ['wifi', 'wi-fi', 'internet'] },
  { id: 'ac', keywords: ['aircon', 'air con', 'airconditioned', 'air conditioned', 'air conditioning', 'ac'] },
  { id: 'kitchen', keywords: ['kitchen', 'kusina', 'lutuan'] },
  { id: 'washer', keywords: ['washing machine', 'washer', 'labahan'] },
  { id: 'balcony', keywords: ['balcony', 'balkonahe'] },
  { id: 'elevator', keywords: ['elevator', 'lift'] },
  { id: 'gym', keywords: ['gym'] },
  { id: 'pool', keywords: ['pool', 'swimming pool', 'swimming'] },
  { id: 'cctv', keywords: ['cctv'] },
  { id: 'security', keywords: ['security guard', 'guard', 'guwardiya', 'bantay'] },
  { id: 'gated', keywords: ['gated', 'subdivision'] },
  { id: 'near_transport', keywords: ['near transport', 'jeep', 'jeepney', 'lrt', 'mrt', 'terminal', 'sakayan'] },
  { id: 'near_school', keywords: ['school', 'university', 'college', 'eskwelahan', 'paaralan'] },
  { id: 'near_hospital', keywords: ['hospital', 'clinic', 'ospital'] },
  { id: 'childfriendly', keywords: ['kids', 'child friendly', 'children', 'bata', 'mga bata'] },
  { id: 'all_female', keywords: ['female only', 'all female', 'ladies only', 'babae lang'] },
];

const AMENITY_IDS = new Set(AI_SEARCH_AMENITIES.map((amenity) => amenity.id));
// ASCII plus Latin letters ("Niño"); Hermes has no Unicode property escapes.
const LETTER = 'a-z\\u00e0-\\u024f';
const KEYWORD_PATTERN = /[^a-zA-Z0-9\u00c0-\u024f -]/g;
const THOUSAND_WORDS = 'k|thousand|libo|lib';

function pickAllowed(values: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(values)) return [];
  const byLowercase = new Map(allowed.map((value) => [value.toLowerCase(), value]));
  const picked = values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => byLowercase.get(value.trim().toLowerCase()))
    .filter((value): value is string => value !== undefined);
  return [...new Set(picked)];
}

function toBudget(value: unknown): number | null {
  const amount = typeof value === 'string' ? Number(value.replace(/[,₱\s]/g, '')) : value;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(Math.min(Math.max(amount, AI_SEARCH_MIN_BUDGET), AI_SEARCH_MAX_BUDGET));
}

function toRoomCount(value: unknown): AiSearchRoomCount | null {
  const text = typeof value === 'number' ? String(value) : value;
  if (typeof text !== 'string') return null;
  const count = Number.parseInt(text, 10);
  if (!Number.isFinite(count) || count < 1) return null;
  return count >= 4 ? '4+' : (String(count) as AiSearchRoomCount);
}

/** Letters, digits, spaces and hyphens only, so it is safe inside a PostgREST `or` filter. */
export function sanitizeSearchKeyword(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(KEYWORD_PATTERN, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;
  return cleaned.slice(0, AI_SEARCH_KEYWORD_MAX_LENGTH).trim();
}

/** Turns untrusted model output into filters the app understands. Unknown values are dropped. */
export function sanitizeAiFilters(raw: unknown): AiSearchFilters {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_AI_SEARCH_FILTERS };
  const input = raw as Record<string, unknown>;

  let priceMin = toBudget(input.priceMin);
  let priceMax = toBudget(input.priceMax);
  if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
    [priceMin, priceMax] = [priceMax, priceMin];
  }

  return {
    cities: pickAllowed(input.cities, CAMANAVA_CITIES),
    priceMin,
    priceMax,
    bedrooms: toRoomCount(input.bedrooms),
    bathrooms: toRoomCount(input.bathrooms),
    types: pickAllowed(input.types, APARTMENT_TYPES),
    furnishing: pickAllowed(input.furnishing, FURNISHED_TYPES),
    amenities: pickAllowed(input.amenities, [...AMENITY_IDS]),
    verifiedOnly: input.verifiedOnly === true,
    sort: (pickAllowed([input.sort], AI_SEARCH_SORTS)[0] as AiSearchSort | undefined) ?? null,
    keyword: sanitizeSearchKeyword(input.keyword),
  };
}

/** How many filters are set; zero means nothing searchable was understood. */
export function countAiSearchFilters(filters: AiSearchFilters): number {
  return (
    filters.cities.length +
    (filters.priceMin !== null ? 1 : 0) +
    (filters.priceMax !== null ? 1 : 0) +
    (filters.bedrooms !== null ? 1 : 0) +
    (filters.bathrooms !== null ? 1 : 0) +
    filters.types.length +
    filters.furnishing.length +
    filters.amenities.length +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.sort !== null ? 1 : 0) +
    (filters.keyword !== null ? 1 : 0)
  );
}

function hasPhrase(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^${LETTER}0-9])${escaped}($|[^${LETTER}0-9])`).test(text);
}

function parseAmount(digits: string, unit: string | undefined): number | null {
  const value = Number(digits.replace(/,/g, ''));
  if (!Number.isFinite(value)) return null;
  // "15k", "15 libo", or a bare "15" in a rent sentence all mean 15,000.
  return unit || value < 100 ? value * 1000 : value;
}

const AMOUNT = `(?:₱|php)?\\s*(\\d[\\d,]*(?:\\.\\d+)?)\\s*(${THOUSAND_WORDS})?`;
const MAX_WORDS = 'under|below|less than|max|maximum|up to|not more than|hanggang|di lalagpas sa|hindi lalagpas sa|wala pang|budget ko|budget';
const MIN_WORDS = 'above|over|more than|at least|minimum|min|mula|lagpas';
const SIZE_PHRASE = /\d+\s*(?:sqm|sq\.?\s?m|square meters?)/g;

function parseBudget(text: string): Pick<AiSearchFilters, 'priceMin' | 'priceMax'> {
  const range = text.match(new RegExp(`${AMOUNT}\\s*(?:-|to|hanggang|until)\\s*${AMOUNT}`));
  // "2-3" alone is not money; a range needs a unit or real peso amounts.
  if (range && (range[2] || range[4] || Number(range[1].replace(/,/g, '')) >= 100)) {
    const low = parseAmount(range[1], range[2] ?? range[4]);
    const high = parseAmount(range[3], range[4]);
    return { priceMin: toBudget(low), priceMax: toBudget(high) };
  }

  const max = text.match(new RegExp(`(?:${MAX_WORDS})\\s*${AMOUNT}`));
  if (max) return { priceMin: null, priceMax: toBudget(parseAmount(max[1], max[2])) };

  const min = text.match(new RegExp(`(?:${MIN_WORDS})\\s*${AMOUNT}`));
  if (min) return { priceMin: toBudget(parseAmount(min[1], min[2])), priceMax: null };

  // A bare amount with a thousand unit ("15k", "10 libo") reads as a budget ceiling.
  const bare = text.match(new RegExp(`(?:₱|php)?\\s*(\\d[\\d,]*)\\s*(${THOUSAND_WORDS})(?![${LETTER}])`));
  if (bare) return { priceMin: null, priceMax: toBudget(parseAmount(bare[1], bare[2])) };

  return { priceMin: null, priceMax: null };
}

const TAGALOG_NUMBERS: Record<string, number> = {
  isa: 1, isang: 1, dalawa: 2, dalawang: 2, tatlo: 3, tatlong: 3, apat: 4, 'apat na': 4,
  one: 1, two: 2, three: 3, four: 4,
};
const NUMBER_WORD = `(?:^|[^${LETTER}0-9])(\\d|${Object.keys(TAGALOG_NUMBERS).join('|')})`;
const BEDROOM_NOUNS = 'br|bedrooms?|beds?|rooms?|kwarto|kuwarto|silid';
const BATHROOM_NOUNS = 'bathrooms?|baths?|cr|crs|banyo|t&b|toilets?';
const ROOM_PHRASE = new RegExp(
  `${NUMBER_WORD}\\s*-?\\s*(?:${BEDROOM_NOUNS}|${BATHROOM_NOUNS})(?![${LETTER}])`,
  'g',
);

function parseRooms(text: string, nouns: string): AiSearchRoomCount | null {
  const match = text.match(new RegExp(`${NUMBER_WORD}\\s*-?\\s*(?:${nouns})(?![${LETTER}])`));
  if (!match) return null;
  const count = /^\d$/.test(match[1]) ? Number(match[1]) : TAGALOG_NUMBERS[match[1]];
  return toRoomCount(count);
}

function parseTypes(text: string): string[] {
  const types: string[] = [];
  if (hasPhrase(text, 'studio')) types.push('Studio');
  if (hasPhrase(text, 'condo') || hasPhrase(text, 'condominium')) types.push('Condo Unit');
  if (hasPhrase(text, 'townhouse') || hasPhrase(text, 'town house')) types.push('Townhouse');
  else if (hasPhrase(text, 'house')) types.push('House');
  return types;
}

function parseFurnishing(text: string): string[] {
  if (hasPhrase(text, 'unfurnished') || hasPhrase(text, 'walang gamit') || hasPhrase(text, 'bare')) {
    return ['Unfurnished'];
  }
  if (/semi[\s-]?furnished/u.test(text)) return ['Semi-Furnished'];
  if (/ful+y?[\s-]?furnished/u.test(text)) return ['Fully Furnished'];
  if (hasPhrase(text, 'furnished') || hasPhrase(text, 'may gamit') || hasPhrase(text, 'kumpleto sa gamit')) {
    return ['Fully Furnished', 'Semi-Furnished'];
  }
  return [];
}

function parseSort(text: string): AiSearchSort | null {
  if (['cheapest', 'pinakamura', 'lowest price', 'murang', 'mura', 'cheap', 'affordable'].some((word) => hasPhrase(text, word))) {
    return 'price_asc';
  }
  if (['top rated', 'highest rated', 'best rated', 'best', 'pinakamaganda', 'popular'].some((word) => hasPhrase(text, word))) {
    return 'most_popular';
  }
  return null;
}

/** Rule-based reading of a plain-language request (English, Tagalog or Taglish). No network. */
export function parseSearchKeywords(message: string): AiSearchFilters {
  const text = message.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!text) return { ...EMPTY_AI_SEARCH_FILTERS };

  const cities = CAMANAVA_CITIES.filter(
    (city) => hasPhrase(text, city.toLowerCase()) || (city === 'Caloocan' && hasPhrase(text, 'kalookan')),
  );

  return {
    ...EMPTY_AI_SEARCH_FILTERS,
    cities: [...cities],
    // Room counts and floor areas are numbers too; keep them out of the budget.
    ...parseBudget(text.replace(ROOM_PHRASE, ' ').replace(SIZE_PHRASE, ' ')),
    bedrooms: parseRooms(text, BEDROOM_NOUNS),
    bathrooms: parseRooms(text, BATHROOM_NOUNS),
    types: parseTypes(text),
    furnishing: parseFurnishing(text),
    amenities: AI_SEARCH_AMENITIES.filter((amenity) =>
      amenity.keywords.some((keyword) => hasPhrase(text, keyword)),
    ).map((amenity) => amenity.id),
    verifiedOnly: hasPhrase(text, 'verified') || hasPhrase(text, 'legit'),
    sort: parseSort(text),
  };
}

/** The web Browse query params (`apps/web/app/browse/lib/browse-query.ts`) for these filters. */
export function aiFiltersToBrowseParams(filters: AiSearchFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.cities.length > 0) params.locations = filters.cities.join(',');
  if (filters.priceMin !== null) params.price_min = String(filters.priceMin);
  if (filters.priceMax !== null) params.price_max = String(filters.priceMax);
  if (filters.types.length > 0) params.apt_types = filters.types.join(',');
  if (filters.bedrooms !== null) params.bedrooms = filters.bedrooms;
  if (filters.bathrooms !== null) params.bathrooms = filters.bathrooms;
  if (filters.furnishing.length > 0) params.furnishing = filters.furnishing.join(',');
  if (filters.amenities.length > 0) params.amenities = filters.amenities.join(',');
  if (filters.verifiedOnly) params.verified = '1';
  if (filters.sort !== null) params.sort = filters.sort;
  if (filters.keyword !== null) params.search = filters.keyword;
  return params;
}
