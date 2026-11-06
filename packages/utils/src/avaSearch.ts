// Ava's search orchestration, shared by web and mobile. Given what Gemini (or
// the keyword reader) understood and the conversation so far, it decides what
// to do: ask which place the tenant means, search by filters, or search by
// distance to a landmark with progressive fallback. Each platform only
// supplies `fetchListings`, which reads real apartments through its own
// Supabase client (RLS decides what is visible), so Ava can never show a
// listing that does not exist.

import {
  countAiSearchFilters,
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

function chooseFilters(answer: AvaAnswer, previous: AvaSearchState | null): AiSearchFilters {
  // Gemini was shown the remembered search and returns the full updated filters;
  // when it returns none (a bare "show me more"), the remembered search stands.
  if (countAiSearchFilters(answer.filters) === 0 && previous) return previous.filters;
  return answer.filters;
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

  // No new place in this message: budget, bedroom and "closer to it" follow-ups
  // keep the remembered one, unless the tenant moved to another area.
  const moved = findMentionedCity(latest) !== null || wantsAnyArea(latest);
  const remembered = previous?.landmarkKey && !moved ? targetFromKey(previous.landmarkKey) : null;
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
): AvaOutcome<never> | null {
  const strings = AVA_STRINGS[language];
  if (resolution.status === 'ambiguous') {
    return {
      reply: {
        text: strings.clarifyReply(resolution.label),
        quickReplies: resolution.options.map((option) => option.name),
      },
      listings: [],
      notes: {},
      state: previous,
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
      state: previous,
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
  const filters = chooseFilters(answer, previous);
  const { resolution, target } = chooseTarget(answer, latest, filters, previous);

  const ask = clarification(resolution, language, previous);
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
    const base = composeAvaReply(answer, found.length, language);
    const reply =
      answer.wantsMore && found.length === 0
        ? { text: prefix + strings.noMoreReply, quickReplies: strings.loosenQuickReplies }
        : answer.wantsMore && answer.reply === null
          ? { ...base, text: prefix + strings.moreReply }
          : base;

    return {
      reply,
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
  const ranking = rankByProximity(
    pool.map((entry) => entry.candidate),
    target,
    { limit, excludeIds },
  );
  const state = noMatchState(filters, target);

  if (ranking.scenario === 'unlocated') {
    const sameCity = pool.filter((entry) => !target.city || entry.candidate.city === target.city);
    const shown = sameCity.filter((entry) => !excludeIds.includes(entry.candidate.id)).slice(0, limit);
    if (shown.length > 0) {
      return {
        reply: { text: prefix + strings.unlocatedReply(target.label) },
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
      reply: { text: prefix + text, quickReplies: strings.loosenQuickReplies },
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
      : ranking.scenario === 'nearby'
        ? strings.nearbyReply(target.label, nearest)
        : strings.fartherReply(target.label, nearest);

  const entries = ranking.items.map(({ item, distanceKm }) => ({
    found: byId.get(item.id) as AvaFound<T>,
    distanceKm,
  }));

  return {
    reply: { text: prefix + text },
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
