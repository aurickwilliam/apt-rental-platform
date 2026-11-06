// Ava's search orchestration, shared by web and mobile. Given what Gemini (or
// the keyword reader) understood and the conversation so far, it decides what
// to do: ask which place the tenant means, search by filters, or search by
// distance to a landmark with progressive fallback. Each platform only
// supplies `fetchListings`, which reads real apartments through its own
// Supabase client (RLS decides what is visible), so Ava can never show a
// listing that does not exist.

import {
  countAiSearchFilters,
  mergeAiFilters,
  wantsAnyArea,
  type AiSearchFilters,
} from './aiSearch';
import {
  AVA_RESULT_LIMIT,
  avaConversationLanguage,
  composeAvaReply,
  type AvaAnswer,
  type AvaReply,
  type AvaSearchState,
  type AvaTurn,
} from './avaChat';
import type { AvaLanguage } from './avaLanguage';
import {
  findMentionedCity,
  resolveLandmark,
  targetFromKey,
  type LandmarkResolution,
  type LandmarkTarget,
} from './avaLandmarks';
import { formatDistance, rankByProximity } from './avaProximity';
import { AVA_STRINGS } from './avaStrings';

/** How many nearby listings are read to rank by distance (CAMANAVA is small). */
export const AVA_PROXIMITY_POOL = 500;

/** The fields of a listing Ava needs, whatever the platform's card looks like. */
export interface AvaCandidate {
  id: string;
  monthlyRent: number;
  bedrooms: number | null;
  /** Amenity ids stored on the listing. */
  amenities: string[];
  latitude: number | null;
  longitude: number | null;
  city: string | null;
}

export interface AvaFound<T> {
  card: T;
  candidate: AvaCandidate;
}

export interface AvaFetchRequest {
  filters: AiSearchFilters;
  limit: number;
  excludeIds: string[];
}

export type AvaListingFetcher<T> = (request: AvaFetchRequest) => Promise<AvaFound<T>[]>;

export interface AvaOutcome<T> {
  reply: AvaReply;
  listings: T[];
  /** Why each listing is recommended, by listing id. */
  notes: Record<string, string>;
  /** Remembered on the reply so the next message can build on it. */
  state: AvaSearchState | null;
  shownIds: string[];
  /** The filters actually searched (null when Ava asked a question instead). */
  filters: AiSearchFilters | null;
  /** The language Ava answered in. */
  language: AvaLanguage;
}

const AMENITY_LABELS: Record<string, string> = {
  petfriendly: 'pets allowed',
  parking: 'car parking',
  motorbikeparking: 'motorcycle parking',
  wifi: 'Wi-Fi',
  ac: 'air conditioning',
  kitchen: 'a kitchen',
  washer: 'a washing machine',
  balcony: 'a balcony',
  elevator: 'an elevator',
  gym: 'a gym',
  pool: 'a swimming pool',
  cctv: 'CCTV',
  security: 'a security guard',
  gated: 'a gated community',
  near_transport: 'public transport nearby',
  near_school: 'a school nearby',
  near_hospital: 'a hospital nearby',
  childfriendly: 'child-friendly',
  all_female: 'female tenants only',
};

const MAX_NOTE_AMENITIES = 3;

const withThousands = (amount: number) => String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function joinLabels(labels: string[], language: AvaLanguage): string {
  if (labels.length <= 1) return labels.join('');
  const conjunction = language === 'tl' ? 'at' : 'and';
  return `${labels.slice(0, -1).join(', ')} ${conjunction} ${labels[labels.length - 1]}`;
}

/** The one-line "why this listing" caption: distance, budget and bedroom fit, requested amenities. */
export function describeListing(
  candidate: AvaCandidate,
  filters: AiSearchFilters,
  language: AvaLanguage,
  distance?: { km: number; place: string },
): string {
  const strings = AVA_STRINGS[language];
  const parts: string[] = [];

  if (distance) parts.push(strings.distanceNote(formatDistance(distance.km), distance.place));
  if (filters.priceMax !== null && candidate.monthlyRent <= filters.priceMax) {
    parts.push(strings.withinBudget(withThousands(filters.priceMax)));
  }
  if (filters.bedrooms !== null && candidate.bedrooms !== null) {
    parts.push(strings.bedrooms(candidate.bedrooms));
  }

  const have = new Set(candidate.amenities);
  const wanted = filters.amenities.filter((id) => have.has(id) && AMENITY_LABELS[id]);
  const amenityIds = (wanted.length > 0 ? wanted : [...have].filter((id) => AMENITY_LABELS[id])).slice(
    0,
    MAX_NOTE_AMENITIES,
  );
  if (amenityIds.length > 0) {
    parts.push(strings.hasAmenities(joinLabels(amenityIds.map((id) => AMENITY_LABELS[id]), language)));
  }

  return parts.join(' · ');
}

function shortAmenity(id: string): string | null {
  const label = AMENITY_LABELS[id];
  return label ? label.replace(/^(a|an) /, '') : null;
}

/**
 * "Searching: near SM City Grand Central · up to ₱8,000 · 2 bedrooms", so the
 * tenant can see what Ava remembered and is applying.
 */
export function describeSearch(
  filters: AiSearchFilters,
  target: LandmarkTarget | null,
  language: AvaLanguage,
): string {
  const strings = AVA_STRINGS[language];
  const parts: string[] = [];

  if (target) parts.push(strings.nearPlace(target.label));
  else if (filters.cities.length > 0) parts.push(filters.cities.join(' / '));

  if (filters.priceMin !== null && filters.priceMax !== null) {
    parts.push(`₱${withThousands(filters.priceMin)}–₱${withThousands(filters.priceMax)}`);
  } else if (filters.priceMax !== null) parts.push(strings.upTo(withThousands(filters.priceMax)));
  else if (filters.priceMin !== null) parts.push(strings.fromAmount(withThousands(filters.priceMin)));

  if (filters.bedrooms !== null) {
    const min = filters.bedrooms === '4+' ? 4 : Number(filters.bedrooms);
    if (filters.bedroomsMax !== null) parts.push(`${min}–${strings.bedrooms(filters.bedroomsMax)}`);
    else parts.push(filters.bedrooms === '4+' ? '4+ bedrooms' : strings.bedrooms(min));
  }
  parts.push(...filters.types);
  parts.push(
    ...filters.amenities.map(shortAmenity).filter((label): label is string => label !== null),
  );
  if (filters.verifiedOnly) parts.push(strings.verifiedOnly);
  if (filters.sort === 'price_asc') parts.push(strings.cheapestFirst);
  if (filters.sort === 'price_desc') parts.push(strings.priciestFirst);

  // One detail is already in the reply itself; the line is for what was remembered.
  return parts.length >= 2 || target ? `${strings.searching}: ${parts.join(' · ')}` : '';
}

const withSummary = (reply: AvaReply, summary: string): AvaReply =>
  summary ? { ...reply, text: `${reply.text}\n${summary}` } : reply;

interface AvaContext {
  previous: AvaSearchState | null;
  /** Ids already shown for the search the tenant is still on. */
  shownIds: string[];
}

/** The latest remembered search and the listings already shown for it. */
export function deriveAvaContext(turns: AvaTurn[]): AvaContext {
  const withSearch = turns.filter((turn) => turn.role === 'assistant' && turn.search);
  const latest = withSearch[withSearch.length - 1]?.search ?? null;
  if (!latest) return { previous: null, shownIds: [] };

  const signature = JSON.stringify(latest);
  const shown = withSearch
    .filter((turn) => JSON.stringify(turn.search) === signature)
    .flatMap((turn) => turn.shownIds ?? []);
  return { previous: latest, shownIds: [...new Set(shown)] };
}

const latestUserText = (turns: AvaTurn[]) =>
  [...turns].reverse().find((turn) => turn.role === 'user')?.text ?? '';

function chooseFilters(
  answer: AvaAnswer,
  previous: AvaSearchState | null,
  latest: string,
): AiSearchFilters {
  if (!previous) return answer.filters;
  // The keyword reader already covers the whole conversation message by message.
  if (answer.source !== 'gemini') return answer.filters;

  // Gemini's filters are read as this message's changes on top of what the chat
  // already settled, never as the whole truth: it sometimes drops an earlier
  // budget or bedroom count, which made the same question answer differently.
  // Clearing something takes an explicit phrase ("any area", "any budget").
  const merged = mergeAiFilters(previous.filters, answer.filters, latest);
  return answer.wantsMore && merged.sort === null
    ? { ...merged, sort: previous.filters.sort }
    : merged;
}

const REFERS_BACK = [
  /\b(?:closer|nearer)\b/,
  /\b(?:near|around|close to|next to|by)\s+(?:it|that|there|that place|the same (?:place|area))\b/,
  /\b(?:same|that)\s+(?:place|area|location|landmark)\b/,
  /\b(?:mas\s+malapit|malapit\s+(?:dito|doon|diyan|doon sa kanya))\b/,
];

/** True when the message points back at the place already being searched ("closer to it"). */
function refersBackToPlace(message: string): boolean {
  const text = message.toLowerCase();
  return REFERS_BACK.some((pattern) => pattern.test(text));
}

function chooseTarget(
  answer: AvaAnswer,
  latest: string,
  filters: AiSearchFilters,
  previous: AvaSearchState | null,
): { resolution: LandmarkResolution; target: LandmarkTarget | null } {
  const preferredCity = filters.cities.length === 1 ? filters.cities[0] : null;
  let resolution = resolveLandmark(latest, { preferredCity });
  if (resolution.status === 'none' && answer.landmark) {
    resolution = resolveLandmark(answer.landmark, { preferredCity });
  }
  if (resolution.status === 'found') return { resolution, target: resolution.target };
  if (resolution.status !== 'none') return { resolution, target: null };

  // No new place in this message. The landmark is not sticky: a message that
  // does not name a place ("with parking?", "what if my budget is 8k?") is a
  // search of its own. It stays only when the tenant points back at it
  // ("closer to it", "near there") or asks for more of the same search.
  const moved = findMentionedCity(latest) !== null || wantsAnyArea(latest);
  const keeps = answer.wantsMore || refersBackToPlace(latest);
  const remembered =
    previous?.landmarkKey && keeps && !moved ? targetFromKey(previous.landmarkKey) : null;
  return { resolution, target: remembered };
}

/** Filters for the distance search: the landmark, not a city or keyword, decides where. */
function proximityFilters(filters: AiSearchFilters): AiSearchFilters {
  return {
    ...filters,
    cities: [],
    keyword: null,
    amenities: filters.amenities.filter((id) => !id.startsWith('near_')),
  };
}

const noMatchState = (filters: AiSearchFilters, target: LandmarkTarget | null): AvaSearchState => ({
  filters,
  landmarkKey: target?.key ?? null,
});

function clarification(
  resolution: LandmarkResolution,
  language: AvaLanguage,
  previous: AvaSearchState | null,
  filters: AiSearchFilters,
): AvaOutcome<never> | null {
  // Asking which place is not forgetting the rest: the budget, bedrooms and area
  // the tenant already gave stay in memory for the next message.
  const state: AvaSearchState = { filters, landmarkKey: previous?.landmarkKey ?? null };
  const strings = AVA_STRINGS[language];
  if (resolution.status === 'ambiguous') {
    return {
      reply: {
        text: strings.clarifyReply(resolution.label),
        quickReplies: resolution.options.map((option) => option.name),
      },
      listings: [],
      notes: {},
      state,
      shownIds: [],
      filters: null,
      language,
    };
  }
  if (resolution.status === 'unknown_place') {
    return {
      reply: {
        text: strings.unknownPlaceReply(resolution.label),
        quickReplies: ['Caloocan', 'Malabon', 'Navotas', 'Valenzuela'],
      },
      listings: [],
      notes: {},
      state,
      shownIds: [],
      filters: null,
      language,
    };
  }
  return null;
}

/**
 * Runs one Ava turn. `turns` is the whole conversation including the tenant's
 * newest message; `answer` is what the model (or the keyword reader) made of it.
 */
export async function answerAva<T>(
  answer: AvaAnswer,
  turns: AvaTurn[],
  fetchListings: AvaListingFetcher<T>,
  limit: number = AVA_RESULT_LIMIT,
): Promise<AvaOutcome<T>> {
  const language = avaConversationLanguage(turns);
  const strings = AVA_STRINGS[language];
  const { previous, shownIds } = deriveAvaContext(turns);
  const latest = latestUserText(turns);
  const filters = chooseFilters(answer, previous, latest);
  const { resolution, target } = chooseTarget(answer, latest, filters, previous);

  const ask = clarification(resolution, language, previous, filters);
  if (ask) return ask;

  const excludeIds = answer.wantsMore ? shownIds : [];
  const prefix = answer.source === 'limit' ? `${strings.limitNote} ` : '';

  if (!target) {
    if (countAiSearchFilters(filters) === 0) {
      return {
        reply: composeAvaReply(answer, null, language),
        listings: [],
        notes: {},
        state: previous,
        shownIds: [],
        filters: null,
        language,
      };
    }

    const found = await fetchListings({ filters, limit, excludeIds });
    const summary = describeSearch(filters, null, language);
    const base = composeAvaReply(answer, found.length, language);
    const reply =
      answer.wantsMore && found.length === 0
        ? { text: prefix + strings.noMoreReply, quickReplies: strings.loosenQuickReplies }
        : answer.wantsMore && answer.reply === null
          ? { ...base, text: prefix + strings.moreReply }
          : base;

    return {
      reply: withSummary(reply, summary),
      listings: found.map((entry) => entry.card),
      notes: Object.fromEntries(
        found.map((entry) => [entry.candidate.id, describeListing(entry.candidate, filters, language)]),
      ),
      state: noMatchState(filters, null),
      shownIds: found.map((entry) => entry.candidate.id),
      filters,
      language,
    };
  }

  // Landmark search: read the matching listings anywhere in CAMANAVA and rank
  // them by real distance, widening the radius only as far as needed.
  const searched = proximityFilters(filters);
  const pool = await fetchListings({ filters: searched, limit: AVA_PROXIMITY_POOL, excludeIds: [] });
  const byId = new Map(pool.map((entry) => [entry.candidate.id, entry]));
  const summary = describeSearch(filters, target, language);
  const ranking = rankByProximity(
    pool.map((entry) => entry.candidate),
    target,
    { limit: AVA_PROXIMITY_POOL, excludeIds },
  );
  // "Cheapest first" reorders the listings that are close enough; far ones keep
  // their distance order so a cheap listing across town is never called near.
  const byPrice =
    filters.sort === 'price_asc' || filters.sort === 'price_desc'
      ? (ranking.scenario === 'near' || ranking.scenario === 'nearby')
      : false;
  if (byPrice) {
    const direction = filters.sort === 'price_asc' ? 1 : -1;
    ranking.items.sort(
      (a, b) => direction * (a.item.monthlyRent - b.item.monthlyRent) || a.distanceKm - b.distanceKm,
    );
  }
  ranking.items = ranking.items.slice(0, limit);
  const state = noMatchState(filters, target);

  if (ranking.scenario === 'unlocated') {
    const sameCity = pool.filter((entry) => !target.city || entry.candidate.city === target.city);
    const shown = sameCity.filter((entry) => !excludeIds.includes(entry.candidate.id)).slice(0, limit);
    if (shown.length > 0) {
      return {
        reply: withSummary({ text: prefix + strings.unlocatedReply(target.label) }, summary),
        listings: shown.map((entry) => entry.card),
        notes: Object.fromEntries(
          shown.map((entry) => [entry.candidate.id, describeListing(entry.candidate, searched, language)]),
        ),
        state,
        shownIds: shown.map((entry) => entry.candidate.id),
        filters: searched,
        language,
      };
    }
  }

  if (ranking.items.length === 0) {
    const text =
      answer.wantsMore && ranking.scenario === 'none' && excludeIds.length > 0
        ? strings.noMoreReply
        : strings.noneNearReply(target.label);
    return {
      reply: withSummary({ text: prefix + text, quickReplies: strings.loosenQuickReplies }, summary),
      listings: [],
      notes: {},
      state,
      shownIds: [],
      filters: searched,
      language,
    };
  }

  const nearest = formatDistance(ranking.nearestKm ?? 0);
  const text =
    ranking.scenario === 'near'
      ? answer.wantsMore
        ? strings.moreReply
        : strings.nearReply(target.label)
      : answer.wantsMore
        ? strings.moreFartherReply(target.label, nearest)
        : ranking.scenario === 'nearby'
          ? strings.nearbyReply(target.label, nearest)
          : strings.fartherReply(target.label, nearest);

  const entries = ranking.items.map(({ item, distanceKm }) => ({
    found: byId.get(item.id) as AvaFound<T>,
    distanceKm,
  }));

  return {
    reply: withSummary({ text: prefix + text }, summary),
    listings: entries.map((entry) => entry.found.card),
    notes: Object.fromEntries(
      entries.map((entry) => [
        entry.found.candidate.id,
        describeListing(entry.found.candidate, searched, language, {
          km: entry.distanceKm,
          place: target.label,
        }),
      ]),
    ),
    state,
    shownIds: entries.map((entry) => entry.found.candidate.id),
    filters: searched,
    language,
  };
}

/**
 * The body for the `ai-search` function: only chat text plus what the
 * conversation already settled. Remembered searches and shown listing ids stay
 * on the device.
 */
export function buildAvaRequest(turns: AvaTurn[]): {
  messages: { role: AvaTurn['role']; text: string }[];
  context: { language: AvaLanguage; filters: AiSearchFilters | null; landmark: string | null };
} {
  const { previous } = deriveAvaContext(turns);
  return {
    messages: turns.map((turn) => ({ role: turn.role, text: turn.text })),
    context: {
      language: avaConversationLanguage(turns),
      filters: previous?.filters ?? null,
      landmark: previous?.landmarkKey ? (targetFromKey(previous.landmarkKey)?.label ?? null) : null,
    },
  };
}
