import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import type { ImageResult } from 'expo-image-manipulator'

const MAX_LONG_EDGE = 1600
const COMPRESS_QUALITY = 0.7

export const APARTMENT_FULL_MAX_LONG_EDGE = 2048
export const APARTMENT_FULL_QUALITY = 0.8
export const APARTMENT_THUMB_MAX_LONG_EDGE = 480
export const APARTMENT_THUMB_QUALITY = 0.75

export const PROFILE_AVATAR_MAX_LONG_EDGE = 800
export const PROFILE_BACKGROUND_MAX_LONG_EDGE = 1920
export const PROFILE_QUALITY = 0.8

/**
 * Resizes (capped at maxLongEdge on the long edge) and re-encodes an image as JPEG.
 * Reduces upload size before persisting to Supabase Storage.
 */
export async function compressImageTo(
  uri: string,
  width: number,
  height: number,
  maxLongEdge: number,
  quality: number,
): Promise<ImageResult> {
  const scale = Math.min(1, maxLongEdge / Math.max(width, height))
  const targetWidth = Math.round(width * scale)
  const targetHeight = Math.round(height * scale)

  const context = ImageManipulator.manipulate(uri)
  if (scale < 1) {
    context.resize({ width: targetWidth, height: targetHeight })
  }

  const imageRef = await context.renderAsync()
  return imageRef.saveAsync({
    compress: quality,
    format: SaveFormat.JPEG,
  })
}

/**
 * Compresses with the default profile (1600px long edge, quality 0.7).
 * Used by document/evidence uploads; kept for backwards compatibility.
 */
export async function compressImage(
  uri: string,
  width: number,
  height: number,
): Promise<ImageResult> {
  return compressImageTo(uri, width, height, MAX_LONG_EDGE, COMPRESS_QUALITY)
}

/**
 * Produces the two-tier apartment image set from a single source:
 * a full-size variant (gallery/lightbox) and a small thumbnail (cards).
 */
export async function buildImageTiers(
  uri: string,
  width: number,
  height: number,
): Promise<{ fullUri: string; thumbUri: string }> {
  const [full, thumb] = await Promise.all([
    compressImageTo(uri, width, height, APARTMENT_FULL_MAX_LONG_EDGE, APARTMENT_FULL_QUALITY),
    compressImageTo(uri, width, height, APARTMENT_THUMB_MAX_LONG_EDGE, APARTMENT_THUMB_QUALITY),
  ])

  return { fullUri: full.uri, thumbUri: thumb.uri }
}
