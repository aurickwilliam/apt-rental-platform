import {
  AI_SEARCH_MAX_BUDGET,
  AI_SEARCH_MIN_BUDGET,
  EMPTY_AI_SEARCH_FILTERS,
  aiFiltersToBrowseParams,
  countAiSearchFilters,
  parseSearchKeywords,
  sanitizeAiFilters,
  sanitizeSearchKeyword,
} from './aiSearch';

describe('sanitizeAiFilters', () => {
  it('returns empty filters for anything that is not an object', () => {
    expect(sanitizeAiFilters(null)).toEqual(EMPTY_AI_SEARCH_FILTERS);
    expect(sanitizeAiFilters('2BR in Malabon')).toEqual(EMPTY_AI_SEARCH_FILTERS);
  });

  it('keeps known values, fixes their casing and drops the rest', () => {
    const filters = sanitizeAiFilters({
      cities: ['malabon', 'Quezon City', 'Malabon', 42],
      types: ['condo unit', 'Mansion'],
      furnishing: ['semi-furnished'],
      amenities: ['petfriendly', 'helipad'],
      sort: 'PRICE_ASC',
    });

    expect(filters.cities).toEqual(['Malabon']);
    expect(filters.types).toEqual(['Condo Unit']);
    expect(filters.furnishing).toEqual(['Semi-Furnished']);
    expect(filters.amenities).toEqual(['petfriendly']);
    expect(filters.sort).toBe('price_asc');
  });

  it('clamps and orders the budget', () => {
    expect(sanitizeAiFilters({ priceMin: 20, priceMax: 9_999_999 })).toMatchObject({
      priceMin: AI_SEARCH_MIN_BUDGET,
      priceMax: AI_SEARCH_MAX_BUDGET,
    });
    expect(sanitizeAiFilters({ priceMin: 15000, priceMax: '8,000' })).toMatchObject({
      priceMin: 8000,
      priceMax: 15000,
    });
    expect(sanitizeAiFilters({ priceMax: -5 }).priceMax).toBeNull();
    expect(sanitizeAiFilters({ priceMax: Number.NaN }).priceMax).toBeNull();
  });

  it('turns room counts into the 1, 2, 3 or 4+ options', () => {
    expect(sanitizeAiFilters({ bedrooms: 2, bathrooms: '7' })).toMatchObject({
      bedrooms: '2',
      bathrooms: '4+',
    });
    expect(sanitizeAiFilters({ bedrooms: 0 }).bedrooms).toBeNull();
  });

  it('only accepts verifiedOnly when it is exactly true', () => {
    expect(sanitizeAiFilters({ verifiedOnly: 'yes' }).verifiedOnly).toBe(false);
    expect(sanitizeAiFilters({ verifiedOnly: true }).verifiedOnly).toBe(true);
  });

  it('strips characters that would change a PostgREST filter', () => {
    expect(sanitizeAiFilters({ keyword: 'Tugatog),id.eq.1' }).keyword).toBe('Tugatog id eq 1');
    expect(sanitizeSearchKeyword('Santo Niño')).toBe('Santo Niño');
    expect(sanitizeSearchKeyword('%%%')).toBeNull();
    expect(sanitizeSearchKeyword('a'.repeat(100))).toHaveLength(40);
  });
});

describe('parseSearchKeywords', () => {
  it('reads an English request', () => {
    const filters = parseSearchKeywords('2BR under 15k in Malabon with parking');

    expect(filters).toMatchObject({
      cities: ['Malabon'],
      bedrooms: '2',
      priceMax: 15000,
      priceMin: null,
      amenities: ['parking'],
    });
  });

  it('reads a Tagalog request', () => {
    const filters = parseSearchKeywords('Dalawang kwarto sa Valenzuela, hanggang 12 libo, may aso ako');

    expect(filters).toMatchObject({
      cities: ['Valenzuela'],
      bedrooms: '2',
      priceMax: 12000,
      amenities: ['petfriendly'],
    });
  });

  it('reads a Taglish request', () => {
    const filters = parseSearchKeywords('Looking for murang studio sa Caloocan, fully furnished sana');

    expect(filters).toMatchObject({
      cities: ['Caloocan'],
      types: ['Studio'],
      furnishing: ['Fully Furnished'],
      sort: 'price_asc',
    });
  });

  it('reads budget ranges and minimums', () => {
    expect(parseSearchKeywords('10k-15k')).toMatchObject({ priceMin: 10000, priceMax: 15000 });
    expect(parseSearchKeywords('₱8,000 to ₱12,000')).toMatchObject({ priceMin: 8000, priceMax: 12000 });
    expect(parseSearchKeywords('at least 20k')).toMatchObject({ priceMin: 20000, priceMax: null });
  });

  it('does not read room counts or floor areas as money', () => {
    expect(parseSearchKeywords('2-3 bedrooms')).toMatchObject({ priceMin: null, priceMax: null });
    expect(parseSearchKeywords('around 30 sqm')).toMatchObject({ priceMin: null, priceMax: null });
    expect(parseSearchKeywords('2 bedroom 1 bathroom')).toMatchObject({
      bedrooms: '2',
      bathrooms: '1',
      priceMax: null,
    });
  });

  it('keeps short words from matching inside longer ones', () => {
    // "cat" in "location", "ac" in "place", "isa" in "kalookan" style words.
    expect(parseSearchKeywords('a nice place, good location').amenities).toEqual([]);
    expect(parseSearchKeywords('12 br').bedrooms).toBeNull();
  });

  it('understands the old spelling of Caloocan and the townhouse type', () => {
    expect(parseSearchKeywords('townhouse sa Kalookan')).toMatchObject({
      cities: ['Caloocan'],
      types: ['Townhouse'],
    });
  });

  it('finds nothing in a request with no searchable details', () => {
    expect(countAiSearchFilters(parseSearchKeywords('Hello! Can you help me?'))).toBe(0);
    expect(parseSearchKeywords('   ')).toEqual(EMPTY_AI_SEARCH_FILTERS);
  });
});

describe('aiFiltersToBrowseParams', () => {
  it('maps filters to the web Browse query params', () => {
    expect(
      aiFiltersToBrowseParams({
        ...EMPTY_AI_SEARCH_FILTERS,
        cities: ['Malabon', 'Navotas'],
        priceMin: 5000,
        priceMax: 15000,
        bedrooms: '4+',
        types: ['Studio'],
        furnishing: ['Unfurnished'],
        amenities: ['wifi', 'ac'],
        verifiedOnly: true,
        sort: 'most_popular',
        keyword: 'Tugatog',
      }),
    ).toEqual({
      locations: 'Malabon,Navotas',
      price_min: '5000',
      price_max: '15000',
      bedrooms: '4+',
      apt_types: 'Studio',
      furnishing: 'Unfurnished',
      amenities: 'wifi,ac',
      verified: '1',
      sort: 'most_popular',
      search: 'Tugatog',
    });
  });

  it('returns no params for empty filters', () => {
    expect(aiFiltersToBrowseParams(EMPTY_AI_SEARCH_FILTERS)).toEqual({});
  });
});
