// Conversation rules for Ava, the APT Virtual Assistant, shared by the web
// and mobile chat screens. Each platform only calls the `ai-search` edge
// function and searches listings with its own client; reading the function's
// answer, falling back to the keyword parser and choosing what Ava says
// happen here, so both platforms behave the same.

import { CAMANAVA_CITIES } from '@repo/constants';

import {
  countAiSearchFilters,
  parseSearchKeywords,
  sanitizeAiFilters,
  type AiSearchFilters,
} from './aiSearch';

/** Listings shown under one of Ava's replies. */
export const AVA_RESULT_LIMIT = 5;

export type AvaSource = 'gemini' | 'fallback' | 'limit';

export interface AvaTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface AvaAnswer {
  source: AvaSource;
  reply: string | null;
  quickReplies: string[];
  /** Said instead of `reply` when the search finds nothing (Gemini answers before the search). */
  noResultsReply: string | null;
  noResultsQuickReplies: string[];
  filters: AiSearchFilters;
}

export interface AvaReply {
  text: string;
  quickReplies?: string[];
}

export const AVA_ASK_FOR_DETAILS =
  "I'd love to help! Tell me the area, your monthly budget, or how many bedrooms you need.";
export const AVA_FOUND_REPLY = 'Here are places that match what you told me.';
export const AVA_NO_RESULTS =
  "I couldn't find a match yet. Try a higher budget, fewer must-haves, or another area.";
export const AVA_LIMIT_NOTE = "I've answered a lot today, so I'm using simple search for now.";
export const AVA_LISTINGS_ERROR = "Sorry, I couldn't load listings right now. Please try again.";
export const AVA_GENERIC_ERROR = "Sorry, I couldn't process that. Please try again.";
export const AVA_LOOSEN_QUICK_REPLIES = ['Any area in CAMANAVA', 'Higher budget', 'Any unit type'];
const CITY_QUICK_REPLIES = [...CAMANAVA_CITIES];

const toStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

/** True when the conversation has at least one message from the tenant. */
export function hasAvaQuestion(turns: AvaTurn[]): boolean {
  return turns.some((turn) => turn.role === 'user' && turn.text.trim() !== '');
}

/**
 * The keyword reading of the whole conversation, used when Gemini does not
 * answer. All of the tenant's messages count, so details from earlier turns
 * ("sa Malabon", then "2 bedrooms") still apply.
 */
export function avaFallbackAnswer(turns: AvaTurn[], source: AvaSource = 'fallback'): AvaAnswer {
  const userText = turns
    .filter((turn) => turn.role === 'user')
    .map((turn) => turn.text)
    .join('. ');

  return {
    source,
    reply: null,
    quickReplies: [],
    noResultsReply: null,
    noResultsQuickReplies: [],
    filters: parseSearchKeywords(userText),
  };
}

/** Reads the `ai-search` response. Anything unexpected becomes the keyword fallback. */
export function readAvaResponse(data: unknown, turns: AvaTurn[]): AvaAnswer {
  const response = (data ?? {}) as Record<string, unknown>;

  if (response.source === 'limit') return avaFallbackAnswer(turns, 'limit');
  if (response.source !== 'gemini' || typeof response.reply !== 'string') {
    return avaFallbackAnswer(turns);
  }

  return {
    source: 'gemini',
    reply: response.reply,
    quickReplies: toStringList(response.quickReplies),
    noResultsReply: typeof response.noResultsReply === 'string' ? response.noResultsReply : null,
    noResultsQuickReplies: toStringList(response.noResultsQuickReplies),
    filters: sanitizeAiFilters(response.filters),
  };
}

/** False when nothing searchable was understood; Ava asks for details instead of searching. */
export function shouldSearchForAva(answer: AvaAnswer): boolean {
  return countAiSearchFilters(answer.filters) > 0;
}

/**
 * What Ava says for an answer. Pass `null` when there was no search (nothing
 * searchable was understood), otherwise the number of listings found.
 */
export function composeAvaReply(answer: AvaAnswer, foundCount: number | null): AvaReply {
  const prefix = answer.source === 'limit' ? `${AVA_LIMIT_NOTE} ` : '';
  const quickReplies = answer.quickReplies.length > 0 ? answer.quickReplies : undefined;

  if (foundCount === null) {
    return {
      text: prefix + (answer.reply ?? AVA_ASK_FOR_DETAILS),
      quickReplies: quickReplies ?? CITY_QUICK_REPLIES,
    };
  }

  if (foundCount === 0) {
    // Gemini wrote its main reply before the search; its no-results reply keeps
    // the message in the tenant's language and suggests loosening the search.
    return {
      text: prefix + (answer.noResultsReply ?? AVA_NO_RESULTS),
      quickReplies:
        answer.noResultsQuickReplies.length > 0
          ? answer.noResultsQuickReplies
          : AVA_LOOSEN_QUICK_REPLIES,
    };
  }

  return { text: prefix + (answer.reply ?? AVA_FOUND_REPLY), quickReplies };
}
