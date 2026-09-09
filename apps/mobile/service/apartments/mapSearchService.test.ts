import fc from 'fast-check';

jest.mock('@repo/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import {
  bboxContains,
  bboxFromRegion,
  bboxFromRegionWithMargin,
  filterPinsToVisible,
  formatPricePill,
  offsetRegionForSheet,
} from './mapSearchService';

describe('bboxFromRegion', () => {
  it('centers the bbox on the region', () => {
    const bbox = bboxFromRegion({ latitude: 14.67, longitude: 120.96, latitudeDelta: 0.08, longitudeDelta: 0.08 });
    expect(bbox.minLat).toBeCloseTo(14.63);
    expect(bbox.maxLat).toBeCloseTo(14.71);
    expect(bbox.minLng).toBeCloseTo(120.92);
    expect(bbox.maxLng).toBeCloseTo(120.96 + 0.04);
  });
});

describe('bboxFromRegionWithMargin', () => {
  it('expands each side by the margin fraction', () => {
    const base = bboxFromRegion({ latitude: 14.67, longitude: 120.96, latitudeDelta: 0.08, longitudeDelta: 0.08 });
    const expanded = bboxFromRegionWithMargin(
      { latitude: 14.67, longitude: 120.96, latitudeDelta: 0.08, longitudeDelta: 0.08 },
      0.25,
    );
    expect(expanded.minLat).toBeLessThan(base.minLat);
    expect(expanded.maxLat).toBeGreaterThan(base.maxLat);
    expect(expanded.minLng).toBeLessThan(base.minLng);
    expect(expanded.maxLng).toBeGreaterThan(base.maxLng);
    // 25% buffer per side on a 0.08 delta => 0.01 extra per side
    expect(base.minLat - expanded.minLat).toBeCloseTo(0.01);
  });

  it('margin 0 equals the plain bbox', () => {
    const region = { latitude: 14.67, longitude: 120.96, latitudeDelta: 0.08, longitudeDelta: 0.08 };
    expect(bboxFromRegionWithMargin(region, 0)).toEqual(bboxFromRegion(region));
  });

  it('expanded bbox always contains the visible bbox (property)', () => {
    fc.assert(
      fc.property(
        fc.record({
          latitude: fc.double({ min: -60, max: 60, noNaN: true }),
          longitude: fc.double({ min: 100, max: 140, noNaN: true }),
          latitudeDelta: fc.double({ min: 0.005, max: 0.5, noNaN: true }),
          longitudeDelta: fc.double({ min: 0.005, max: 0.5, noNaN: true }),
          margin: fc.double({ min: 0, max: 1, noNaN: true }),
        }),
        ({ latitude, longitude, latitudeDelta, longitudeDelta, margin }) => {
          const region = { latitude, longitude, latitudeDelta, longitudeDelta };
          expect(bboxContains(bboxFromRegionWithMargin(region, margin), bboxFromRegion(region))).toBe(true);
        },
      ),
    );
  });
});

describe('bboxContains', () => {
  it('detects small pans as contained and large pans as outside', () => {
    const region = { latitude: 14.67, longitude: 120.96, latitudeDelta: 0.08, longitudeDelta: 0.08 };
    const queried = bboxFromRegionWithMargin(region, 0.25);
    // Tiny pan stays inside the buffered bbox
    const smallPan = bboxFromRegion({ ...region, latitude: region.latitude + 0.005 });
    expect(bboxContains(queried, smallPan)).toBe(true);
    // Large pan escapes it
    const largePan = bboxFromRegion({ ...region, latitude: region.latitude + 0.08 });
    expect(bboxContains(queried, largePan)).toBe(false);
  });
});

describe('formatPricePill', () => {
  it.each([
    [950, '₱950'],
    [8000, '₱8k'],
    [8500, '₱8.5k'],
    [12000, '₱12k'],
    [15500, '₱15.5k'],
  ])('formats %i as %s', (rent, expected) => {
    expect(formatPricePill(rent)).toBe(expected);
  });
});

describe('filterPinsToVisible', () => {
  const visible = { minLat: 14.6, maxLat: 14.8, minLng: 120.9, maxLng: 121.0 };

  it('keeps only pins inside the viewport', () => {
    const pins = [
      { latitude: 14.7, longitude: 120.95, id: 'a' },
      { latitude: 14.0, longitude: 120.95, id: 'b' },
      { latitude: 14.7, longitude: 122, id: 'c' },
    ];
    expect(filterPinsToVisible(pins, visible).map((p) => p.id)).toEqual(['a']);
  });

  it('keeps selected pin even when outside viewport', () => {
    const pins = [
      { latitude: 14.0, longitude: 120.95, id: 'b', selected: true },
      { latitude: 14.7, longitude: 120.95, id: 'a' },
    ];
    expect(filterPinsToVisible(pins, visible).map((p) => p.id)).toEqual(expect.arrayContaining(['a', 'b']));
  });

  it('culled is always a subset of queried (property)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            latitude: fc.double({ min: 14.0, max: 15.0, noNaN: true }),
            longitude: fc.double({ min: 120.5, max: 121.5, noNaN: true }),
            id: fc.string({ minLength: 1, maxLength: 6 }),
          }),
          { maxLength: 20 },
        ),
        (pins) => {
          const culled = filterPinsToVisible(pins, visible);
          expect(culled.length).toBeLessThanOrEqual(pins.length);
          for (const p of culled) expect(pins).toContainEqual(expect.objectContaining({ id: p.id }));
        },
      ),
    );
  });
});

describe('offsetRegionForSheet', () => {
  const region = { latitude: 14.67, longitude: 120.96, latitudeDelta: 0.08, longitudeDelta: 0.08 };
  const pin = { latitude: 14.67, longitude: 120.96 };

  it('shifts center south, preserves zoom', () => {
    const out = offsetRegionForSheet(region, pin, 0.1);
    expect(out.latitude).toBeCloseTo(14.67 - 0.08 * 0.1);
    expect(out.longitude).toBe(120.96);
    expect(out.latitudeDelta).toBe(0.08);
    expect(out.longitudeDelta).toBe(0.08);
  });

  it('clamps fraction to [0, 0.35]', () => {
    expect(offsetRegionForSheet(region, pin, -1).latitude).toBeCloseTo(pin.latitude);
    expect(offsetRegionForSheet(region, pin, 99).latitude).toBeCloseTo(pin.latitude - 0.08 * 0.35);
  });
});
