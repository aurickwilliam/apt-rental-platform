import { EMPTY_AI_SEARCH_FILTERS } from './aiSearch';
import {
  AVA_ASK_FOR_DETAILS,
  AVA_FOUND_REPLY,
  AVA_LIMIT_NOTE,
  AVA_LOOSEN_QUICK_REPLIES,
  AVA_NO_RESULTS,
  avaFallbackAnswer,
  composeAvaReply,
  hasAvaQuestion,
  readAvaResponse,
  shouldSearchForAva,
  type AvaAnswer,
  type AvaTurn,
} from './avaChat';

const TURNS: AvaTurn[] = [
  { role: 'user', text: 'sa Malabon' },
  { role: 'assistant', text: 'Ilang kwarto po?' },
  { role: 'user', text: '2 bedrooms' },
];

const GEMINI: AvaAnswer = {
  source: 'gemini',
  reply: 'Hinahanap ko po ang 2-bedroom sa Malabon.',
  quickReplies: ['May parking'],
  noResultsReply: 'Wala pa pong 2-bedroom sa Malabon.',
  noResultsQuickReplies: ['Ibang lugar'],
  filters: { ...EMPTY_AI_SEARCH_FILTERS, cities: ['Malabon'] },
};

describe('hasAvaQuestion', () => {
  it('needs a non-blank tenant message', () => {
    expect(hasAvaQuestion(TURNS)).toBe(true);
    expect(hasAvaQuestion([{ role: 'user', text: '  ' }])).toBe(false);
    expect(hasAvaQuestion([{ role: 'assistant', text: 'Hi' }])).toBe(false);
  });
});

describe('avaFallbackAnswer', () => {
  it('reads every tenant message, not just the last one', () => {
    const answer = avaFallbackAnswer(TURNS, 'limit');

    expect(answer.source).toBe('limit');
    expect(answer.filters).toMatchObject({ cities: ['Malabon'], bedrooms: '2' });
    expect(answer.reply).toBeNull();
  });
});

describe('readAvaResponse', () => {
  it('keeps a Gemini answer and sanitizes its filters', () => {
    const answer = readAvaResponse(
      {
        source: 'gemini',
        reply: 'OK po',
        quickReplies: ['Malabon', 7],
        noResultsReply: 'Wala pa po.',
        noResultsQuickReplies: ['Ibang lugar'],
        filters: { cities: ['Malabon', 'Makati'], priceMax: 15000 },
      },
      TURNS,
    );

    expect(answer).toMatchObject({
      source: 'gemini',
      reply: 'OK po',
      quickReplies: ['Malabon'],
      noResultsReply: 'Wala pa po.',
      noResultsQuickReplies: ['Ibang lugar'],
    });
    expect(answer.filters).toMatchObject({ cities: ['Malabon'], priceMax: 15000 });
  });

  it('falls back to the keyword reading for limit, fallback and malformed answers', () => {
    expect(readAvaResponse({ source: 'limit' }, TURNS).source).toBe('limit');
    expect(readAvaResponse({ source: 'fallback' }, TURNS).source).toBe('fallback');
    expect(readAvaResponse({ source: 'gemini', reply: 42 }, TURNS).source).toBe('fallback');
    expect(readAvaResponse(null, TURNS).filters.cities).toEqual(['Malabon']);
  });
});

describe('shouldSearchForAva', () => {
  it('searches only when something searchable was understood', () => {
    expect(shouldSearchForAva(GEMINI)).toBe(true);
    expect(shouldSearchForAva({ ...GEMINI, filters: EMPTY_AI_SEARCH_FILTERS })).toBe(false);
  });
});

describe('composeAvaReply', () => {
  it("uses Gemini's reply and quick replies when listings were found", () => {
    expect(composeAvaReply(GEMINI, 3)).toEqual({
      text: GEMINI.reply,
      quickReplies: ['May parking'],
    });
  });

  it("uses Gemini's no-results reply when nothing matched", () => {
    expect(composeAvaReply(GEMINI, 0)).toEqual({
      text: 'Wala pa pong 2-bedroom sa Malabon.',
      quickReplies: ['Ibang lugar'],
    });
  });

  it('has plain fallbacks for the keyword search', () => {
    const fallback = avaFallbackAnswer(TURNS);

    expect(composeAvaReply(fallback, 2)).toEqual({ text: AVA_FOUND_REPLY, quickReplies: undefined });
    expect(composeAvaReply(fallback, 0)).toEqual({
      text: AVA_NO_RESULTS,
      quickReplies: AVA_LOOSEN_QUICK_REPLIES,
    });
    expect(composeAvaReply(fallback, null)).toEqual({
      text: AVA_ASK_FOR_DETAILS,
      quickReplies: ['Caloocan', 'Malabon', 'Navotas', 'Valenzuela'],
    });
  });

  it('explains the daily limit before the reply', () => {
    expect(composeAvaReply(avaFallbackAnswer(TURNS, 'limit'), 1).text).toBe(
      `${AVA_LIMIT_NOTE} ${AVA_FOUND_REPLY}`,
    );
  });
});
