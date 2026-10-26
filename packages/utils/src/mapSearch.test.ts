import { bboxContains, expandBBox, filterPinsToVisible, formatPricePill, type BBox } from './mapSearch';

const visible: BBox = { minLat: 14.6, maxLat: 14.7, minLng: 120.9, maxLng: 121.0 };

describe('expandBBox', () => {
  it('grows each side by the margin fraction of the half-size', () => {
    const expanded = expandBBox(visible, 0.25);
    expect(expanded.minLat).toBeCloseTo(14.6 - 0.0125);
    expect(expanded.maxLat).toBeCloseTo(14.7 + 0.0125);
    expect(expanded.minLng).toBeCloseTo(120.9 - 0.0125);
    expect(expanded.maxLng).toBeCloseTo(121.0 + 0.0125);
  });

  it('margin 0 is the same box, and the result always contains the original', () => {
    expect(expandBBox(visible, 0)).toEqual(visible);
    expect(bboxContains(expandBBox(visible, 0.4), visible)).toBe(true);
  });
});

describe('bboxContains', () => {
  it('treats a small pan as contained and a large pan as outside', () => {
    const queried = expandBBox(visible, 0.25);
    const smallPan: BBox = { minLat: 14.605, maxLat: 14.705, minLng: 120.905, maxLng: 121.005 };
    const bigPan: BBox = { minLat: 14.7, maxLat: 14.8, minLng: 120.9, maxLng: 121.0 };
    expect(bboxContains(queried, smallPan)).toBe(true);
    expect(bboxContains(queried, bigPan)).toBe(false);
  });
});

describe('filterPinsToVisible', () => {
  const inside = { id: 'a', latitude: 14.65, longitude: 120.95 };
  const outside = { id: 'b', latitude: 15.2, longitude: 120.95 };

  it('keeps only pins inside the viewport', () => {
    expect(filterPinsToVisible([inside, outside], visible)).toEqual([inside]);
  });

  it('keeps a selected pin even outside the viewport unless told not to', () => {
    const selected = { ...outside, selected: true };
    expect(filterPinsToVisible([inside, selected], visible)).toHaveLength(2);
    expect(filterPinsToVisible([inside, selected], visible, { keepSelected: false })).toEqual([inside]);
  });
});

describe('formatPricePill', () => {
  it('formats compact peso labels', () => {
    expect(formatPricePill(950)).toBe('₱950');
    expect(formatPricePill(8500)).toBe('₱8.5k');
    expect(formatPricePill(12000)).toBe('₱12k');
    expect(formatPricePill(15500)).toBe('₱15.5k');
  });

  it('guards invalid input', () => {
    expect(formatPricePill(-1)).toBe('₱0');
    expect(formatPricePill(Number.NaN)).toBe('₱0');
  });
});
