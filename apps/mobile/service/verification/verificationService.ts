import { File } from 'expo-file-system'
import {
  CryptoDigestAlgorithm,
  CryptoEncoding,
  digestStringAsync,
  randomUUID,
} from 'expo-crypto'

import { supabase, type Database } from '@repo/supabase'

import { compressImage } from '@/utils/compressImage'
import type { IdCaptureResult } from '@/stores/useVerificationStore'

export const USER_VERIFICATION_BUCKET = 'user-verification'

export type UserVerificationRow =
  Database['public']['Tables']['user_verifications']['Row']

export interface VerificationImageInput {
  uri: string
  width: number
  height: number
}

export interface SubmitVerificationInput {
  idType: string
  idFront: VerificationImageInput
  /** Null for single-page IDs (e.g. Passport identity page). */
  idBack: VerificationImageInput | null
  selfie: VerificationImageInput
}

const FRONT_STEP_IDS = ['front', 'identity-page'] as const

/**
 * Maps raw capture results to a submission. Throws when anything required
 * is missing so the review screen (and tests) fail fast before uploading.
 */
export function buildVerificationInput(
  selectedId: string | null,
  captures: Record<string, IdCaptureResult>,
): SubmitVerificationInput {
  if (selectedId === null || selectedId.trim() === '') {
    throw new Error('Please select an ID type first.')
  }

  const idFront =
    FRONT_STEP_IDS.map((stepId) => captures[stepId]).find(Boolean) ?? null
  if (!idFront) {
    throw new Error('ID front photo is required.')
  }

  const needsBack = captures['front'] != null || captures['identity-page'] == null
  const idBack = captures['back'] ?? null
  if (needsBack && !idBack) {
    throw new Error('ID back photo is required.')
  }

  const selfie = captures['selfie'] ?? null
  if (!selfie) {
    throw new Error('A selfie holding your ID is required.')
  }

  return { idType: selectedId, idFront, idBack, selfie }
}

async function uploadVerificationImage(
  image: VerificationImageInput,
  userId: string,
  verificationId: string,
  fileName: 'id-front.jpg' | 'id-back.jpg' | 'selfie.jpg',
): Promise<string> {
  const compressed = await compressImage(image.uri, image.width, image.height)
  const bytes = await new File(compressed.uri).bytes()
  const path = `${userId}/${verificationId}/${fileName}`

  const { error } = await supabase.storage
    .from(USER_VERIFICATION_BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg' })

  if (error) {
    throw new Error(`Failed to upload ${fileName}: ${error.message}`)
  }

  return path
}

async function removeVerificationUploads(paths: string[]): Promise<void> {
  if (paths.length === 0) return

  const { error } = await supabase.storage
    .from(USER_VERIFICATION_BUCKET)
    .remove(paths)

  if (error) {
    console.warn('Cleanup failed for', paths, error.message)
  }
}

export async function fetchLatestVerification(
  userId: string,
): Promise<UserVerificationRow | null> {
  const { data, error } = await supabase
    .from('user_verifications')
    .select('*')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function fetchVerificationHistory(
  userId: string,
  limit = 20,
): Promise<UserVerificationRow[]> {
  const { data, error } = await supabase
    .from('user_verifications')
    .select('*')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return data ?? []
}

/**
 * Admin review-queue contract (backend-only; no admin UI in the repo yet).
 * RLS restricts rows to admins; each row's paths resolve to signed URLs via
 * resolvePrivateMediaUrls('user-verification', …).
 */
export async function fetchPendingVerifications(): Promise<UserVerificationRow[]> {
  const { data, error } = await supabase
    .from('user_verifications')
    .select('*')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })
    .limit(50)

  if (error) {
    throw error
  }

  return data ?? []
}

/**
 * Uploads ID front/back + selfie, then inserts the verification row.
 * Rolls back uploaded objects when a later upload or the insert fails, so
 * no orphaned verification files are left behind. Never reports success
 * unless the database row exists.
 */
export async function submitVerification(
  input: SubmitVerificationInput,
): Promise<UserVerificationRow> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  if (!user) {
    throw new Error('You must be signed in to submit verification.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, account_status')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('We could not load your profile. Please try again.')
  }

  if (profile.account_status === 'verified') {
    throw new Error('Your account is already verified.')
  }

  const { data: existingPending, error: pendingError } = await supabase
    .from('user_verifications')
    .select('id')
    .eq('user_id', profile.id)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle()

  if (pendingError) {
    throw pendingError
  }

  if (existingPending) {
    throw new Error('You already have a verification under review.')
  }

  const userId = profile.id
  const verificationId = randomUUID()
  const uploadedSoFar: string[] = []

  try {
    const idFrontPath = await uploadVerificationImage(
      input.idFront,
      userId,
      verificationId,
      'id-front.jpg',
    )
    uploadedSoFar.push(idFrontPath)

    let idBackPath: string | null = null
    if (input.idBack) {
      idBackPath = await uploadVerificationImage(
        input.idBack,
        userId,
        verificationId,
        'id-back.jpg',
      )
      uploadedSoFar.push(idBackPath)
    }

    const selfiePath = await uploadVerificationImage(
      input.selfie,
      userId,
      verificationId,
      'selfie.jpg',
    )
    uploadedSoFar.push(selfiePath)

    const { data, error: insertError } = await supabase
      .from('user_verifications')
      .insert({
        id: verificationId,
        user_id: userId,
        id_type: input.idType,
        id_front_path: idFrontPath,
        id_back_path: idBackPath,
        selfie_path: selfiePath,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      if (
        insertError.message.includes('user_verifications_one_pending_per_user')
      ) {
        throw new Error('You already have a verification under review.')
      }
      throw new Error(insertError.message)
    }

    if (!data) {
      throw new Error('Verification could not be confirmed. Please try again.')
    }

    return data
  } catch (err) {
    await removeVerificationUploads(uploadedSoFar)
    throw err instanceof Error ? err : new Error('Failed to submit verification.')
  }
}

// Desktop QR session interop ----------------------------------------------
// Lets the native app complete a verification session created on desktop
// (Profile → APT Passport → Verify Account → Generate code). The phone must
// be signed into the SAME account: RLS scopes every read below to the
// session owner, and the raw token is hashed client-side (only the SHA-256
// digest ever leaves the device), mirroring the web claim flow.

/** Opaque bearer token shape issued by the desktop session creator. */
const SESSION_TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/

export interface WebVerificationSession {
  token: string
  userId: string
  verificationId: string
  expiresAt: string
}

/**
 * Extract the opaque session token from a scanned QR value. Accepts the
 * full verification URL or the bare token. Pure — safe to unit test.
 */
export function extractSessionToken(scannedValue: string): string | null {
  const raw = scannedValue.trim()
  if (SESSION_TOKEN_SHAPE.test(raw)) return raw
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  const token = url.searchParams.get('token')
  return token !== null && SESSION_TOKEN_SHAPE.test(token) ? token : null
}

function hashSessionToken(token: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, token, {
    encoding: CryptoEncoding.HEX,
  })
}

async function getSessionCallerProfile(): Promise<{ userId: string }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  if (!user) {
    throw new Error('You must be signed in to continue verification.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, account_status')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('We could not load your profile. Please try again.')
  }

  if (profile.account_status === 'verified') {
    throw new Error('Your account is already verified.')
  }

  const { data: existingPending, error: pendingError } = await supabase
    .from('user_verifications')
    .select('id')
    .eq('user_id', profile.id)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle()

  if (pendingError) {
    throw pendingError
  }

  if (existingPending) {
    throw new Error('You already have a verification under review.')
  }

  return { userId: profile.id }
}

/**
 * Claim a desktop session WITHOUT consuming it: validates shape, owner,
 * liveness, and expiry, mirroring the web claim. The session stays active
 * while the capture wizard runs; abandoning it simply lets it expire.
 */
export async function claimWebVerificationSession(
  token: string,
): Promise<WebVerificationSession> {
  if (!SESSION_TOKEN_SHAPE.test(token)) {
    throw new Error('This verification code is invalid.')
  }

  const { userId } = await getSessionCallerProfile()

  const { data: session, error: sessionError } = await supabase
    .from('verification_sessions')
    .select('verification_id, status, expires_at')
    .eq('user_id', userId)
    .eq('token_hash', await hashSessionToken(token))
    .maybeSingle()

  if (sessionError) {
    throw sessionError
  }

  if (!session) {
    throw new Error('This code is invalid or belongs to another account.')
  }

  if (session.status !== 'active') {
    throw new Error('This code has already been used. Please scan a new code.')
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    throw new Error('This code has expired. Please scan a new code.')
  }

  return {
    token,
    userId,
    verificationId: session.verification_id,
    expiresAt: session.expires_at,
  }
}

/**
 * Submit captures against a claimed desktop session. Uploads land in the
 * session's own folder, then the verification row is inserted BEFORE the
 * session is consumed — a spent session therefore always has a recorded
 * submission. If the consume call fails after a successful insert, the row
 * is re-read and returned (review proceeds; the session simply expires).
 */
export async function submitSessionVerification(
  token: string,
  input: SubmitVerificationInput,
): Promise<UserVerificationRow> {
  const session = await claimWebVerificationSession(token)
  const userId = session.userId
  const verificationId = session.verificationId
  const uploadedSoFar: string[] = []
  let recorded: UserVerificationRow | null = null

  try {
    const idFrontPath = await uploadVerificationImage(
      input.idFront,
      userId,
      verificationId,
      'id-front.jpg',
    )
    uploadedSoFar.push(idFrontPath)

    let idBackPath: string | null = null
    if (input.idBack) {
      idBackPath = await uploadVerificationImage(
        input.idBack,
        userId,
        verificationId,
        'id-back.jpg',
      )
      uploadedSoFar.push(idBackPath)
    }

    const selfiePath = await uploadVerificationImage(
      input.selfie,
      userId,
      verificationId,
      'selfie.jpg',
    )
    uploadedSoFar.push(selfiePath)

    const { data, error: insertError } = await supabase
      .from('user_verifications')
      .insert({
        id: verificationId,
        user_id: userId,
        id_type: input.idType,
        id_front_path: idFrontPath,
        id_back_path: idBackPath,
        selfie_path: selfiePath,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      if (
        insertError.message.includes('user_verifications_one_pending_per_user')
      ) {
        throw new Error('You already have a verification under review.')
      }
      throw new Error(insertError.message)
    }

    if (!data) {
      throw new Error('Verification could not be confirmed. Please try again.')
    }

    recorded = data

    const { error: consumeError } = await supabase.rpc(
      'consume_verification_session',
      { p_token_hash: await hashSessionToken(token) },
    )

    if (consumeError) {
      const { data: confirmed } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('id', verificationId)
        .maybeSingle()

      if (confirmed) return confirmed
      throw new Error(consumeError.message)
    }

    return data
  } catch (err) {
    // Uploads referenced by a recorded row must be kept; anything else is
    // rolled back so no orphaned verification files are left behind.
    if (!recorded) {
      await removeVerificationUploads(uploadedSoFar)
    }
    throw err instanceof Error ? err : new Error('Failed to submit verification.')
  }
}
