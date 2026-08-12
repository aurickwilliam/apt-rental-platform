import type { IdCaptureResult } from '@/stores/useVerificationStore';
import type { CaptureStepConfig } from '../constants/captureSequences';

export interface CaptureProgress {
  steps: Array<{ step: CaptureStepConfig; result: IdCaptureResult | null }>;
  isComplete: boolean;
}

/**
 * Reports, for an arbitrary-length Capture_Sequence and a captures map that
 * may contain any subset of the sequence's step ids (or none, or extra
 * unrelated ids), each step's current result and whether every step in the
 * sequence has a persisted result.
 *
 * Validates: Requirements 2.3, 2.4
 */
export function getCaptureProgress(
  sequence: CaptureStepConfig[],
  captures: Record<string, IdCaptureResult>,
): CaptureProgress {
  const steps = sequence.map((step) => ({ step, result: captures[step.id] ?? null }));
  return { steps, isComplete: steps.every((s) => s.result !== null) };
}

/**
 * Determines whether the "Continue to Selfie" control should be enabled:
 * every Capture_Step in the sequence must have a persisted result, and the
 * confirmation checkbox must be selected.
 *
 * Validates: Requirements 2.3, 2.4
 */
export function computeCanContinue(
  sequence: CaptureStepConfig[],
  captures: Record<string, IdCaptureResult>,
  isConfirmed: boolean,
): boolean {
  return getCaptureProgress(sequence, captures).isComplete && isConfirmed === true;
}
