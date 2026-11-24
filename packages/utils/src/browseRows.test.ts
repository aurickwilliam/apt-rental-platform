import {
  BROWSE_DEFAULT_BUDGET_MAX,
  BROWSE_DEFAULT_BUDGET_MIN,
  BROWSE_ROW_LIMIT,
  MIN_BROWSE_ROWS,
  buildFillerRowSpecs,
  buildPersonalizedRowSpecs,
  hasMeaningfulPreferences,
  isListingEligible,
  minimumHouseholdSize,
  recommendationReasons,
  parseBrowseRowSpec,
  rankCandidates,
  scoreListing,
  selectBrowseRows,
  type BrowseRowCandidate,
  type BrowseRowPreferences,
} from './browseRows';

const DEFAULTS: BrowseRowPreferences = {
  selectedCities: [],
  budgetMin: BROWSE_DEFAULT_BUDGET_MIN,
  budgetMax: BROWSE_DEFAULT_BUDGET_MAX,
  bedroomCount: null,
  householdSize: null,
  hasPets: false,
  hasParking: false,
  hasSmoker: false,
  hasDisability: false,
};

const prefs = (overrides: Partial<BrowseRowPreferences> = {}): BrowseRowPreferences => ({ ...DEFAULTS, ...overrides });

const listing = (overrides: Partial<BrowseRowCandidate> = {}): BrowseRowCandidate => ({
  id: 'apt-1',
  city: 'Caloocan',
  monthly_rent: 10000,
  no_bedrooms: 2,
  amenities: [],
  is_verified: false,
  average_rating: 4,
  ...overrides,
});

const ids = (rows: { id: string }[]) => rows.map((row) => row.id);

describe('constants', () => {
  it('rows hold 15 apartments and pages at least 9 rows', () => {
    expect(BROWSE_ROW_LIMIT).toBe(15);
    expect(MIN_BROWSE_ROWS).toBe(9);
  });
});

describe('hasMeaningfulPreferences', () => {
  it('treats missing, default and budget-only-default preferences as skipped', () => {
    expect(hasMeaningfulPreferences(null)).toBe(false);
    expect(hasMeaningfulPreferences(undefined)).toBe(false);
    expect(hasMeaningfulPreferences(prefs())).toBe(false);
  });

  it('counts any answered preference', () => {
    expect(hasMeaningfulPreferences(prefs({ budgetMin: 5000, budgetMax: 20000 }))).toBe(true);
    expect(hasMeaningfulPreferences(prefs({ selectedCities: ['Caloocan'] }))).toBe(true);
    expect(hasMeaningfulPreferences(prefs({ bedroomCount: '1-2 Bedrooms' }))).toBe(true);
    expect(hasMeaningfulPreferences(prefs({ householdSize: 'Single' }))).toBe(true);
    expect(hasMeaningfulPreferences(prefs({ hasPets: true }))).toBe(true);
    expect(hasMeaningfulPreferences(prefs({ hasParking: true }))).toBe(true);
    expect(hasMeaningfulPreferences(prefs({ hasSmoker: true }))).toBe(true);
    expect(hasMeaningfulPreferences(prefs({ hasDisability: true }))).toBe(true);
  });
});

describe('scoreListing', () => {
  it('excludes a listing outside a chosen budget and keeps one inside it', () => {
    const p = prefs({ budgetMin: 5000, budgetMax: 14999 });
    expect(scoreListing(listing({ monthly_rent: 10000 }), p)).toBeGreaterThan(0);
    expect(scoreListing(listing({ monthly_rent: 17000 }), p)).toBe(0);
    expect(scoreListing(listing({ monthly_rent: 4999 }), p)).toBe(0);
    expect(scoreListing(listing({ monthly_rent: 14999 }), p)).toBeGreaterThan(0);
  });

  it('never gates on the default budget range', () => {
    expect(scoreListing(listing({ monthly_rent: 250000 }), prefs())).toBeGreaterThan(0);
  });

  it('gates on chosen cities and gives a baseline when none are chosen', () => {
    expect(scoreListing(listing({ city: 'Malabon' }), prefs({ selectedCities: ['Caloocan'] }))).toBe(0);
    expect(scoreListing(listing({ city: 'Caloocan' }), prefs({ selectedCities: ['Caloocan'] }))).toBeGreaterThan(0);
    expect(scoreListing(listing({ city: 'Navotas' }), prefs({ selectedCities: ['Caloocan', 'Malabon'] }))).toBe(0);
    expect(scoreListing(listing({ city: 'Navotas' }), prefs())).toBeGreaterThan(0);
  });

  it('scores bedrooms by the saved range', () => {
    const oneTwo = prefs({ bedroomCount: '1-2 Bedrooms' });
    expect(scoreListing(listing({ no_bedrooms: 2 }), oneTwo)).toBeGreaterThan(scoreListing(listing({ no_bedrooms: 3 }), oneTwo));
    expect(scoreListing(listing({ no_bedrooms: 3 }), oneTwo)).toBeGreaterThan(scoreListing(listing({ no_bedrooms: 5 }), oneTwo));
    const fourPlus = prefs({ bedroomCount: '4+ Bedrooms' });
    expect(scoreListing(listing({ no_bedrooms: 4 }), fourPlus)).toBeGreaterThan(scoreListing(listing({ no_bedrooms: 3 }), fourPlus));
    const none = prefs();
    expect(scoreListing(listing({ no_bedrooms: 1 }), none)).toBe(scoreListing(listing({ no_bedrooms: 5 }), none));
  });

  it('scores pet, parking and non-smoking amenities', () => {
    const pets = prefs({ hasPets: true });
    expect(scoreListing(listing({ amenities: ['petfriendly'] }), pets)).toBeGreaterThan(scoreListing(listing(), pets));
    expect(scoreListing(listing(), pets)).toBeLessThan(scoreListing(listing(), prefs()));
    const parking = prefs({ hasParking: true });
    expect(scoreListing(listing({ amenities: ['parking'] }), parking)).toBeGreaterThan(scoreListing(listing(), parking));
    const smoker = prefs({ hasSmoker: true });
    expect(scoreListing(listing({ amenities: ['nonsmoking'] }), smoker)).toBe(0);
    expect(scoreListing(listing(), smoker)).toBeGreaterThan(0);
  });

  it('scores the wheelchair amenity only where the platform has one', () => {
    const access = prefs({ hasDisability: true });
    const withChair = listing({ amenities: ['wheelchair'] });
    expect(scoreListing(withChair, access)).toBe(scoreListing(withChair, prefs()));
    expect(scoreListing(withChair, access, { wheelchairAmenity: true })).toBe(scoreListing(withChair, prefs()) + 1);
    expect(scoreListing(listing(), access, { wheelchairAmenity: true })).toBe(scoreListing(listing(), prefs()));
  });

  it('prefers verified listings and tolerates missing fields', () => {
    expect(scoreListing(listing({ is_verified: true }), prefs())).toBeGreaterThan(scoreListing(listing(), prefs()));
    const p = prefs({ selectedCities: ['Caloocan'], bedroomCount: '1-2 Bedrooms', hasPets: true });
    expect(() => scoreListing({ id: 'bare' }, p)).not.toThrow();
    expect(() =>
      scoreListing(
        { id: 'nulls', city: null, monthly_rent: null, no_bedrooms: null, amenities: null, is_verified: null, average_rating: null },
        p,
      ),
    ).not.toThrow();
  });
});

describe('rankCandidates', () => {
  it('orders by score, then rating, then id', () => {
    const p = prefs();
    const [first, second] = rankCandidates([listing({ id: 'b' }), listing({ id: 'a' })], p, 8);
    expect(first.candidate.id).toBe('a');
    expect(second.candidate.id).toBe('b');
    const ranked = rankCandidates(
      [listing({ id: 'lo', average_rating: 1 }), listing({ id: 'hi', average_rating: 5, is_verified: true })],
      p,
      8,
    );
    expect(ranked[0].candidate.id).toBe('hi');
  });

  it('bounds, de-duplicates and drops non-positive scores', () => {
    const p = prefs();
    const many = Array.from({ length: 20 }, (_, i) => listing({ id: `apt-${String(i).padStart(2, '0')}` }));
    expect(rankCandidates(many, p, 8)).toHaveLength(8);
    expect(rankCandidates(many, p)).toHaveLength(BROWSE_ROW_LIMIT);
    expect(rankCandidates([listing({ id: 'x' }), listing({ id: 'x' })], p, 8)).toHaveLength(1);
    expect(rankCandidates([listing({ id: 'y', city: 'Malabon' })], prefs({ selectedCities: ['Caloocan'] }), 8)).toHaveLength(0);
  });
});

describe('buildPersonalizedRowSpecs', () => {
  it('builds no rows for skipped preferences', () => {
    expect(buildPersonalizedRowSpecs(null)).toEqual([]);
    expect(buildPersonalizedRowSpecs(undefined)).toEqual([]);
    expect(buildPersonalizedRowSpecs(prefs())).toEqual([]);
  });

  it('builds one row per answered preference, in display order', () => {
    const rows = buildPersonalizedRowSpecs(
      prefs({
        selectedCities: ['Caloocan', 'Malabon'],
        budgetMin: 15000,
        budgetMax: 29999,
        bedroomCount: '2-4 Bedrooms',
        hasPets: true,
        hasParking: true,
      }),
    );
    expect(ids(rows)).toEqual(['city:Caloocan', 'city:Malabon', 'budget', 'bedrooms', 'pets', 'parking']);
    expect(rows[0].title).toBe('Apartments in Caloocan');
    expect(rows[0].criteria).toEqual({ cities: ['Caloocan'] });
  });

  it('gates every non-city row on the chosen cities and leaves them open otherwise', () => {
    const gated = buildPersonalizedRowSpecs(prefs({ selectedCities: ['Caloocan', 'Malabon'], hasPets: true, bedroomCount: '4+ Bedrooms' }));
    for (const id of ['pets', 'bedrooms']) {
      expect(gated.find((row) => row.id === id)?.criteria.cities).toEqual(['Caloocan', 'Malabon']);
    }
    const open = buildPersonalizedRowSpecs(prefs({ hasParking: true }));
    expect(ids(open)).toEqual(['parking']);
    expect(open[0].criteria).toEqual({ amenities: ['parking'] });
  });

  it('builds no budget row for the default budget and keeps exact bounds otherwise', () => {
    expect(ids(buildPersonalizedRowSpecs(prefs({ selectedCities: ['Caloocan'] })))).not.toContain('budget');
    const [budget] = buildPersonalizedRowSpecs(prefs({ budgetMin: 30000, budgetMax: 59999 }));
    expect(budget.id).toBe('budget');
    expect(budget.criteria).toEqual({ priceMin: 30000, priceMax: 59999 });
    expect(budget.subtitle).toBe('₱30,000 – ₱59,999 a month.');
  });

  it('keeps the saved bedroom range, open-ended for 4+', () => {
    const row = (bedroomCount: string) => buildPersonalizedRowSpecs(prefs({ bedroomCount })).find((r) => r.id === 'bedrooms');
    expect(row('1-2 Bedrooms')?.criteria).toEqual({ bedroomMin: 1, bedroomMax: 2 });
    expect(row('2-4 Bedrooms')?.criteria).toEqual({ bedroomMin: 2, bedroomMax: 4 });
    expect(row('4+ Bedrooms')?.criteria).toEqual({ bedroomMin: 4 });
    expect(row('1-2 Bedrooms')?.title).toBe('1-2 Bedrooms');
  });

  it('builds no bedroom row for an unknown saved option', () => {
    expect(ids(buildPersonalizedRowSpecs(prefs({ bedroomCount: 'Penthouse', hasPets: true })))).toEqual(['pets']);
  });

  it('uses the shared amenity identifiers for pets and parking', () => {
    const rows = buildPersonalizedRowSpecs(prefs({ hasPets: true, hasParking: true }));
    expect(rows.find((r) => r.id === 'pets')?.criteria.amenities).toEqual(['petfriendly']);
    expect(rows.find((r) => r.id === 'parking')?.criteria.amenities).toEqual(['parking']);
  });

  it('builds one row for a city chosen twice', () => {
    const rows = buildPersonalizedRowSpecs(prefs({ selectedCities: ['Caloocan', 'Caloocan', 'Malabon'], hasPets: true }));
    expect(ids(rows)).toEqual(['city:Caloocan', 'city:Malabon', 'pets']);
    expect(rows.find((r) => r.id === 'pets')?.criteria.cities).toEqual(['Caloocan', 'Malabon']);
  });
});

describe('buildFillerRowSpecs', () => {
  it('gives enough distinct rows to reach the minimum from one personal row', () => {
    const filler = buildFillerRowSpecs(prefs({ hasDisability: true }), { includeCore: true });
    expect(new Set(ids(filler)).size).toBe(filler.length);
    expect(1 + filler.length).toBeGreaterThanOrEqual(MIN_BROWSE_ROWS);
  });

  it('is only the extras beside the fixed rows', () => {
    expect(ids(buildFillerRowSpecs(null, { includeCore: false }))).toEqual(['family', 'furnished', 'pets', 'parking', 'mid_range']);
  });

  it('gates every row on the chosen cities, once each, and leaves them open otherwise', () => {
    const gated = buildFillerRowSpecs(prefs({ selectedCities: ['Caloocan', 'Valenzuela', 'Caloocan'] }), { includeCore: true });
    for (const row of gated) expect(row.criteria.cities).toEqual(['Caloocan', 'Valenzuela']);
    for (const row of buildFillerRowSpecs(null, { includeCore: true })) expect(row.criteria.cities).toBeUndefined();
  });

  it('describes each cohort in neutral criteria', () => {
    const rows = Object.fromEntries(buildFillerRowSpecs(null, { includeCore: true }).map((row) => [row.id, row]));
    expect(rows.top_rated.criteria).toEqual({ minRating: 4.5 });
    expect(rows.verified.criteria).toEqual({ verified: true });
    expect(rows.under_10k.criteria).toEqual({ priceMax: 10000 });
    expect(rows.studio.criteria).toEqual({ types: ['Studio'] });
    expect(rows.spacious.criteria).toEqual({ sizeMin: 60 });
    expect(rows.furnished.criteria).toEqual({ furnishing: 'Fully Furnished' });
    expect(rows.family.criteria).toEqual({ bedroomMin: 3 });
    expect(rows.mid_range.criteria).toEqual({ priceMin: 10000, priceMax: 20000 });
    expect(rows.newest.sort).toBe('newest');
    expect(rows.under_10k.sort).toBe('price_asc');
    expect(rows.spacious.sort).toBe('size_desc');
  });
});

describe('selectBrowseRows', () => {
  const row = (id: string) => ({ id });
  const filler = ['top_rated', 'pets', 'verified', 'newest', 'under_10k', 'studio', 'spacious', 'family', 'furnished', 'parking'].map(row);

  it('keeps every base row, skips duplicates and stops at the minimum', () => {
    const result = selectBrowseRows([row('for_you'), row('pets')], filler);
    expect(result).toHaveLength(9);
    expect(ids(result).slice(0, 2)).toEqual(['for_you', 'pets']);
    expect(new Set(ids(result)).size).toBe(9);
  });

  it('never trims base rows and returns fewer rows when nothing more exists', () => {
    const many = Array.from({ length: 12 }, (_, i) => row(`personal-${i}`));
    expect(selectBrowseRows(many, filler)).toHaveLength(12);
    expect(ids(selectBrowseRows([], [row('a')]))).toEqual(['a']);
  });
});

describe('parseBrowseRowSpec', () => {
  it('round-trips a built spec', () => {
    for (const spec of [
      ...buildPersonalizedRowSpecs(prefs({ selectedCities: ['Caloocan'], budgetMin: 15000, budgetMax: 29999, bedroomCount: '1-2 Bedrooms', hasPets: true })),
      ...buildFillerRowSpecs(null, { includeCore: true }),
    ]) {
      expect(parseBrowseRowSpec(JSON.parse(JSON.stringify(spec)))).toEqual(spec);
    }
  });

  it('rejects non-specs and unknown sorts', () => {
    expect(parseBrowseRowSpec(null)).toBeNull();
    expect(parseBrowseRowSpec('x')).toBeNull();
    expect(parseBrowseRowSpec({ id: 'a' })).toBeNull();
    expect(parseBrowseRowSpec({ id: 'a', title: 'A', sort: 'random', criteria: {} })).toBeNull();
  });

  it('keeps only known criteria of the right type', () => {
    const parsed = parseBrowseRowSpec({
      id: 'a',
      title: 'A',
      sort: 'rating',
      criteria: { cities: ['Caloocan'], priceMin: '5', priceMax: 9, verified: 'yes', evil: 1, amenities: [1] },
    });
    expect(parsed?.criteria).toEqual({ cities: ['Caloocan'], priceMax: 9 });
  });
});

describe('isListingEligible', () => {
  it('excludes only a capacity provably below the household', () => {
    const family = prefs({ householdSize: '5 - 6 Persons' });
    expect(isListingEligible(listing({ max_occupants: 4 }), family)).toBe(false);
    expect(isListingEligible(listing({ max_occupants: 5 }), family)).toBe(true);
    expect(isListingEligible(listing({ max_occupants: null }), family)).toBe(true);
    expect(isListingEligible(listing({ max_occupants: 0 }), family)).toBe(true);
  });

  it('keeps a listing with no smoking policy for a smoker', () => {
    expect(isListingEligible(listing(), prefs({ hasSmoker: true }))).toBe(true);
    expect(isListingEligible(listing({ amenities: ['nonsmoking'] }), prefs({ hasSmoker: true }))).toBe(false);
  });

  it('ignores a malformed budget instead of excluding everything', () => {
    expect(isListingEligible(listing({ monthly_rent: 9000 }), prefs({ budgetMin: 20000, budgetMax: 10000 }))).toBe(true);
  });

  it('never excludes for unknown pet policy', () => {
    expect(isListingEligible(listing(), prefs({ hasPets: true }))).toBe(true);
  });
});

describe('minimumHouseholdSize', () => {
  it('maps saved options to their lower bound', () => {
    expect(minimumHouseholdSize('Single')).toBe(1);
    expect(minimumHouseholdSize('3 - 4 Persons')).toBe(3);
    expect(minimumHouseholdSize('7+ Persons')).toBe(7);
    expect(minimumHouseholdSize('6')).toBe(6);
    expect(minimumHouseholdSize(null)).toBeNull();
    expect(minimumHouseholdSize('lots')).toBeNull();
  });
});

describe('recommendationReasons', () => {
  it('lists only verified matches, at most two, in priority order', () => {
    const p = prefs({ selectedCities: ['Caloocan'], budgetMin: 8000, budgetMax: 15000, bedroomCount: '1-2 Bedrooms', hasPets: true });
    const l = listing({ city: 'Caloocan', monthly_rent: 10000, no_bedrooms: 2, amenities: ['petfriendly'] });
    expect(recommendationReasons(l, p)).toEqual(['Preferred city', 'Within budget']);
  });

  it('adds no chip for an unanswered or unconfirmed preference', () => {
    expect(recommendationReasons(listing({ amenities: ['petfriendly'] }), prefs())).toEqual([]);
    expect(recommendationReasons(listing(), prefs({ hasPets: true, hasParking: true }))).toEqual([]);
  });
});
