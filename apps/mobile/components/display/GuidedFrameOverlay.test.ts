import fc from 'fast-check';

import { CARD_ASPECT_RATIO, computeFillRatio, computeGuidedFrameRect } from './GuidedFrameOverlay';

const FLOAT_TOLERANCE = 1e-6;

describe('computeGuidedFrameRect / computeFillRatio', () => {
  it(
    'Feature: id-verification-capture, Property 3: Guided frame preserves its configured aspect ratio across all viewport sizes',
    () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 100_000, noNaN: true }),
          fc.float({ min: 1, max: 100_000, noNaN: true }),
          fc.float({ min: Math.fround(0.01), max: 100, noNaN: true }),
          (viewportWidth, viewportHeight, aspectRatio) => {
            const frame = computeGuidedFrameRect(viewportWidth, viewportHeight, aspectRatio);
            const ratio = frame.width / frame.height;

            expect(Math.abs(ratio - aspectRatio)).toBeLessThanOrEqual(FLOAT_TOLERANCE * Math.max(1, aspectRatio));

            const fillRatio = computeFillRatio(frame, viewportWidth, viewportHeight);
            expect(fillRatio).toBeGreaterThan(0);
            expect(fillRatio).toBeLessThanOrEqual(1 + FLOAT_TOLERANCE);
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it('centers the guided frame within the viewport', () => {
    const frame = computeGuidedFrameRect(1000, 500);
    expect(frame.x).toBeCloseTo((1000 - frame.width) / 2);
    expect(frame.y).toBeCloseTo((500 - frame.height) / 2);
  });

  it('defaults to CARD_ASPECT_RATIO when no aspectRatio is passed', () => {
    const frame = computeGuidedFrameRect(1000, 500);
    expect(frame.width / frame.height).toBeCloseTo(CARD_ASPECT_RATIO);
  });

  it('applies an explicitly-passed non-default aspect ratio (e.g. the Passport ratio), not silently falling back to the default', () => {
    const passportAspectRatio = 125 / 88;
    const frame = computeGuidedFrameRect(1000, 500, passportAspectRatio);

    expect(frame.width / frame.height).toBeCloseTo(passportAspectRatio);
    expect(frame.width / frame.height).not.toBeCloseTo(CARD_ASPECT_RATIO, 2);
  });
});
