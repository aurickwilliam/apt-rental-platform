import {
  buildApplicationPreferenceSnapshot,
  buildDeclaredApplicationPreferenceSnapshot,
  describeApplicationPreferences,
  parseApplicationPreferenceSnapshot,
  type ApplicationPreferenceSource,
} from './applicationPreferences';

const prefs = (overrides: Partial<ApplicationPreferenceSource> = {}): ApplicationPreferenceSource => ({
  hasPets: true,
  kindOfPets: ['Dog', 'Cat'],
  noOfPets: 2,
  nameOfPets: ' Max and Luna ',
  hasParking: true,
  noOfParkingSpots: 1,
  listOfVehicles: ['Car'],
  hasSmoker: false,
  hasDisability: true,
  ...overrides,
});

const yes = { hasPets: true, isSmoker: false, needParking: true };

describe('buildApplicationPreferenceSnapshot', () => {
  it('is null without saved preferences', () => {
    expect(buildApplicationPreferenceSnapshot(null, yes)).toBeNull();
    expect(buildApplicationPreferenceSnapshot(undefined, yes)).toBeNull();
  });

  it('carries the saved details for what the tenant says yes to', () => {
    expect(buildApplicationPreferenceSnapshot(prefs(), yes)).toEqual({
      version: 1,
      pets: { has: true, kinds: ['Dog', 'Cat'], count: 2, names: 'Max and Luna' },
      parking: { needed: true, spots: 1, vehicles: ['Car'] },
      smoker: false,
      householdDisability: true,
    });
  });

  it("never shares details of pets or parking the tenant answered no to", () => {
    const snapshot = buildApplicationPreferenceSnapshot(prefs(), { hasPets: false, isSmoker: false, needParking: false });
    expect(snapshot?.pets).toEqual({ has: false });
    expect(snapshot?.parking).toEqual({ needed: false });
  });

  it("uses the form's answer when it differs from the saved preference", () => {
    const snapshot = buildApplicationPreferenceSnapshot(prefs({ hasPets: false, hasParking: false, kindOfPets: [] }), {
      hasPets: true,
      isSmoker: true,
      needParking: true,
    });
    expect(snapshot?.pets).toEqual({ has: true });
    expect(snapshot?.parking).toEqual({ needed: true });
    expect(snapshot?.smoker).toBe(true);
  });

  it('shares the household disability answer as saved', () => {
    expect(buildApplicationPreferenceSnapshot(prefs({ hasDisability: false }), yes)?.householdDisability).toBe(false);
    expect(buildApplicationPreferenceSnapshot(prefs({ hasDisability: true }), yes)?.householdDisability).toBe(true);
  });

  it('trims and caps the pet names', () => {
    const long = 'x'.repeat(500);
    expect(buildApplicationPreferenceSnapshot(prefs({ nameOfPets: long }), yes)?.pets.names).toHaveLength(200);
    expect(buildApplicationPreferenceSnapshot(prefs({ nameOfPets: '   ' }), yes)?.pets.names).toBeUndefined();
  });
});

describe('buildDeclaredApplicationPreferenceSnapshot', () => {
  it('uses the declared answers, so a no never carries details', () => {
    expect(buildDeclaredApplicationPreferenceSnapshot(prefs({ hasPets: false, hasParking: false }))).toMatchObject({
      pets: { has: false },
      parking: { needed: false },
    });
    expect(buildDeclaredApplicationPreferenceSnapshot(prefs()).pets.has).toBe(true);
  });
});

describe('parseApplicationPreferenceSnapshot', () => {
  it('round-trips a built snapshot through JSON', () => {
    const snapshot = buildApplicationPreferenceSnapshot(prefs(), yes);
    expect(parseApplicationPreferenceSnapshot(JSON.parse(JSON.stringify(snapshot)))).toEqual(snapshot);
  });

  it('rejects unusable values and drops malformed details', () => {
    expect(parseApplicationPreferenceSnapshot(null)).toBeNull();
    expect(parseApplicationPreferenceSnapshot('x')).toBeNull();
    expect(parseApplicationPreferenceSnapshot({})).toBeNull();
    expect(parseApplicationPreferenceSnapshot({ pets: { has: 'yes' }, parking: { needed: true } })).toBeNull();
    const parsed = parseApplicationPreferenceSnapshot({
      pets: { has: true, kinds: [1, 2], count: -1, names: '  ' },
      parking: { needed: true, spots: 'two', vehicles: 'car' },
      smoker: 'yes',
    });
    expect(parsed).toEqual({
      version: 1,
      pets: { has: true },
      parking: { needed: true },
      smoker: false,
      householdDisability: false,
    });
  });
});

describe('describeApplicationPreferences', () => {
  it('words each topic on one line', () => {
    const lines = describeApplicationPreferences(buildApplicationPreferenceSnapshot(prefs(), yes)!);
    expect(lines).toEqual([
      { label: 'Pets', value: 'Yes: Dog, Cat · 2 pets · named Max and Luna' },
      { label: 'Parking', value: 'Needed: 1 spot · Car' },
      { label: 'Smoking', value: 'Non-smoker' },
      { label: 'Household member with a disability', value: 'Yes' },
    ]);
  });

  it('keeps no and bare yes answers short', () => {
    const none = describeApplicationPreferences(
      buildApplicationPreferenceSnapshot(prefs({ hasDisability: false }), { hasPets: false, isSmoker: true, needParking: false })!,
    );
    expect(none.map((line) => line.value)).toEqual(['No', 'Not needed', 'Smoker', 'No']);
    const bare = describeApplicationPreferences({
      version: 1,
      pets: { has: true },
      parking: { needed: true, spots: 3 },
      smoker: false,
      householdDisability: false,
    });
    expect(bare[0].value).toBe('Yes');
    expect(bare[1].value).toBe('Needed: 3 spots');
  });

  it('words the same limits in Filipino without changing the default English output', () => {
    const lines = describeApplicationPreferences(buildApplicationPreferenceSnapshot(prefs(), yes)!, 'fil');
    expect(lines).toEqual([
      { label: 'Mga Alaga', value: 'Oo: Dog, Cat · 2 alaga · may pangalang Max and Luna' },
      { label: 'Paradahan', value: 'Kailangan: 1 parking spot · Car' },
      { label: 'Paninigarilyo', value: 'Hindi naninigarilyo' },
      { label: 'Miyembro ng sambahayang may disability', value: 'Oo' },
    ]);
  });
});
