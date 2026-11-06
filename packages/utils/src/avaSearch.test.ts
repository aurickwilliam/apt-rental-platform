import { EMPTY_AI_SEARCH_FILTERS, mergeAiFilters, parseSearchKeywords, type AiSearchFilters } from './aiSearch';
import { avaFallbackAnswer, readAvaResponse, wantsMoreResults, type AvaAnswer, type AvaTurn } from './avaChat';
import { detectConversationLanguage, detectMessageLanguage } from './avaLanguage';
import { smallTalkKind } from './avaSmallTalk';
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
  async ({ excludeIds, limit, ids }) =>
    ids
      ? rows.filter((row) => ids.includes(row.candidate.id))
      : rows.filter((row) => !excludeIds.includes(row.candidate.id)).slice(0, limit);

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
      requested ??= request.filters;
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
        requested ??= request.filters;
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

    it("does not trust the model's wantsMore flag for an ordinary question", () => {
      const turns: AvaTurn[] = [{ role: 'user', text: 'Are there any apartments with parking?' }];
      const answer = readAvaResponse(
        { source: 'gemini', reply: 'Sure!', quickReplies: [], filters: {}, wantsMore: true },
        turns,
      );
      expect(answer.wantsMore).toBe(false);
      const more = readAvaResponse(
        { source: 'gemini', reply: 'Sure!', quickReplies: [], filters: {}, wantsMore: false },
        [{ role: 'user', text: 'Show me more options, but prioritize the cheapest ones.' }],
      );
      expect(more.wantsMore).toBe(true);
    });

    it('orders far listings by price too when asked for the cheapest, and says so', async () => {
      const turns = afterSearch('Show me more options, but prioritize the cheapest ones.', state({ sort: null }, 'monumento'), ['gone']);
      const outcome = await answerAva(
        gemini({ sort: 'price_asc' }, { wantsMore: true }),
        turns,
        fetcherFor([
          listing('gone', 14.6575, 120.984),
          listing('a', 14.71, 121.0, { monthlyRent: 8000 }),
          listing('b', 14.73, 121.0, { monthlyRent: 4000 }),
          listing('c', 14.75, 121.02, { monthlyRent: 5000 }),
        ]),
      );
      expect(outcome.listings.map((card) => card.id)).toEqual(['b', 'c', 'a']);
      const far = await answerAva(
        gemini({ sort: 'price_asc' }),
        afterSearch('cheapest near monumento', state({}, null)),
        fetcherFor([listing('a', 14.71, 121.0, { monthlyRent: 8000 }), listing('b', 14.73, 121.0, { monthlyRent: 4000 })]),
      );
      expect(far.reply.text).toContain('cheapest first');
      expect(far.reply.text).not.toContain('nearest first');
    });

    it('tells the tenant when the session expired and still searches', async () => {
      const turns: AvaTurn[] = [{ role: 'user', text: 'apartments in Malabon under 9k' }];
      const outcome = await answerAva(
        avaFallbackAnswer(turns, 'session'),
        turns,
        fetcherFor([listing('m', 14.66, 120.95, { city: 'Malabon' })]),
      );
      expect(outcome.reply.text).toContain('your session expired');
      expect(outcome.listings).toHaveLength(1);
      const tagalog: AvaTurn[] = [{ role: 'user', text: 'May apartment ba sa Malabon hanggang 9k?' }];
      const tl = await answerAva(avaFallbackAnswer(tagalog, 'session'), tagalog, fetcherFor([]));
      expect(tl.reply.text).toContain('nag-expire ang session');
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

  describe('no exact match', () => {
    it('suggests the closest listings and says how they differ', async () => {
      const turns = turnsFor('2 bedroom pet friendly in Malabon under 9k');
      const calls: AiSearchFilters[] = [];
      const outcome = await answerAva(answerFor(turns), turns, async (request) => {
        calls.push(request.filters);
        // Nothing matches the strict search; the loosened pool has three listings.
        if (calls.length === 1) return [];
        return [
          listing('far-city', 14.65, 120.98, { monthlyRent: 8500, bedrooms: 2, city: 'Valenzuela', amenities: ['petfriendly'] }),
          listing('over', 14.66, 120.95, { monthlyRent: 10500, bedrooms: 2, city: 'Malabon', amenities: ['petfriendly'] }),
          listing('nopets', 14.66, 120.95, { monthlyRent: 8800, bedrooms: 2, city: 'Malabon', amenities: [] }),
        ];
      });
      expect(calls[1]).toMatchObject({ cities: [], priceMax: null, bedrooms: null, amenities: [] });
      // Same area beats a different area; the nearest miss on budget or amenities comes first.
      expect(outcome.listings.map((card) => card.id)).toEqual(['nopets', 'over', 'far-city']);
      expect(outcome.reply.text).toContain("couldn't find an exact match");
      expect(outcome.reply.text).toContain('budget');
      expect(outcome.notes.over).toContain('₱1,500 over your budget');
      expect(outcome.notes.nopets).toContain('no pets allowed listed');
      expect(outcome.notes['far-city']).toContain('in Valenzuela, outside your area');
      // The remembered search stays what was asked, not the loosened one.
      expect(outcome.state?.filters).toMatchObject({ cities: ['Malabon'], priceMax: 9000, bedrooms: '2' });
    });

    it('still says so when there is nothing at all', async () => {
      const turns = turnsFor('2 bedroom in Malabon under 9k');
      const outcome = await answerAva(answerFor(turns), turns, async () => []);
      expect(outcome.listings).toEqual([]);
      expect(outcome.reply.text).toContain("couldn't find a match yet");
    });

    it('loosens a landmark search and keeps ranking by distance', async () => {
      const turns = turnsFor('2 bedroom under 5k near Monumento');
      let calls = 0;
      const outcome = await answerAva(answerFor(turns), turns, async () => {
        calls += 1;
        return calls === 1 ? [] : [listing('a', 14.6575, 120.984, { monthlyRent: 9000, bedrooms: 1 })];
      });
      expect(outcome.reply.text).toContain('loosened your filters');
      expect(outcome.notes.a).toContain('over your budget');
      expect(outcome.listings).toHaveLength(1);
    });

    it('speaks Tagalog when asked in Tagalog', async () => {
      const turns = turnsFor('May apartment ba sa Malabon hanggang 5k?');
      let calls = 0;
      const outcome = await answerAva(answerFor(turns), turns, async () => {
        calls += 1;
        return calls === 1 ? [] : [listing('a', 14.66, 120.95, { monthlyRent: 7000, city: 'Malabon' })];
      });
      expect(outcome.reply.text).toContain('Wala akong nahanap na eksaktong tugma');
      expect(outcome.notes.a).toContain('sobra sa budget mo');
    });
  });

  describe('off-topic messages', () => {
    const remembered = (text: string): AvaTurn[] => [
      { role: 'user', text: 'first' },
      {
        role: 'assistant',
        text: 'ok',
        search: { filters: { ...EMPTY_AI_SEARCH_FILTERS, cities: ['Malabon'], amenities: ['near_hospital'], sort: 'price_asc' as const }, landmarkKey: null },
        shownIds: [],
      },
      { role: 'user', text },
    ];
    const never = async () => {
      throw new Error('must not search');
    };

    it('recognises small talk and nothing that asks for a place', () => {
      expect(smallTalkKind('Kumain kana ba?')).toBe('howAreYou');
      expect(smallTalkKind('Hi Ava!')).toBe('greeting');
      expect(smallTalkKind('thank you po')).toBe('thanks');
      expect(smallTalkKind('Who are you?')).toBe('who');
      expect(smallTalkKind('thanks, now find me a 2BR in Malabon')).toBeNull();
      expect(smallTalkKind('2BR in Malabon')).toBeNull();
    });

    it('answers "Kumain kana ba?" in Tagalog with personality and does not rerun the old search', async () => {
      const turns = remembered('Kumain kana ba?');
      const outcome = await answerAva(answerFor(turns), turns, never);
      expect(outcome.language).toBe('tl');
      expect(outcome.reply.text).toContain('kumain ka na ba');
      expect(outcome.reply.text).toContain('Balik na tayo sa paghahanap ng apartment');
      expect(outcome.listings).toEqual([]);
      expect(outcome.state?.filters.cities).toEqual(['Malabon']);
    });

    it("uses the model's own answer to a general question, then steers back", async () => {
      const turns = remembered('What is the capital of France?');
      const answer: AvaAnswer = {
        ...answerFor(turns),
        source: 'gemini',
        reply: "Paris, of course! Now, let's get back to finding your apartment.",
        offTopic: true,
      };
      const outcome = await answerAva(answer, turns, never);
      expect(outcome.reply.text).toContain('Paris');
      expect(outcome.listings).toEqual([]);
    });

    it("does not believe the model's offTopic flag when the message has search details", async () => {
      const turns = remembered('apartments in Navotas under 9k');
      const answer: AvaAnswer = { ...answerFor(turns), source: 'gemini', reply: 'Chatting!', offTopic: true };
      let searched = false;
      await answerAva(answer, turns, async () => {
        searched = true;
        return [listing('a', 14.66, 120.94, { city: 'Navotas' })];
      });
      expect(searched).toBe(true);
    });

    it('falls back to its own line when the model reply is in the wrong language', async () => {
      const turns = [{ role: 'user' as const, text: 'Tell me a joke about clowns' }];
      const answer: AvaAnswer = { ...answerFor(turns), source: 'gemini', reply: 'Hehe, ito ay isang biro para sa iyo po.', offTopic: true };
      const outcome = await answerAva(answer, turns, never);
      expect(outcome.reply.text).toContain('apartments are my thing');
    });
  });

  describe('review fixes', () => {
    it('keeps the unit type when loosening, so a closest match is never the wrong type', async () => {
      const turns = turnsFor('studio in Malabon under 9k');
      const requests: AiSearchFilters[] = [];
      await answerAva(answerFor(turns), turns, async (request) => {
        requests.push(request.filters);
        return [];
      });
      expect(requests[1]).toMatchObject({ types: ['Studio'], cities: [], priceMax: null });
    });

    it('reads photos only for the listings it shows', async () => {
      const turns = turnsFor('apartments near Monumento');
      const calls: { light?: boolean; ids?: string[] }[] = [];
      await answerAva(answerFor(turns), turns, async (request) => {
        calls.push({ light: request.light, ids: request.ids });
        return [listing('a', 14.6575, 120.984), listing('b', 14.658, 120.985)];
      });
      expect(calls[0]).toMatchObject({ light: true });
      expect(calls[1].ids).toEqual(['a', 'b']);
    });

    it('does not treat "sige po" as goodbye', () => {
      expect(smallTalkKind('Sige po')).toBeNull();
      expect(smallTalkKind('bye')).toBe('bye');
    });

    it('searches from the preferences, not from earlier messages in the chat', async () => {
      const turns: AvaTurn[] = [
        { role: 'user', text: 'apartments in Navotas under 6k' },
        { role: 'assistant', text: 'ok' },
        { role: 'user', text: 'Search with my preferences' },
      ];
      let requested: AiSearchFilters | null = null;
      await answerAva(avaFallbackAnswer(turns), turns, async (request) => {
        requested ??= request.filters;
        return [];
      }, 5, {
        preferences: {
          selectedCities: ['Caloocan'], budgetMin: 5000, budgetMax: 20000, bedroomCount: null, householdSize: null,
          hasPets: false, hasParking: false, hasSmoker: false, hasDisability: false,
        },
      });
      expect(requested).toMatchObject({ cities: ['Caloocan'], priceMax: 20000 });
    });
  });
});
