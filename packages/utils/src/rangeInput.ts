// Typed Min/Max fields paired with a range slider (the Browse filters on web and
// mobile). Drafts stay local while typing; this is the rule for turning a draft
// into a committed range, so both platforms land on the same numbers.

export type RangeSide = 'min' | 'max';

export interface RangeInputLimits {
  /** The committed range the sliders and fields currently show. */
  range: readonly [number, number];
  /** The slider's ends: a typed value never goes outside them. */
  absoluteMin: number;
  absoluteMax: number;
  step: number;
}

/**
 * The number in a typed draft, rounded to the nearest step. Only digits count
 * (so "₱ 12,500" reads as 12500); a draft with none keeps `fallback`.
 */
export function parseRangeDraft(raw: string, fallback: number, step: number): number {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return fallback;
  return Math.round(Number(digits) / step) * step;
}

/**
 * The range after one side's draft is committed (on blur or Enter). The side
 * snaps to the step and clamps to the slider's end and, silently, to the other
 * side: a minimum never passes the maximum and vice versa. Returns the same
 * values as `range` when nothing changes.
 */
export function commitRangeDraft(
  side: RangeSide,
  raw: string,
  { range, absoluteMin, absoluteMax, step }: RangeInputLimits,
): [number, number] {
  const [min, max] = range;
  if (side === 'min') {
    const next = Math.min(Math.max(parseRangeDraft(raw, min, step), absoluteMin), max);
    return [next, max];
  }
  const next = Math.max(Math.min(parseRangeDraft(raw, max, step), absoluteMax), min);
  return [min, next];
}
