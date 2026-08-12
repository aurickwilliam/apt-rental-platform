import fc from 'fast-check';

import { VALID_IDS, SECONDARY_IDS } from '@repo/constants';

import {
  ALL_SUPPORTED_ID_TYPES,
  CARD_ASPECT_RATIO,
  PASSPORT_ASPECT_RATIO,
  SELFIE_STEP,
  getCaptureSequence,
  getNextCaptureStep,
} from '@/app/(auth)/verify-account/constants/captureSequences';

const NON_PASSPORT_ID_TYPES = ALL_SUPPORTED_ID_TYPES.filter((id) => id !== 'Passport');

describe('getCaptureSequence', () => {
  it('returns [] for null', () => {
    expect(getCaptureSequence(null)).toEqual([]);
  });

  it('returns the standard front/back CARD_SEQUENCE for each non-Passport VALID_IDS/SECONDARY_IDS entry', () => {
    for (const idType of NON_PASSPORT_ID_TYPES) {
      const sequence = getCaptureSequence(idType);
      expect(sequence).toEqual([
        { id: 'front', label: 'Front', aspectRatio: CARD_ASPECT_RATIO, cameraFacing: 'back', guideShape: 'rectangle' },
        { id: 'back', label: 'Back', aspectRatio: CARD_ASPECT_RATIO, cameraFacing: 'back', guideShape: 'rectangle' },
      ]);
    }
  });

  it('returns the single-step PASSPORT_SEQUENCE for "Passport"', () => {
    const sequence = getCaptureSequence('Passport');
    expect(sequence).toHaveLength(1);
    expect(sequence[0]).toMatchObject({
      id: 'identity-page',
      label: 'Identity Page',
      cameraFacing: 'back',
      guideShape: 'rectangle',
    });
  });

  it('configures the selfie step for front-camera capture with a circular guide', () => {
    expect(SELFIE_STEP).toMatchObject({
      id: 'selfie',
      cameraFacing: 'front',
      guideShape: 'circle',
    });
  });

  it("Passport's identity-page step aspectRatio is === the exported PASSPORT_ASPECT_RATIO constant (reference equality, not a duplicated literal)", () => {
    const sequence = getCaptureSequence('Passport');
    expect(sequence[0].aspectRatio).toBe(PASSPORT_ASPECT_RATIO);
  });

  it('returns CARD_SEQUENCE (fallback behavior) for an arbitrary unrecognized string', () => {
    const sequence = getCaptureSequence('Some Unrecognized ID Type');
    expect(sequence).toEqual([
      { id: 'front', label: 'Front', aspectRatio: CARD_ASPECT_RATIO, cameraFacing: 'back', guideShape: 'rectangle' },
      { id: 'back', label: 'Back', aspectRatio: CARD_ASPECT_RATIO, cameraFacing: 'back', guideShape: 'rectangle' },
    ]);
  });

  it('VALID_IDS and SECONDARY_IDS together account for exactly thirteen supported ID types, twelve of them non-Passport', () => {
    expect(VALID_IDS.length + SECONDARY_IDS.length).toBe(13);
    expect(NON_PASSPORT_ID_TYPES).toHaveLength(12);
  });
});

describe('getNextCaptureStep', () => {
  it('returns the next ordered card step for Front and no step after Back', () => {
    expect(getNextCaptureStep('National ID (PhilSys/PhilID)', 'front')).toMatchObject({ id: 'back' });
    expect(getNextCaptureStep('National ID (PhilSys/PhilID)', 'back')).toBeNull();
  });

  it('returns no next step for the single Passport identity page or an unknown step', () => {
    expect(getNextCaptureStep('Passport', 'identity-page')).toBeNull();
    expect(getNextCaptureStep('Passport', 'front')).toBeNull();
  });
});

describe('getCaptureSequence determinism (unit-level sanity check)', () => {
  it(
    'Feature: id-verification-capture, Property 2: Capture sequence lookup is deterministic',
    () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constantFrom(...ALL_SUPPORTED_ID_TYPES),
            fc.constant(null),
            fc.string(),
          ),
          (idType) => {
            const first = getCaptureSequence(idType);
            const second = getCaptureSequence(idType);

            expect(second).toEqual(first);

            if (idType === null) {
              expect(first).toEqual([]);
            }
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});
