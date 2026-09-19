import { File } from 'expo-file-system'
import { randomUUID } from 'expo-crypto'

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
