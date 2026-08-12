import fc from 'fast-check';

import type { DocumentFormat, IdCaptureResult } from '@/stores/useVerificationStore';

import { applyFormatSwitchClearing, computeCanContinue } from './gating';

const cameraResultArbitrary: fc.Arbitrary<IdCaptureResult> = fc.record({
  kind: fc.constant('camera' as const),
  asset: fc.record({
    uri: fc.string(),
    width: fc.integer({ min: 1, max: 10000 }),
    height: fc.integer({ min: 1, max: 10000 }),
  }),
});

const imageResultArbitrary: fc.Arbitrary<IdCaptureResult> = fc.record({
  kind: fc.constant('image' as const),
  asset: fc.record({
    uri: fc.string(),
    width: fc.integer({ min: 1, max: 10000 }),
    height: fc.integer({ min: 1, max: 10000 }),
  }),
}) as unknown as fc.Arbitrary<IdCaptureResult>;

const fileResultArbitrary: fc.Arbitrary<IdCaptureResult> = fc.record({
  kind: fc.constant('file' as const),
  asset: fc.record({
    uri: fc.string(),
    name: fc.string(),
    size: fc.option(fc.integer({ min: 0, max: 10_000_000 }), { nil: undefined }),
  }),
}) as unknown as fc.Arbitrary<IdCaptureResult>;

const idCaptureResultArbitrary: fc.Arbitrary<IdCaptureResult | null> = fc.option(
  fc.oneof(cameraResultArbitrary, imageResultArbitrary, fileResultArbitrary),
  { nil: null },
);

const documentFormatArbitrary: fc.Arbitrary<DocumentFormat> = fc.constantFrom(
  'physical',
  'digital',
);

describe('computeCanContinue', () => {
  it(
    'Feature: id-verification-capture, Property 1: Continue-gating is kind-agnostic and presence-driven',
    () => {
      fc.assert(
        fc.property(
          idCaptureResultArbitrary,
          idCaptureResultArbitrary,
          fc.boolean(),
          (frontResult, backResult, isConfirmed) => {
            const actual = computeCanContinue(frontResult, backResult, isConfirmed);
            const expected =
              frontResult !== null && backResult !== null && isConfirmed === true;
            expect(actual).toBe(expected);
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});

describe('applyFormatSwitchClearing', () => {
  it(
    'Feature: id-verification-capture, Property 2: Format-switch clearing preserves kind/format consistency',
    () => {
      fc.assert(
        fc.property(idCaptureResultArbitrary, documentFormatArbitrary, (result, newFormat) => {
          const cleared = applyFormatSwitchClearing(result, newFormat);

          if (cleared === null) {
            return true;
          }

          if (newFormat === 'physical') {
            return cleared.kind === 'camera';
          }

          return cleared.kind === 'image' || cleared.kind === 'file';
        }),
        { numRuns: 100 },
      );
    },
  );
});
