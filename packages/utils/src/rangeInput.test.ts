import { commitRangeDraft, parseRangeDraft } from './rangeInput';

const BUDGET = { absoluteMin: 1000, absoluteMax: 50000, step: 500 };

describe('parseRangeDraft', () => {
  it('reads the digits and rounds to the nearest step', () => {
    expect(parseRangeDraft('12000', 0, 500)).toBe(12000);
    expect(parseRangeDraft('₱ 12,300', 0, 500)).toBe(12500);
    expect(parseRangeDraft('12,249', 0, 500)).toBe(12000);
    expect(parseRangeDraft('95', 0, 5)).toBe(95);
    expect(parseRangeDraft('97', 0, 5)).toBe(95);
    expect(parseRangeDraft('98', 0, 5)).toBe(100);
  });

  it('keeps the fallback when there is nothing to read', () => {
    expect(parseRangeDraft('', 7000, 500)).toBe(7000);
    expect(parseRangeDraft('abc', 7000, 500)).toBe(7000);
    expect(parseRangeDraft('₱', 7000, 500)).toBe(7000);
  });
});

describe('commitRangeDraft', () => {
  it('commits a typed minimum or maximum', () => {
    expect(commitRangeDraft('min', '15000', { ...BUDGET, range: [1000, 50000] })).toEqual([15000, 50000]);
    expect(commitRangeDraft('max', '20000', { ...BUDGET, range: [15000, 50000] })).toEqual([15000, 20000]);
  });

  it('clamps to the slider ends', () => {
    expect(commitRangeDraft('min', '200', { ...BUDGET, range: [5000, 30000] })).toEqual([1000, 30000]);
    expect(commitRangeDraft('max', '999999', { ...BUDGET, range: [5000, 30000] })).toEqual([5000, 50000]);
  });

  it('never lets one side pass the other', () => {
    expect(commitRangeDraft('min', '40000', { ...BUDGET, range: [5000, 30000] })).toEqual([30000, 30000]);
    expect(commitRangeDraft('max', '2000', { ...BUDGET, range: [5000, 30000] })).toEqual([5000, 5000]);
  });

  it('leaves the range alone for an empty or unreadable draft', () => {
    expect(commitRangeDraft('min', '', { ...BUDGET, range: [5000, 30000] })).toEqual([5000, 30000]);
    expect(commitRangeDraft('max', 'x', { ...BUDGET, range: [5000, 30000] })).toEqual([5000, 30000]);
  });

  it('snaps to the size slider step', () => {
    const size = { absoluteMin: 10, absoluteMax: 300, step: 5 };
    expect(commitRangeDraft('min', '47', { ...size, range: [10, 300] })).toEqual([45, 300]);
    expect(commitRangeDraft('max', '9', { ...size, range: [10, 300] })).toEqual([10, 10]);
  });
});
