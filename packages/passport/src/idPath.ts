const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const VERIFIED_ID_PATH = new RegExp(`^${UUID}/${UUID}/id-(front|back)\\.(jpe?g|png|webp)$`, 'i')

/**
 * True for the ID front or back capture of an account verification
 * (`{users.id}/{verification id}/id-front|id-back.*` in `user-verification`).
 * The selfie never matches.
 * Application and passport uploads never use that shape, so this decides the
 * bucket without probing.
 */
export function isVerifiedIdPath(path: string): boolean {
  return VERIFIED_ID_PATH.test(path)
}
