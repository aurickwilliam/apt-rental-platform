import { isExpiredDate } from './expiry'

export interface VerifiedPassportPathRow {
  storage_path: string
  storage_path_back: string | null
  expires_at: string | null
}

/**
 * Which of the requested storage paths belong to a verified, unexpired
 * passport document. A verified ID badges both its front and back; an
 * expired document no longer counts as verified. Rows are expected to be
 * pre-filtered to `is_verified`.
 */
export function verifiedPassportPaths(
  rows: readonly VerifiedPassportPathRow[],
  requestedPaths: readonly string[],
  today = new Date()
): Set<string> {
  const requested = new Set(requestedPaths.filter(Boolean))
  const verified = new Set<string>()
  for (const row of rows) {
    if (isExpiredDate(row.expires_at, today)) continue
    for (const path of [row.storage_path, row.storage_path_back]) {
      if (path && requested.has(path)) verified.add(path)
    }
  }
  return verified
}
