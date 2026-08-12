import { VALID_IDS, SECONDARY_IDS } from '@repo/constants'

export type CaptureCameraFacing = 'front' | 'back'
export type CaptureGuideShape = 'rectangle' | 'circle'

export interface CaptureStepConfig {
  /** Stable identifier for this step, persisted as the key in the store's captures map. */
  id: string
  /** Tenant-facing label, e.g. "Front", "Back", "Identity Page". */
  label: string
  /** Guided_Frame aspect ratio (width / height) for this step. */
  aspectRatio: number
  /** Device camera used to capture this step. Defaults to the rear camera. */
  cameraFacing?: CaptureCameraFacing
  /** Visual shape of the guided capture frame. Defaults to a rectangle. */
  guideShape?: CaptureGuideShape
}

/** CR80 card aspect ratio (width:height) — unchanged from the prior design. */
export const CARD_ASPECT_RATIO = 3.375 / 2.125

/**
 * ICAO Doc 9303 TD3 booklet page aspect ratio (~125mm x 88mm), confirmed as
 * the target aspect ratio for the passport identity/photo page. Kept as a
 * single, explicitly named, overridable constant (not inlined into
 * PASSPORT_SEQUENCE) so it may be revised later without any architectural
 * change to the capture-sequence mechanism, per requirements.md's Resolved
 * Product Decisions.
 */
export const PASSPORT_ASPECT_RATIO = 125 / 88

/**
 * Square (1:1) guide frame used for the tenant's selfie capture. The selfie
 * is captured through the same live-capture screen as ID steps — the screen
 * special-cases this step id and bypasses the ID-type sequence lookup.
 */
export const SELFIE_STEP: CaptureStepConfig = {
  id: 'selfie',
  label: 'Selfie',
  aspectRatio: 1,
  cameraFacing: 'front',
  guideShape: 'circle',
}

const CARD_SEQUENCE: CaptureStepConfig[] = [
  { id: 'front', label: 'Front', aspectRatio: CARD_ASPECT_RATIO, cameraFacing: 'back', guideShape: 'rectangle' },
  { id: 'back', label: 'Back', aspectRatio: CARD_ASPECT_RATIO, cameraFacing: 'back', guideShape: 'rectangle' },
]

const PASSPORT_SEQUENCE: CaptureStepConfig[] = [
  {
    id: 'identity-page',
    label: 'Identity Page',
    aspectRatio: PASSPORT_ASPECT_RATIO,
    cameraFacing: 'back',
    guideShape: 'rectangle',
  },
]

const SEQUENCE_BY_ID_TYPE: Record<string, CaptureStepConfig[]> = {
  Passport: PASSPORT_SEQUENCE,
  // All other VALID_IDS/SECONDARY_IDS entries fall back to CARD_SEQUENCE below.
}

/**
 * Returns the ordered Capture_Sequence for a Selected_Id_Type. Falls back to
 * the standard two-step card sequence for any ID type not explicitly listed
 * (i.e. every current VALID_IDS/SECONDARY_IDS entry except Passport) — this
 * mapping (Passport = single identity-page step; all other current ID types
 * = standard front/back CR80 sequence) is a confirmed product decision, per
 * requirements.md's Resolved Product Decisions.
 *
 * Validates: Requirements 2.1
 */
export function getCaptureSequence(idType: string | null): CaptureStepConfig[] {
  if (idType == null) return []
  return SEQUENCE_BY_ID_TYPE[idType] ?? CARD_SEQUENCE
}

/**
 * Resolves the next configured capture step after a completed step. Returns
 * null when the current step is unknown or is the final step in its sequence.
 */
export function getNextCaptureStep(
  idType: string | null,
  stepId: string,
): CaptureStepConfig | null {
  const sequence = getCaptureSequence(idType)
  const currentStepIndex = sequence.findIndex((step) => step.id === stepId)

  if (currentStepIndex < 0) return null

  return sequence[currentStepIndex + 1] ?? null
}

// Re-exported for test coverage of the confirmed ID lists this mapping is
// defined against (see captureSequences.test.ts).
export const ALL_SUPPORTED_ID_TYPES = [...VALID_IDS, ...SECONDARY_IDS]
