import { EMPTY_AI_SEARCH_FILTERS, mergeAiFilters, parseSearchKeywords, type AiSearchFilters } from './aiSearch';
import { avaFallbackAnswer, wantsMoreResults, type AvaAnswer, type AvaTurn } from './avaChat';
import { detectConversationLanguage, detectMessageLanguage } from './avaLanguage';
import { resolveLandmark, targetFromKey } from './avaLandmarks';
import { haversineKm, rankByProximity } from './avaProximity';
import { answerAva, type AvaCandidate, type AvaFound, type AvaListingFetcher } from './avaSearch';

const answerFor = (turns: AvaTurn[], overrides: Partial<AvaAnswer> = {}): AvaAnswer => ({
  ...avaFallbackAnswer(turns),
  ...overrides,
});

// Real positions: Grand Central is in Caloocan, Navotas City Hall in Navotas.
const GRAND_CENTRAL = { latitude: 14.65497, longitude: 120.98475 };

const listing = (
  id: string,
  latitude: number | null,
  longitude: number | null,
  extra: Partial<AvaCandidate> = {},
): AvaFound<{ id: string }> => ({
  card: { id },
  candidate: {
    id,
    monthlyRent: 9000,
    bedrooms: 1,
    amenities: [],
    latitude,
    longitude,
    city: 'Caloocan',
    ...extra,
  },
});

const fetcherFor =
  (rows: AvaFound<{ id: string }>[]): AvaListingFetcher<{ id: string }> =>
  async ({ excludeIds, limit }) =>
    rows.filter((row) => !excludeIds.includes(row.candidate.id)).slice(0, limit);

describe('language detection', () => {
  it('answers in English by default', () => {
    expect(detectMessageLanguage('Can you recommend apartments near SM Grand Central?')).toBe('en');
    expect(detectConversationLanguage([])).toBe('en');
  });

  it('answers in Tagalog when the tenant writes Tagalog', () => {
    expect(detectMessageLanguage('May apartment ba malapit sa SM Grand Central?')).toBe('tl');
  });

  it('follows a switch and keeps the language through short follow-ups', () => {
    expect(detectConversationLanguage(['Hi, I need a place in Malabon', 'May mura ba na malapit sa Monumento?'])).toBe('tl');
    expect(detectConversationLanguage(['May apartment ba sa Malabon?', '2BR'])).toBe('tl');
    expect(detectConversationLanguage(['May apartment ba sa Malabon?', 'Show me two bedrooms under 15k please'])).toBe('en');
  });
});

describe('landmark recognition', () => {
  it('finds landmarks without a city, by alias and with typos', () => {
    for (const text of [
      'Find an apartment near Monumento',
      'apartments around SM Grand Central',
      'malapit sa monumnto',
      'near grand sentral',
    ]) {
      const result = resolveLandmark(text);
      expect(result.status).toBe('found');
    }
    const grandCentral = resolveLandmark('Do you have apartments around SM Grand Central?');
    expect(grandCentral.status === 'found' && grandCentral.target.key).toBe('sm-grand-central');
  });

  it('asks which one when the name is shared', () => {
    expect(resolveLandmark('Find apartments near the city hall').status).toBe('ambiguous');
    expect(resolveLandmark('apartments near SM').status).toBe('ambiguous');
    const hall = resolveLandmark('apartments near the city hall in Navotas');
    expect(hall.status === 'found' && hall.target.key).toBe('navotas-city-hall');
  });

  it('targets every hospital in a city', () => {
    const result = resolveLandmark('I want to live near a hospital in Malabon');
    expect(result.status).toBe('found');
    if (result.status === 'found') expect(result.target.points.length).toBeGreaterThan(0);
  });

  it('does not guess places it does not know', () => {
    expect(resolveLandmark('near Sampaguita School').status).toBe('unknown_place');
    expect(resolveLandmark('near my school').status).toBe('unknown_place');
    expect(resolveLandmark('2 bedroom in Malabon').status).toBe('none');
  });

  it('restores a target from its key', () => {
    expect(targetFromKey('sm-grand-central')?.label).toBe('SM City Grand Central');
    expect(targetFromKey('nope')).toBeNull();
  });
});

describe('proximity ranking', () => {
  const target = targetFromKey('sm-grand-central')!;

  it('measures real straight-line distance', () => {
    const km = haversineKm(GRAND_CENTRAL, { latitude: GRAND_CENTRAL.latitude + 0.009, longitude: GRAND_CENTRAL.longitude });
    expect(km).toBeGreaterThan(0.95);
    expect(km).toBeLessThan(1.05);
  });

  it('puts the nearest first and never invents a distance for missing pins', () => {
    const ranking = rankByProximity(
      [
        { id: 'far', latitude: 14.7, longitude: 120.98 },
        { id: 'near', latitude: 14.6555, longitude: 120.985 },
        { id: 'nopin', latitude: null, longitude: null },
      ],
      target,
      { limit: 5 },
    );
    expect(ranking.scenario).toBe('near');
    expect(ranking.items.map((entry) => entry.item.id)).toEqual(['near']);
  });

  it('widens to nearby and then far areas', () => {
    const nearby = rankByProximity([{ id: 'a', latitude: 14.675, longitude: 120.985 }], target, { limit: 5 });
    expect(nearby.scenario).toBe('nearby');
    const far = rankByProximity([{ id: 'b', latitude: 14.75, longitude: 121.02 }], target, { limit: 5 });
    expect(far.scenario).toBe('farther');
    expect(rankByProximity([{ id: 'c', latitude: null, longitude: null }], target, { limit: 5 }).scenario).toBe('unlocated');
    expect(rankByProximity([], target, { limit: 5 }).scenario).toBe('none');
  });
});

describe('merging filters across messages', () => {
  it('keeps earlier details and lets new ones win', () => {
    const turns: AvaTurn[] = [
      { role: 'user', text: 'apartments in Malabon under 12k' },
      { role: 'assistant', text: 'ok' },
      { role: 'user', text: 'What if my budget is ₱8,000?' },
    ];
    const { filters } = avaFallbackAnswer(turns);
    expect(filters.cities).toEqual(['Malabon']);
    expect(filters.priceMax).toBe(8000);
  });

  it('clears the area on "any area"', () => {
    const merged = mergeAiFilters(
      { ...EMPTY_AI_SEARCH_FILTERS, cities: ['Malabon'] },
      parseSearchKeywords('any area in CAMANAVA'),
      'any area in CAMANAVA',
    );
    expect(merged.cities).toEqual([]);
  });

  it('recognizes requests for more', () => {
    expect(wantsMoreResults('Show me more.')).toBe(true);
    expect(wantsMoreResults('ipakita pa')).toBe(true);
    expect(wantsMoreResults('more than 2 bedrooms in Malabon')).toBe(false);
  });
});

describe('answerAva', () => {
  const turnsFor = (text: string, history: AvaTurn[] = []): AvaTurn[] => [...history, { role: 'user', text }];

  it('lists the nearest listings first with a distance note (English)', async () => {
    const turns = turnsFor('Can you recommend apartments near SM Grand Central?');
    const outcome = await answerAva(
      answerFor(turns),
      turns,
      fetcherFor([listing('far', 14.7, 120.98), listing('near', 14.6555, 120.985)]),
    );
    expect(outcome.listings.map((card) => card.id)).toEqual(['near']);
    expect(outcome.reply.text).toContain('closest to SM City Grand Central');
    expect(outcome.notes.near).toMatch(/from SM City Grand Central \(straight-line\)/);
    expect(outcome.state?.landmarkKey).toBe('sm-grand-central');
  });

  it('answers in Tagalog to a Tagalog question', async () => {
    const turns = turnsFor('May apartment ba malapit sa SM Grand Central?');
    const outcome = await answerAva(answerFor(turns), turns, fetcherFor([listing('near', 14.6555, 120.985)]));
    expect(outcome.language).toBe('tl');
    expect(outcome.reply.text.startsWith('Oo!')).toBe(true);
  });

  it('offers nearby alternatives when nothing is right next to the landmark', async () => {
    const turns = turnsFor('Are there apartments near Navotas City Hall?');
    const outcome = await answerAva(
      answerFor(turns),
      turns,
      fetcherFor([listing('alt', 14.6777, 120.9478, { city: 'Navotas' })]),
    );
    expect(outcome.reply.text).toContain("couldn't find available apartment listings immediately near Navotas City Hall");
    expect(outcome.listings).toHaveLength(1);
  });

  it('says so when the closest listings are far', async () => {
    const turns = turnsFor('apartments near Monumento');
    const outcome = await answerAva(answerFor(turns), turns, fetcherFor([listing('far', 14.77, 121.04)]));
    expect(outcome.reply.text).toContain('farther than you may want');
  });

  it('does not fabricate distances for listings without pins', async () => {
    const turns = turnsFor('apartments near Monumento');
    const outcome = await answerAva(answerFor(turns), turns, fetcherFor([listing('nopin', null, null)]));
    expect(outcome.reply.text).toContain("don't have map locations");
    expect(outcome.notes.nopin).not.toMatch(/km|\bm from/);
  });

  it('explains when nothing matches at all', async () => {
    const turns = turnsFor('apartments near Monumento');
    const outcome = await answerAva(answerFor(turns), turns, fetcherFor([]));
    expect(outcome.listings).toHaveLength(0);
    expect(outcome.reply.text).toContain('Try a higher budget');
  });

  it('asks which place instead of guessing', async () => {
    const turns = turnsFor('Find apartments near the city hall');
    const outcome = await answerAva(answerFor(turns), turns, fetcherFor([]));
    expect(outcome.reply.text).toBe('Which city hall do you mean?');
    expect(outcome.reply.quickReplies).toContain('Navotas City Hall');
  });

  it('keeps the budget but drops the landmark when a message names no place', async () => {
    const first = turnsFor('apartments near Monumento');
    const firstOutcome = await answerAva(answerFor(first), first, fetcherFor([listing('a', 14.6555, 120.985)]));
    const history: AvaTurn[] = [
      ...first,
      { role: 'assistant', text: firstOutcome.reply.text, search: firstOutcome.state!, shownIds: firstOutcome.shownIds },
    ];
    const turns = turnsFor('What if my budget is ₱8,000?', history);
    let requested: unknown = null;
    const outcome = await answerAva(answerFor(turns), turns, async (request) => {
      requested = request.filters.priceMax;
      return [listing('b', 14.6556, 120.985, { monthlyRent: 7500 })];
    });
    expect(requested).toBe(8000);
    expect(outcome.state?.landmarkKey).toBeNull();
    expect(outcome.state?.filters.priceMax).toBe(8000);
  });

  it('skips listings already shown on "show me more"', async () => {
    const rows = [listing('a', 14.6555, 120.985), listing('b', 14.656, 120.985)];
    const first = turnsFor('apartments near Monumento');
    const history: AvaTurn[] = [
      ...first,
      {
        role: 'assistant',
        text: 'here',
        search: { filters: parseSearchKeywords('apartments near Monumento'), landmarkKey: 'monumento' },
        shownIds: ['a'],
      },
    ];
    const turns = turnsFor('Show me more.', history);
    const outcome = await answerAva(answerFor(turns), turns, fetcherFor(rows));
    expect(outcome.listings.map((card) => card.id)).toEqual(['b']);
  });

  it('searches a bedroom range instead of picking one number', async () => {
    const turns = turnsFor("I'm looking for an apartment in Caloocan. My budget is ₱8,000 per month, with one or two bedrooms.");
    let requested: AiSearchFilters | null = null;
    const outcome = await answerAva(answerFor(turns), turns, async (request) => {
      requested = request.filters;
      return [listing('c1', 14.65, 120.98, { bedrooms: 1, city: 'Caloocan' })];
    });
    expect(requested).toMatchObject({ cities: ['Caloocan'], priceMax: 8000, bedrooms: '1', bedroomsMax: 2 });
    expect(outcome.reply.text).toContain('Searching: Caloocan · up to ₱8,000 · 1–2 bedrooms');
  });

  it('searches by filters when no place is named', async () => {
    const turns = turnsFor('2 bedroom sa Malabon hanggang 12k');
    const outcome = await answerAva(answerFor(turns), turns, fetcherFor([listing('m', 14.66, 120.95, { bedrooms: 2, city: 'Malabon' })]));
    expect(outcome.reply.text.startsWith('Narito ang mga tugma sa sinabi mo.')).toBe(true);
    expect(outcome.reply.text).toContain('Hinahanap: Malabon · hanggang ₱12,000 · 2 bedroom');
    expect(outcome.notes.m).toContain('pasok sa ₱12,000 mong budget');
  });

  it("does not read a city in a long request as a landmark, and searches by the stated filters", async () => {
    const message =
      "Hi Ava! I'm looking for an apartment in Caloocan. My budget is ₱8,000 per month, preferably with one or two bedrooms.";
    expect(resolveLandmark(message).status).toBe('none');

    const turns = turnsFor(message);
    let requested: AiSearchFilters | null = null;
    const outcome = await answerAva(answerFor(turns), turns, async (request) => {
      requested = request.filters;
      return [listing('c1', 14.65, 120.98, { monthlyRent: 7500 })];
    });
    expect(outcome.reply.text).not.toMatch(/Which/);
    expect(requested).toMatchObject({ cities: ['Caloocan'], priceMax: 8000 });
    expect(outcome.state?.landmarkKey).toBeNull();
  });

  it('remembers the budget and area while it asks which place, then uses them', async () => {
    const ambiguous = turnsFor('I need something under 9k near the city hall');
    const askOutcome = await answerAva(answerFor(ambiguous), ambiguous, fetcherFor([]));
    expect(askOutcome.reply.text).toBe('Which city hall do you mean?');
    expect(askOutcome.state?.filters.priceMax).toBe(9000);

    const history: AvaTurn[] = [
      ...ambiguous,
      { role: 'assistant', text: askOutcome.reply.text, search: askOutcome.state!, shownIds: [] },
    ];
    const answered = turnsFor('Navotas City Hall', history);
    let requested: AiSearchFilters | null = null;
    const outcome = await answerAva(answerFor(answered), answered, async (request) => {
      requested = request.filters;
      return [listing('n1', 14.6582, 120.9478, { city: 'Navotas' })];
    });
    expect(requested).toMatchObject({ priceMax: 9000 });
    expect(outcome.state?.landmarkKey).toBe('navotas-city-hall');
  });

  it('still forgives typos when the message points at a place', () => {
    expect(resolveLandmark('apartments near monumnto').status).toBe('found');
    expect(resolveLandmark('near grand sentral').status).toBe('found');
    expect(resolveLandmark('monumnto').status).toBe('found');
  });

  describe('consistency across a conversation', () => {
    const state = (filters: Partial<AiSearchFilters>, landmarkKey: string | null = null) => ({
      filters: { ...EMPTY_AI_SEARCH_FILTERS, ...filters },
      landmarkKey,
    });
    const afterSearch = (text: string, search: ReturnType<typeof state>, shownIds: string[] = []): AvaTurn[] => [
      { role: 'user', text: 'first' },
      { role: 'assistant', text: 'ok', search, shownIds },
      { role: 'user', text },
    ];
    const gemini = (filters: Partial<AiSearchFilters>, extra: Partial<AvaAnswer> = {}): AvaAnswer => ({
      source: 'gemini',
      reply: 'Sure, searching.',
      quickReplies: [],
      noResultsReply: null,
      noResultsQuickReplies: [],
      filters: { ...EMPTY_AI_SEARCH_FILTERS, ...filters },
      landmark: null,
      wantsMore: false,
      ...extra,
    });

    it('keeps the budget and area even when the model drops them', async () => {
      const turns = afterSearch('Are there any apartments with parking?', state({ cities: ['Caloocan'], priceMax: 8000 }));
      let requested: AiSearchFilters | null = null;
      await answerAva(gemini({ amenities: ['parking'] }), turns, async (request) => {
        requested = request.filters;
        return [listing('a', 14.65, 120.98)];
      });
      expect(requested).toMatchObject({ cities: ['Caloocan'], priceMax: 8000, amenities: ['parking'] });
    });

    it('lets an explicit "any budget" clear it', async () => {
      const turns = afterSearch('any budget is fine', state({ cities: ['Caloocan'], priceMax: 8000 }));
      let requested: AiSearchFilters | null = null;
      await answerAva(gemini({ cities: ['Caloocan'], bedrooms: '2' }), turns, async (request) => {
        requested = request.filters;
        return [];
      });
      expect(requested).toMatchObject({ cities: ['Caloocan'], priceMax: null, bedrooms: '2' });
    });

    it('orders nearby listings by price when asked for the cheapest', async () => {
      const turns = afterSearch('Show me the cheapest ones near it', state({}, 'monumento'));
      const outcome = await answerAva(
        gemini({ sort: 'price_asc' }),
        turns,
        fetcherFor([
          listing('pricey', 14.6575, 120.984, { monthlyRent: 30000 }),
          listing('cheap', 14.66, 120.985, { monthlyRent: 5000 }),
          listing('mid', 14.658, 120.984, { monthlyRent: 12000 }),
        ]),
      );
      expect(outcome.listings.map((card) => card.id)).toEqual(['cheap', 'mid', 'pricey']);
      expect(outcome.reply.text).toContain('cheapest first');
    });

    it('does not say nothing is close when "more" runs out of nearby listings', async () => {
      const turns = afterSearch('Show me more options', state({}, 'monumento'), ['shown']);
      const outcome = await answerAva(
        gemini({}, { wantsMore: true }),
        turns,
        fetcherFor([listing('shown', 14.6575, 120.984), listing('later', 14.7, 121.0)]),
      );
      expect(outcome.listings.map((card) => card.id)).toEqual(['later']);
      expect(outcome.reply.text).toContain('Here are more options.');
      expect(outcome.reply.text).not.toContain('no listings close');
    });

    it('keeps the landmark only when the tenant points back at it', async () => {
      const rows = [listing('a', 14.6575, 120.984)];
      const kept = await answerAva(gemini({}), afterSearch('Anything closer to it?', state({}, 'monumento')), fetcherFor(rows));
      expect(kept.state?.landmarkKey).toBe('monumento');
      const dropped = await answerAva(
        gemini({ amenities: ['parking'] }),
        afterSearch('Are there any apartments with parking?', state({ priceMax: 8000 }, 'monumento')),
        fetcherFor(rows),
      );
      expect(dropped.state?.landmarkKey).toBeNull();
      expect(dropped.state?.filters).toMatchObject({ priceMax: 8000, amenities: ['parking'] });
      expect(dropped.reply.text).not.toContain('Monumento');
    });

    it('says what it remembered', async () => {
      const turns = afterSearch('Can you recommend apartments near SM Grand Central?', state({ priceMax: 8000, bedrooms: '2' }));
      const outcome = await answerAva(gemini({}), turns, fetcherFor([listing('a', 14.6555, 120.985)]));
      expect(outcome.reply.text).toContain('Searching: near SM City Grand Central · up to ₱8,000 · 2 bedrooms');
    });

    it('replaces a reply in the wrong language with its own wording', async () => {
      const turns: AvaTurn[] = [{ role: 'user', text: "I'm looking for an apartment in Caloocan under 8000" }];
      const outcome = await answerAva(
        gemini({ cities: ['Caloocan'], priceMax: 8000 }, { reply: 'Hinahanap ko po ang apartment sa Caloocan na hanggang ₱8,000.', quickReplies: ['May parking po ba?', 'Kahit studio na lang'] }),
        turns,
        fetcherFor([listing('a', 14.65, 120.98)]),
      );
      expect(outcome.language).toBe('en');
      expect(outcome.reply.text.startsWith('Here are places that match what you told me.')).toBe(true);
      expect(outcome.reply.quickReplies).toBeUndefined();
    });
  });
});
