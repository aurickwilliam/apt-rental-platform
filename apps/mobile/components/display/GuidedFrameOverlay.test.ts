import fc from 'fast-check';

import { CR80_ASPECT_RATIO, computeFillRatio, computeGuidedFrameRect } from './GuidedFrameOverlay';

const FLOAT_TOLERANCE = 1e-6;

describe('computeGuidedFrameRect / computeFillRatio', () => {
  it(
    'Feature: id-verification-capture, Property 3: Guided frame preserves CR80 aspect ratio across all viewport sizes',
    () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 100_000, noNaN: true }),
          fc.float({ min: 1, max: 100_000, noNaN: true }),
          (viewportWidth, viewportHeight) => {
            const frame = computeGuidedFrameRect(viewportWidth, viewportHeight);
            const ratio = frame.width / frame.height;

            expect(Math.abs(ratio - CR80_ASPECT_RATIO)).toBeLessThanOrEqual(FLOAT_TOLERANCE);

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
});
