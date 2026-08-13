import fc from 'fast-check';

import type { IdCaptureResult } from '@/stores/useVerificationStore';
import type { CaptureStepConfig } from '@/app/(auth)/verify-account/constants/captureSequences';

import { computeCanContinue, getCaptureProgress } from '@/app/(auth)/verify-account/utils/gating';

const idCaptureResultArbitrary: fc.Arbitrary<IdCaptureResult> = fc.record({
  uri: fc.string(),
  width: fc.integer({ min: 1, max: 10000 }),
  height: fc.integer({ min: 1, max: 10000 }),
});

/** Generates a distinct-id sequence of arbitrary length (0 or more steps). */
const sequenceArbitrary: fc.Arbitrary<CaptureStepConfig[]> = fc
  .uniqueArray(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 6 })
  .map((ids) =>
    ids.map((id, index) => ({ id, label: `Step ${index}`, aspectRatio: 1 })),
  );

/**
 * Given a sequence, generates a captures map covering an arbitrary subset
 * of the sequence's step ids, plus optionally unrelated extra ids.
 */
function capturesArbitraryFor(sequence: CaptureStepConfig[]): fc.Arbitrary<Record<string, IdCaptureResult>> {
  const sequenceIds = sequence.map((s) => s.id);
  return fc
    .tuple(
      fc.subarray(sequenceIds),
      fc.uniqueArray(fc.string({ minLength: 1 }), { maxLength: 3 }),
      fc.array(idCaptureResultArbitrary, { minLength: 0, maxLength: sequenceIds.length + 3 }),
    )
    .map(([presentSequenceIds, extraIds, results]) => {
      const keys = [...presentSequenceIds, ...extraIds.filter((id) => !sequenceIds.includes(id))];
      const captures: Record<string, IdCaptureResult> = {};
      keys.forEach((key, index) => {
        captures[key] = results[index % Math.max(results.length, 1)] ?? {
          uri: 'file://x.jpg',
          width: 1,
          height: 1,
        };
      });
      return captures;
    });
}

describe('getCaptureProgress', () => {
  it('returns an empty steps array and isComplete=true for an empty sequence', () => {
    const progress = getCaptureProgress([], {});
    expect(progress.steps).toEqual([]);
    expect(progress.isComplete).toBe(true);
  });

  it('reports every step as incomplete when captures is empty', () => {
    const sequence: CaptureStepConfig[] = [
      { id: 'front', label: 'Front', aspectRatio: 1 },
      { id: 'back', label: 'Back', aspectRatio: 1 },
    ];
    const progress = getCaptureProgress(sequence, {});

    expect(progress.steps).toEqual([
      { step: sequence[0], result: null },
      { step: sequence[1], result: null },
    ]);
    expect(progress.isComplete).toBe(false);
  });

  it('reports per-step completion correctly for a partially-completed sequence', () => {
    const sequence: CaptureStepConfig[] = [
      { id: 'front', label: 'Front', aspectRatio: 1 },
      { id: 'back', label: 'Back', aspectRatio: 1 },
    ];
    const frontResult: IdCaptureResult = { uri: 'file://front.jpg', width: 10, height: 10 };
    const progress = getCaptureProgress(sequence, { front: frontResult });

    expect(progress.steps).toEqual([
      { step: sequence[0], result: frontResult },
      { step: sequence[1], result: null },
    ]);
    expect(progress.isComplete).toBe(false);
  });

  it('reports isComplete=true when every step has a result, ignoring unrelated extra keys', () => {
    const sequence: CaptureStepConfig[] = [{ id: 'identity-page', label: 'Identity Page', aspectRatio: 1.42 }];
    const result: IdCaptureResult = { uri: 'file://id.jpg', width: 10, height: 10 };
    const progress = getCaptureProgress(sequence, { 'identity-page': result, unrelated: result });

    expect(progress.isComplete).toBe(true);
  });
});

describe('computeCanContinue', () => {
  it(
    'Feature: id-verification-capture, Property 1: Continue-gating requires every capture step to be present and confirmed',
    () => {
      fc.assert(
        fc.property(
          sequenceArbitrary.chain((sequence) =>
            fc.tuple(fc.constant(sequence), capturesArbitraryFor(sequence)),
          ),
          fc.boolean(),
          ([sequence, captures], isConfirmed) => {
            const actual = computeCanContinue(sequence, captures, isConfirmed);
            const everyStepPresent = sequence.every((step) => captures[step.id] !== undefined);
            const expected = everyStepPresent && isConfirmed === true;
            expect(actual).toBe(expected);
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it('returns false when isConfirmed is false even if every step is present', () => {
    const sequence: CaptureStepConfig[] = [{ id: 'front', label: 'Front', aspectRatio: 1 }];
    const result: IdCaptureResult = { uri: 'file://front.jpg', width: 10, height: 10 };
    expect(computeCanContinue(sequence, { front: result }, false)).toBe(false);
  });

  it('returns false when any step is missing, regardless of isConfirmed', () => {
    const sequence: CaptureStepConfig[] = [
      { id: 'front', label: 'Front', aspectRatio: 1 },
      { id: 'back', label: 'Back', aspectRatio: 1 },
    ];
    const result: IdCaptureResult = { uri: 'file://front.jpg', width: 10, height: 10 };
    expect(computeCanContinue(sequence, { front: result }, true)).toBe(false);
  });

  it('returns true for an empty sequence when isConfirmed is true', () => {
    expect(computeCanContinue([], {}, true)).toBe(true);
  });
});
