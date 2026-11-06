import { avaFallbackAnswer, shouldAskAvaModel, type AvaTurn } from './avaChat';
import {
  asksAboutPreferences,
  describePreferences,
  hasAvaPreferences,
  preferencesToFilters,
  type AvaPreferences,
} from './avaPreferences';
import { answerAva, type AvaCandidate, type AvaFound } from './avaSearch';

const PREFS: AvaPreferences = {
  selectedCities: ['Caloocan', 'Malabon'],
  budgetMin: 5000,
  budgetMax: 15000,
  bedroomCount: '1-2 Bedrooms',
  householdSize: 'Family of 2',
  hasPets: true,
  kindOfPets: ['Dog'],
  noOfPets: 1,
  hasParking: true,
  noOfParkingSpots: 1,
  hasSmoker: false,
  hasDisability: false,
};

const EMPTY_PREFS: AvaPreferences = {
  selectedCities: [],
  budgetMin: 5000,
  budgetMax: 100000,
  bedroomCount: null,
  householdSize: null,
  hasPets: false,
  hasParking: false,
  hasSmoker: false,
  hasDisability: false,
};

const listing = (id: string, extra: Partial<AvaCandidate> = {}): AvaFound<{ id: string }> => ({
  card: { id },
  candidate: { id, monthlyRent: 9000, bedrooms: 1, amenities: [], latitude: 14.65, longitude: 120.98, city: 'Caloocan', ...extra },
});

const turnsFor = (text: string): AvaTurn[] => [{ role: 'user', text }];

describe('asksAboutPreferences', () => {
  it('tells a summary from a search', () => {
    expect(asksAboutPreferences('Can you summarize my apartment preferences?')).toBe('summarize');
    expect(asksAboutPreferences('What are my preferences?')).toBe('summarize');
    expect(asksAboutPreferences('ano ang preferences ko')).toBe('summarize');
    expect(asksAboutPreferences('Find apartments based on my preferences')).toBe('apply');
    expect(asksAboutPreferences('Search with my preferences')).toBe('apply');
    expect(asksAboutPreferences('Hanapin ayon sa preferences ko')).toBe('apply');
    expect(asksAboutPreferences('Recommend something for me')).toBe('apply');
    expect(asksAboutPreferences('2BR in Malabon')).toBeNull();
    // A real search that happens to mention "for me" or "preferences" stays a search.
    expect(asksAboutPreferences('Can you recommend apartments near SM Grand Central for me?')).toBeNull();
    expect(asksAboutPreferences('My preferences are 2BR in Malabon under 9k')).toBeNull();
  });

  it('keeps those messages away from the model', () => {
    expect(shouldAskAvaModel(turnsFor('Can you summarize my apartment preferences?'))).toBe(false);
    expect(shouldAskAvaModel(turnsFor('2BR in Malabon'))).toBe(true);
  });
});

describe('preferences as a search', () => {
  it('maps saved choices to filters and ignores the default budget', () => {
    expect(preferencesToFilters(PREFS)).toMatchObject({
      cities: ['Caloocan', 'Malabon'],
      priceMin: null,
      priceMax: 15000,
      bedrooms: '1',
      bedroomsMax: 2,
      amenities: ['petfriendly', 'parking'],
    });
    expect(preferencesToFilters({ ...PREFS, budgetMax: 100000, bedroomCount: '4+ Bedrooms' })).toMatchObject({
      priceMax: null,
      bedrooms: '4+',
      bedroomsMax: null,
    });
    expect(hasAvaPreferences(EMPTY_PREFS)).toBe(false);
    expect(hasAvaPreferences(PREFS)).toBe(true);
  });

  it('describes only what was answered, in the tenant\'s language', () => {
    const text = describePreferences(PREFS, 'en');
    expect(text).toContain('• Area: Caloocan, Malabon');
    expect(text).toContain('• Budget: up to ₱15,000 a month');
    expect(text).toContain('• Bedrooms: 1-2');
    expect(text).toContain('• Pets: Dog');
    expect(text).toContain('• Parking: 1 spot');
    expect(text).not.toContain('Smoker');
    expect(describePreferences(PREFS, 'tl')).toContain('• Lugar: Caloocan, Malabon');
  });
});

describe('answerAva with saved preferences', () => {
  const fetcher = (rows: AvaFound<{ id: string }>[], seen: { filters: unknown }) => async (request: { filters: unknown }) => {
    seen.filters ??= request.filters;
    return rows;
  };

  it('summarises the preferences without searching or asking the model', async () => {
    const turns = turnsFor('Can you summarize my apartment preferences?');
    const seen = { filters: null as unknown };
    const outcome = await answerAva(avaFallbackAnswer(turns), turns, fetcher([listing('a')], seen), 5, { preferences: PREFS });
    expect(outcome.reply.text).toContain("Here's what you saved in your rental preferences:");
    expect(outcome.reply.text).toContain('Want me to search with these?');
    expect(outcome.reply.quickReplies).toEqual(['Search with my preferences']);
    expect(outcome.listings).toEqual([]);
    expect(seen.filters).toBeNull();
  });

  it('searches from the preferences and says so', async () => {
    const turns = turnsFor('Search with my preferences');
    const seen = { filters: null as unknown };
    const outcome = await answerAva(avaFallbackAnswer(turns), turns, fetcher([listing('a')], seen), 5, { preferences: PREFS });
    expect(seen.filters).toMatchObject({ cities: ['Caloocan', 'Malabon'], priceMax: 15000, bedrooms: '1', bedroomsMax: 2 });
    expect(outcome.reply.text).toContain('Using your saved preferences.');
    expect(outcome.reply.text).toContain('Searching: Caloocan / Malabon · up to ₱15,000 · 1–2 bedrooms');
    expect(outcome.listings).toHaveLength(1);
  });

  it('adds what the message says on top of the preferences', async () => {
    const turns = turnsFor('Find apartments based on my preferences but under 9k');
    const seen = { filters: null as unknown };
    await answerAva(avaFallbackAnswer(turns), turns, fetcher([], seen), 5, { preferences: PREFS });
    expect(seen.filters).toMatchObject({ cities: ['Caloocan', 'Malabon'], priceMax: 9000 });
  });

  it('answers in Tagalog to a Tagalog question', async () => {
    const turns = turnsFor('Ano ang preferences ko?');
    const outcome = await answerAva(avaFallbackAnswer(turns), turns, fetcher([], { filters: null }), 5, { preferences: PREFS });
    expect(outcome.language).toBe('tl');
    expect(outcome.reply.text).toContain('Narito ang mga na-save mo');
  });

  it('says so when nothing is saved instead of inventing preferences', async () => {
    const turns = turnsFor('Can you summarize my apartment preferences?');
    for (const preferences of [null, EMPTY_PREFS]) {
      const outcome = await answerAva(avaFallbackAnswer(turns), turns, fetcher([listing('a')], { filters: null }), 5, { preferences });
      expect(outcome.reply.text).toContain("You haven't saved any rental preferences yet");
      expect(outcome.listings).toEqual([]);
    }
  });
});
