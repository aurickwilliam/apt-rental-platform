// Conversation rules for Ava, the APT Virtual Assistant, shared by the web
// and mobile chat screens. Each platform only calls the `ai-search` edge
// function and searches listings with its own client; reading the function's
// answer, falling back to the keyword parser and choosing what Ava says
// happen here, so both platforms behave the same.

import { CAMANAVA_CITIES } from '@repo/constants';

import {
  EMPTY_AI_SEARCH_FILTERS,
  countAiSearchFilters,
  mergeAiFilters,
  parseSearchKeywords,
  sanitizeAiFilters,
  type AiSearchFilters,
} from './aiSearch';
import { detectConversationLanguage, type AvaLanguage } from './avaLanguage';
import { AVA_STRINGS } from './avaStrings';

/** Listings shown under one of Ava's replies. */
export const AVA_RESULT_LIMIT = 5;

export type AvaSource = 'gemini' | 'fallback' | 'limit';

/** What a search settled on, remembered so follow-ups can build on it. */
export interface AvaSearchState {
  filters: AiSearchFilters;
  /** Key of the landmark the search measured distance to (`targetFromKey`), if any. */
  landmarkKey: string | null;
}

export interface AvaTurn {
  role: 'user' | 'assistant';
  text: string;
  /** Assistant turns: the search this reply ran. Never sent to the model as text. */
  search?: AvaSearchState;
  /** Assistant turns: ids of the listings shown, so "show me more" skips them. */
  shownIds?: string[];
}

export interface AvaAnswer {
  source: AvaSource;
  reply: string | null;
  quickReplies: string[];
  /** Said instead of `reply` when the search finds nothing (Gemini answers before the search). */
  noResultsReply: string | null;
  noResultsQuickReplies: string[];
  filters: AiSearchFilters;
  /** A place the tenant named (Gemini's reading); resolved against the landmark list. */
  landmark: string | null;
  /** The tenant asked for more results of the same search. */
  wantsMore: boolean;
}

export interface AvaReply {
  text: string;
  quickReplies?: string[];
}

export const AVA_ASK_FOR_DETAILS = AVA_STRINGS.en.askForDetails;
export const AVA_FOUND_REPLY = AVA_STRINGS.en.found;
export const AVA_NO_RESULTS = AVA_STRINGS.en.noResults;
export const AVA_LIMIT_NOTE = AVA_STRINGS.en.limitNote;
export const AVA_LISTINGS_ERROR = AVA_STRINGS.en.listingsError;
export const AVA_GENERIC_ERROR = AVA_STRINGS.en.genericError;
export const AVA_LOOSEN_QUICK_REPLIES = AVA_STRINGS.en.loosenQuickReplies;
const CITY_QUICK_REPLIES = [...CAMANAVA_CITIES];

const toStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

/** True when the conversation has at least one message from the tenant. */
export function hasAvaQuestion(turns: AvaTurn[]): boolean {
  return turns.some((turn) => turn.role === 'user' && turn.text.trim() !== '');
}

const MORE_PATTERNS = [
  /\b(?:show|see|give|need|want|any|got)\s+(?:me\s+)?(?:some\s+)?more\b/,
  /^(?:more|more please|more options|more results|next|others|other options)$/,
  /\b(?:iba pa|ipakita pa|dagdag pa|marami pa|may iba pa|pa more)\b/,
];

/** True when the message only asks for more of the same search. */
export function wantsMoreResults(message: string): boolean {
  const text = message.toLowerCase().replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();
  return text !== '' && MORE_PATTERNS.some((pattern) => pattern.test(text));
}

const userTexts = (turns: AvaTurn[]) =>
  turns.filter((turn) => turn.role === 'user' && turn.text.trim() !== '').map((turn) => turn.text);

/**
 * The keyword reading of the whole conversation, used when Gemini does not
 * answer. Each of the tenant's messages is read in turn and merged over the
 * earlier ones, so "sa Malabon" then "2 bedrooms" keeps Malabon, and a later
 * "budget is 8k" replaces an earlier budget.
 */
export function avaFallbackAnswer(turns: AvaTurn[], source: AvaSource = 'fallback'): AvaAnswer {
  const messages = userTexts(turns);
  const filters = messages.reduce(
    (merged, message) => mergeAiFilters(merged, parseSearchKeywords(message), message),
    { ...EMPTY_AI_SEARCH_FILTERS },
  );

  return {
    source,
    reply: null,
    quickReplies: [],
    noResultsReply: null,
    noResultsQuickReplies: [],
    filters,
    landmark: null,
    wantsMore: messages.length > 0 && wantsMoreResults(messages[messages.length - 1]),
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
    landmark:
      typeof response.landmark === 'string' && response.landmark.trim() !== ''
        ? response.landmark.trim().slice(0, 80)
        : null,
    wantsMore:
      response.wantsMore === true ||
      wantsMoreResults(userTexts(turns).slice(-1)[0] ?? ''),
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
export function composeAvaReply(
  answer: AvaAnswer,
  foundCount: number | null,
  language: AvaLanguage = 'en',
): AvaReply {
  const strings = AVA_STRINGS[language];
  const prefix = answer.source === 'limit' ? `${strings.limitNote} ` : '';
  const quickReplies = answer.quickReplies.length > 0 ? answer.quickReplies : undefined;

  if (foundCount === null) {
    return {
      text: prefix + (answer.reply ?? strings.askForDetails),
      quickReplies: quickReplies ?? CITY_QUICK_REPLIES,
    };
  }

  if (foundCount === 0) {
    // Gemini wrote its main reply before the search; its no-results reply keeps
    // the message in the tenant's language and suggests loosening the search.
    return {
      text: prefix + (answer.noResultsReply ?? strings.noResults),
      quickReplies:
        answer.noResultsQuickReplies.length > 0
          ? answer.noResultsQuickReplies
          : strings.loosenQuickReplies,
    };
  }

  return { text: prefix + (answer.reply ?? strings.found), quickReplies };
}

/** The language of the conversation so far, from the tenant's own messages. */
export function avaConversationLanguage(turns: AvaTurn[]): AvaLanguage {
  return detectConversationLanguage(userTexts(turns));
}
