import type { DocumentFormat, IdCaptureResult } from '@/stores/useVerificationStore';

/**
 * Determines whether the "Continue to Selfie" control should be enabled.
 * Kind-agnostic and presence-driven: it does not matter which `kind` of
 * IdCaptureResult was produced for either field, only whether one exists.
 *
 * Validates: Requirements 5.1, 5.2, 5.3
 */
export function computeCanContinue(
  frontResult: IdCaptureResult | null,
  backResult: IdCaptureResult | null,
  isConfirmed: boolean,
): boolean {
  return frontResult !== null && backResult !== null && isConfirmed === true;
}

/**
 * Enforces the Format/Result Invariant: an IdCaptureResult whose `kind` is
 * inconsistent with the newly selected DocumentFormat is cleared (returns
 * null). Otherwise the result is returned unchanged.
 *
 * - newFormat === 'digital' clears a 'camera'-kind result.
 * - newFormat === 'physical' clears an 'image'- or 'file'-kind result.
 *
 * Validates: Requirements 5.4
 */
export function applyFormatSwitchClearing(
  result: IdCaptureResult | null,
  newFormat: DocumentFormat,
): IdCaptureResult | null {
  if (result === null) return null;

  if (newFormat === 'digital' && result.kind === 'camera') return null;
  if (newFormat === 'physical' && (result.kind === 'image' || result.kind === 'file')) {
    return null;
  }

  return result;
}
